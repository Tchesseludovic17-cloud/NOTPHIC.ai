import { Router } from "express";
import { db } from "@workspace/db";
import { alertesTable, clientsTable, feedbackTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middlewares/requireAuth";

const router = Router();

async function formatAlerte(alerte: typeof alertesTable.$inferSelect) {
  const [client] = await db.select({ nom: clientsTable.nom }).from(clientsTable).where(eq(clientsTable.id, alerte.client_id)).limit(1);
  return {
    ...alerte,
    client_nom: client?.nom ?? "Client inconnu",
    created_at: alerte.created_at.toISOString(),
    traite_at: alerte.traite_at?.toISOString() ?? null,
  };
}

router.get("/alertes", requireAuth, async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    const { statut } = req.query;
    let rows = await db
      .select({ alerte: alertesTable, client_nom: clientsTable.nom })
      .from(alertesTable)
      .leftJoin(clientsTable, eq(alertesTable.client_id, clientsTable.id))
      .where(eq(alertesTable.user_id, userId))
      .orderBy(alertesTable.created_at);

    if (statut && statut !== "tous") {
      rows = rows.filter((r) => r.alerte.statut === statut);
    }

    return res.json(
      rows.map((r) => ({
        ...r.alerte,
        client_nom: r.client_nom ?? "Client inconnu",
        created_at: r.alerte.created_at.toISOString(),
        traite_at: r.alerte.traite_at?.toISOString() ?? null,
      }))
    );
  } catch {
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

router.patch("/alertes/:id/traiter", requireAuth, async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID invalide" });

    const [alerte] = await db
      .update(alertesTable)
      .set({ statut: "traite", traite_at: new Date(), suivi_demande: false })
      .where(and(eq(alertesTable.id, id), eq(alertesTable.user_id, userId)))
      .returning();

    if (!alerte) return res.status(404).json({ error: "Alerte non trouvée" });
    return res.json(await formatAlerte(alerte));
  } catch {
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/alertes/:id/suivi", requireAuth, async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID invalide" });

    const { repondu } = req.body as { repondu: boolean };
    const typeFeedback = repondu ? "relance_reussie" : "relance_echouee";

    const [alerte] = await db
      .update(alertesTable)
      .set({ suivi_demande: true, suivi_repondu: repondu })
      .where(and(eq(alertesTable.id, id), eq(alertesTable.user_id, userId)))
      .returning();

    if (!alerte) return res.status(404).json({ error: "Alerte non trouvée" });

    await db.insert(feedbackTable).values({
      user_id: userId,
      alerte_id: id,
      type_feedback: typeFeedback,
    });

    return res.json(await formatAlerte(alerte));
  } catch {
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
