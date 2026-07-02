import { Router } from "express";
import { db } from "@workspace/db";
import { clientsTable, alertesTable, feedbackTable } from "@workspace/db";
import { eq, and, sql, gte } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middlewares/requireAuth";

const router = Router();

router.get("/company-twin", requireAuth, async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;

    const [{ total_clients }] = await db
      .select({ total_clients: sql<number>`count(*)::int` })
      .from(clientsTable)
      .where(eq(clientsTable.user_id, userId));

    const clientsEnAlerteRows = await db
      .select({ client_id: alertesTable.client_id })
      .from(alertesTable)
      .where(and(eq(alertesTable.user_id, userId), eq(alertesTable.statut, "non_lu")))
      .groupBy(alertesTable.client_id);
    const clients_en_alerte = clientsEnAlerteRows.length;
    const clients_actifs = Math.max(0, total_clients - clients_en_alerte);

    const clientsAvecFreq = await db
      .select({ frequence: clientsTable.frequence_moyenne_jours })
      .from(clientsTable)
      .where(eq(clientsTable.user_id, userId));

    const freqs = clientsAvecFreq
      .map((c) => c.frequence)
      .filter((f): f is number => f !== null && f > 0);
    const frequence_moyenne_jours =
      freqs.length > 0
        ? Math.round(freqs.reduce((a, b) => a + b, 0) / freqs.length)
        : null;

    const [{ total_relances }] = await db
      .select({ total_relances: sql<number>`count(*)::int` })
      .from(feedbackTable)
      .where(
        and(
          eq(feedbackTable.user_id, userId),
          sql`${feedbackTable.type_feedback} IN ('relance_reussie', 'relance_echouee')`
        )
      );

    const [{ relances_reussies }] = await db
      .select({ relances_reussies: sql<number>`count(*)::int` })
      .from(feedbackTable)
      .where(and(eq(feedbackTable.user_id, userId), eq(feedbackTable.type_feedback, "relance_reussie")));

    const taux_relance_reussie =
      total_relances > 0 ? Math.round((relances_reussies / total_relances) * 100) : null;

    const alertesParMois = await db
      .select({
        mois: sql<string>`to_char(${alertesTable.created_at}, 'YYYY-MM')`,
        count: sql<number>`count(*)::int`,
      })
      .from(alertesTable)
      .where(and(eq(alertesTable.user_id, userId), gte(alertesTable.created_at, sql`now() - interval '12 months'`)))
      .groupBy(sql`to_char(${alertesTable.created_at}, 'YYYY-MM')`);

    const sauveParMois = await db
      .select({
        mois: sql<string>`to_char(${feedbackTable.created_at}, 'YYYY-MM')`,
        count: sql<number>`count(*)::int`,
      })
      .from(feedbackTable)
      .where(
        and(
          eq(feedbackTable.user_id, userId),
          eq(feedbackTable.type_feedback, "relance_reussie"),
          gte(feedbackTable.created_at, sql`now() - interval '12 months'`)
        )
      )
      .groupBy(sql`to_char(${feedbackTable.created_at}, 'YYYY-MM')`);

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

    const historique_mensuel = Object.entries(monthsMap).map(([mois, data]) => ({ mois, ...data }));

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
