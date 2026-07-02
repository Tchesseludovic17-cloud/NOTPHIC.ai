import { Router } from "express";
import { db } from "@workspace/db";
import { clientsTable, alertesTable, feedbackTable, historiqueVisitesTable } from "@workspace/db";
import { eq, and, sql, gte } from "drizzle-orm";

const router = Router();
const DEMO_USER_ID = 1;

router.get("/company-twin", async (_req, res) => {
  try {
    // Total clients
    const [{ total_clients }] = await db
      .select({ total_clients: sql<number>`count(*)::int` })
      .from(clientsTable)
      .where(eq(clientsTable.user_id, DEMO_USER_ID));

    // Clients with active alerts
    const clientsEnAlerteRows = await db
      .select({ client_id: alertesTable.client_id })
      .from(alertesTable)
      .where(and(eq(alertesTable.user_id, DEMO_USER_ID), eq(alertesTable.statut, "non_lu")))
      .groupBy(alertesTable.client_id);
    const clients_en_alerte = clientsEnAlerteRows.length;
    const clients_actifs = Math.max(0, total_clients - clients_en_alerte);

    // Average visit frequency across all clients with a known frequency
    const clientsAvecFreq = await db
      .select({ frequence: clientsTable.frequence_moyenne_jours })
      .from(clientsTable)
      .where(eq(clientsTable.user_id, DEMO_USER_ID));

    const freqs = clientsAvecFreq
      .map((c) => c.frequence)
      .filter((f): f is number => f !== null && f > 0);
    const frequence_moyenne_jours =
      freqs.length > 0
        ? Math.round(freqs.reduce((a, b) => a + b, 0) / freqs.length)
        : null;

    // Relance success rate from feedback table
    const [{ total_relances }] = await db
      .select({ total_relances: sql<number>`count(*)::int` })
      .from(feedbackTable)
      .where(
        and(
          eq(feedbackTable.user_id, DEMO_USER_ID),
          sql`${feedbackTable.type_feedback} IN ('relance_reussie', 'relance_echouee')`
        )
      );

    const [{ relances_reussies }] = await db
      .select({ relances_reussies: sql<number>`count(*)::int` })
      .from(feedbackTable)
      .where(
        and(
          eq(feedbackTable.user_id, DEMO_USER_ID),
          eq(feedbackTable.type_feedback, "relance_reussie")
        )
      );

    const taux_relance_reussie =
      total_relances > 0
        ? Math.round((relances_reussies / total_relances) * 100)
        : null;

    // Month-by-month history — last 12 months
    // Alerts generated per month
    const alertesParMois = await db
      .select({
        mois: sql<string>`to_char(${alertesTable.created_at}, 'YYYY-MM')`,
        count: sql<number>`count(*)::int`,
      })
      .from(alertesTable)
      .where(
        and(
          eq(alertesTable.user_id, DEMO_USER_ID),
          gte(alertesTable.created_at, sql`now() - interval '12 months'`)
        )
      )
      .groupBy(sql`to_char(${alertesTable.created_at}, 'YYYY-MM')`);

    // Clients saved per month (relance_reussie feedback)
    const sauveParMois = await db
      .select({
        mois: sql<string>`to_char(${feedbackTable.created_at}, 'YYYY-MM')`,
        count: sql<number>`count(*)::int`,
      })
      .from(feedbackTable)
      .where(
        and(
          eq(feedbackTable.user_id, DEMO_USER_ID),
          eq(feedbackTable.type_feedback, "relance_reussie"),
          gte(feedbackTable.created_at, sql`now() - interval '12 months'`)
        )
      )
      .groupBy(sql`to_char(${feedbackTable.created_at}, 'YYYY-MM')`);

    // Build month map for the last 12 months
    const monthsMap: Record<string, { alertes_generees: number; clients_sauves: number }> = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthsMap[key] = { alertes_generees: 0, clients_sauves: 0 };
    }

    for (const row of alertesParMois) {
      if (monthsMap[row.mois]) monthsMap[row.mois].alertes_generees = row.count;
    }
    for (const row of sauveParMois) {
      if (monthsMap[row.mois]) monthsMap[row.mois].clients_sauves = row.count;
    }

    const historique_mensuel = Object.entries(monthsMap).map(([mois, data]) => ({
      mois,
      ...data,
    }));

    return res.json({
      total_clients,
      clients_actifs,
      clients_en_alerte,
      frequence_moyenne_jours,
      taux_relance_reussie,
      total_relances,
      relances_reussies,
      historique_mensuel,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
