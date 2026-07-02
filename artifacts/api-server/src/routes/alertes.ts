import { Router } from "express";
import { db } from "@workspace/db";
import { alertesTable, clientsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

const DEMO_USER_ID = 1;

router.get("/alertes", async (req, res) => {
  try {
    const { statut } = req.query;

    let alertes = await db
      .select({
        alerte: alertesTable,
        client_nom: clientsTable.nom,
      })
      .from(alertesTable)
      .leftJoin(clientsTable, eq(alertesTable.client_id, clientsTable.id))
      .where(eq(alertesTable.user_id, DEMO_USER_ID))
      .orderBy(alertesTable.created_at);

    if (statut && statut !== "tous") {
      alertes = alertes.filter((a) => a.alerte.statut === statut);
    }

    const result = alertes.map((a) => ({
      ...a.alerte,
      client_nom: a.client_nom ?? "Client inconnu",
      created_at: a.alerte.created_at.toISOString(),
    }));

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

router.patch("/alertes/:id/traiter", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID invalide" });

    const [alerte] = await db
      .update(alertesTable)
      .set({ statut: "traite" })
      .where(and(eq(alertesTable.id, id), eq(alertesTable.user_id, DEMO_USER_ID)))
      .returning();

    if (!alerte) return res.status(404).json({ error: "Alerte non trouvée" });

    const [client] = await db
      .select({ nom: clientsTable.nom })
      .from(clientsTable)
      .where(eq(clientsTable.id, alerte.client_id))
      .limit(1);

    return res.json({
      ...alerte,
      client_nom: client?.nom ?? "Client inconnu",
      created_at: alerte.created_at.toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
