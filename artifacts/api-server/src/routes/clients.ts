import { Router } from "express";
import { db } from "@workspace/db";
import { clientsTable, alertesTable, historiqueVisitesTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import {
  CreateClientBody,
  UpdateClientBody,
} from "@workspace/api-zod";

const router = Router();

const DEMO_USER_ID = 1;

async function getClientWithAlerts(clientId: number) {
  const [client] = await db
    .select()
    .from(clientsTable)
    .where(and(eq(clientsTable.id, clientId), eq(clientsTable.user_id, DEMO_USER_ID)))
    .limit(1);

  if (!client) return null;

  const [alertCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(alertesTable)
    .where(and(eq(alertesTable.client_id, clientId), eq(alertesTable.statut, "non_lu")));

  return {
    ...client,
    date_dernier_contact: client.date_dernier_contact ?? null,
    derniere_visite: client.derniere_visite ?? null,
    date_dernier_rdv: client.date_dernier_rdv ?? null,
    date_prochain_rdv: client.date_prochain_rdv ?? null,
    abonnement_date_renouvellement: client.abonnement_date_renouvellement ?? null,
    nb_alertes_actives: alertCount?.count ?? 0,
    created_at: client.created_at.toISOString(),
  };
}

router.get("/clients", async (_req, res) => {
  try {
    const clients = await db
      .select()
      .from(clientsTable)
      .where(eq(clientsTable.user_id, DEMO_USER_ID))
      .orderBy(clientsTable.created_at);

    const clientIds = clients.map((c) => c.id);
    let alertCounts: Record<number, number> = {};

    if (clientIds.length > 0) {
      const counts = await db
        .select({
          client_id: alertesTable.client_id,
          count: sql<number>`count(*)::int`,
        })
        .from(alertesTable)
        .where(
          and(
            eq(alertesTable.statut, "non_lu"),
            eq(alertesTable.user_id, DEMO_USER_ID)
          )
        )
        .groupBy(alertesTable.client_id);

      alertCounts = Object.fromEntries(counts.map((c) => [c.client_id, c.count]));
    }

    const result = clients.map((c) => ({
      ...c,
      date_dernier_contact: c.date_dernier_contact ?? null,
      derniere_visite: c.derniere_visite ?? null,
      date_dernier_rdv: c.date_dernier_rdv ?? null,
      date_prochain_rdv: c.date_prochain_rdv ?? null,
      abonnement_date_renouvellement: c.abonnement_date_renouvellement ?? null,
      nb_alertes_actives: alertCounts[c.id] ?? 0,
      created_at: c.created_at.toISOString(),
    }));

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/clients", async (req, res) => {
  try {
    const parsed = CreateClientBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Données invalides" });
    }

    const [client] = await db
      .insert(clientsTable)
      .values({
        user_id: DEMO_USER_ID,
        nom: parsed.data.nom,
        telephone: parsed.data.telephone ?? null,
        email: parsed.data.email ?? null,
        derniere_visite: parsed.data.derniere_visite ?? null,
        frequence_moyenne_jours: parsed.data.frequence_moyenne_jours ?? null,
        dernier_rdv_statut: parsed.data.dernier_rdv_statut ?? null,
        date_dernier_rdv: parsed.data.date_dernier_rdv ?? null,
        date_prochain_rdv: parsed.data.date_prochain_rdv ?? null,
        abonnement_actif: parsed.data.abonnement_actif ?? null,
        abonnement_date_renouvellement: parsed.data.abonnement_date_renouvellement ?? null,
        date_dernier_contact: parsed.data.derniere_visite ?? null,
      })
      .returning();

    if (parsed.data.derniere_visite) {
      await db.insert(historiqueVisitesTable).values({
        client_id: client.id,
        date_visite: parsed.data.derniere_visite,
      });
    }

    return res.status(201).json({
      ...client,
      nb_alertes_actives: 0,
      created_at: client.created_at.toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

router.get("/clients/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID invalide" });

    const client = await getClientWithAlerts(id);
    if (!client) return res.status(404).json({ error: "Client non trouvé" });

    return res.json(client);
  } catch (err) {
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

router.patch("/clients/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID invalide" });

    const parsed = UpdateClientBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Données invalides" });
    }

    const updateData: Record<string, unknown> = {};
    const d = parsed.data;
    if (d.nom !== undefined) updateData.nom = d.nom;
    if (d.telephone !== undefined) updateData.telephone = d.telephone;
    if (d.email !== undefined) updateData.email = d.email;
    if (d.derniere_visite !== undefined) {
      updateData.derniere_visite = d.derniere_visite;
      updateData.date_dernier_contact = d.derniere_visite;
    }
    if (d.frequence_moyenne_jours !== undefined) updateData.frequence_moyenne_jours = d.frequence_moyenne_jours;
    if (d.dernier_rdv_statut !== undefined) updateData.dernier_rdv_statut = d.dernier_rdv_statut;
    if (d.date_dernier_rdv !== undefined) updateData.date_dernier_rdv = d.date_dernier_rdv;
    if (d.date_prochain_rdv !== undefined) updateData.date_prochain_rdv = d.date_prochain_rdv;
    if (d.abonnement_actif !== undefined) updateData.abonnement_actif = d.abonnement_actif;
    if (d.abonnement_date_renouvellement !== undefined) updateData.abonnement_date_renouvellement = d.abonnement_date_renouvellement;

    await db
      .update(clientsTable)
      .set(updateData)
      .where(and(eq(clientsTable.id, id), eq(clientsTable.user_id, DEMO_USER_ID)));

    const client = await getClientWithAlerts(id);
    if (!client) return res.status(404).json({ error: "Client non trouvé" });

    return res.json(client);
  } catch (err) {
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

router.delete("/clients/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID invalide" });

    await db
      .delete(clientsTable)
      .where(and(eq(clientsTable.id, id), eq(clientsTable.user_id, DEMO_USER_ID)));

    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/clients/:id/visit", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID invalide" });

    const today = new Date().toISOString().split("T")[0];

    await db
      .update(clientsTable)
      .set({
        derniere_visite: today,
        date_dernier_contact: today,
      })
      .where(and(eq(clientsTable.id, id), eq(clientsTable.user_id, DEMO_USER_ID)));

    await db.insert(historiqueVisitesTable).values({
      client_id: id,
      date_visite: today,
    });

    const allVisits = await db
      .select()
      .from(historiqueVisitesTable)
      .where(eq(historiqueVisitesTable.client_id, id))
      .orderBy(historiqueVisitesTable.date_visite);

    if (allVisits.length >= 2) {
      const dates = allVisits.map((v) => new Date(v.date_visite).getTime());
      let totalDiff = 0;
      for (let i = 1; i < dates.length; i++) {
        totalDiff += (dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24);
      }
      const avgFreq = Math.round(totalDiff / (dates.length - 1));
      await db
        .update(clientsTable)
        .set({ frequence_moyenne_jours: avgFreq })
        .where(eq(clientsTable.id, id));
    }

    const client = await getClientWithAlerts(id);
    if (!client) return res.status(404).json({ error: "Client non trouvé" });

    return res.json(client);
  } catch (err) {
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
