import { Router } from "express";
import { db } from "@workspace/db";
import { clientsTable, alertesTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";

const router = Router();
const DEMO_USER_ID = 1;

router.get("/stats", async (_req, res) => {
  try {
    const [{ total_clients }] = await db
      .select({ total_clients: sql<number>`count(*)::int` })
      .from(clientsTable)
      .where(eq(clientsTable.user_id, DEMO_USER_ID));

    const [{ alertes_actives }] = await db
      .select({ alertes_actives: sql<number>`count(*)::int` })
      .from(alertesTable)
      .where(and(eq(alertesTable.user_id, DEMO_USER_ID), eq(alertesTable.statut, "non_lu")));

    const clientsAvecAlertes = await db
      .select({ client_id: alertesTable.client_id })
      .from(alertesTable)
      .where(and(eq(alertesTable.user_id, DEMO_USER_ID), eq(alertesTable.statut, "non_lu")))
      .groupBy(alertesTable.client_id);

    const clients_a_risque = clientsAvecAlertes.length;
    const clients_ok = Math.max(0, total_clients - clients_a_risque);

    const alertesParType = await db
      .select({ type_signal: alertesTable.type_signal, count: sql<number>`count(*)::int` })
      .from(alertesTable)
      .where(and(eq(alertesTable.user_id, DEMO_USER_ID), eq(alertesTable.statut, "non_lu")))
      .groupBy(alertesTable.type_signal);

    const [{ alertes_en_attente_suivi }] = await db
      .select({ alertes_en_attente_suivi: sql<number>`count(*)::int` })
      .from(alertesTable)
      .where(
        and(
          eq(alertesTable.user_id, DEMO_USER_ID),
          eq(alertesTable.statut, "traite"),
          eq(alertesTable.suivi_demande, false)
        )
      );

    return res.json({ total_clients, alertes_actives, clients_a_risque, clients_ok, alertes_par_type: alertesParType, alertes_en_attente_suivi });
  } catch {
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
