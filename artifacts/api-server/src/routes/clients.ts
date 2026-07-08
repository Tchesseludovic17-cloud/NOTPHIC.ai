import { Router } from "express";
import { db } from "@workspace/db";
import { clientsTable, alertesTable, historiqueVisitesTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { CreateClientBody, UpdateClientBody } from "@workspace/api-zod";
import { requireAuth, AuthRequest } from "../middlewares/requireAuth";
import { logger } from "../lib/logger";

const router = Router();

// Pagination constants
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function getPageSize(requested?: string): number {
  if (!requested) return DEFAULT_PAGE_SIZE;
  const size = parseInt(requested, 10);
  if (isNaN(size) || size < 1) return DEFAULT_PAGE_SIZE;
  return Math.min(size, MAX_PAGE_SIZE);
}

function serializeClient(client: any) {
  return {
    ...client,
    date_dernier_contact: client.date_dernier_contact ?? null,
    derniere_visite: client.derniere_visite ?? null,
    date_dernier_rdv: client.date_dernier_rdv ?? null,
    date_prochain_rdv: client.date_prochain_rdv ?? null,
    abonnement_date_renouvellement: client.abonnement_date_renouvellement ?? null,
    created_at: client.created_at instanceof Date ? client.created_at.toISOString() : client.created_at,
  };
}

async function getClientWithAlerts(clientId: number, userId: number) {
  try {
    const [client] = await db
      .select()
      .from(clientsTable)
      .where(and(eq(clientsTable.id, clientId), eq(clientsTable.user_id, userId)))
      .limit(1);

    if (!client) return null;

    const [alertCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(alertesTable)
      .where(and(eq(alertesTable.client_id, clientId), eq(alertesTable.statut, "non_lu")));

    return {
      ...serializeClient(client),
      nb_alertes_actives: alertCount?.count ?? 0,
    };
  } catch (err) {
    logger.error({ err, clientId, userId }, "Failed to get client with alerts");
    throw err;
  }
}

router.get("/clients", requireAuth, async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    const pageSize = getPageSize(req.query.limit as string);
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const offset = (page - 1) * pageSize;

    // Get total count
    const [{ count: totalCount }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(clientsTable)
      .where(eq(clientsTable.user_id, userId));

    // Get paginated clients
    const clients = await db
      .select()
      .from(clientsTable)
      .where(eq(clientsTable.user_id, userId))
      .orderBy(clientsTable.created_at)
      .limit(pageSize)
      .offset(offset);

    const clientIds = clients.map((c) => c.id);
    let alertCounts: Record<number, number> = {};

    if (clientIds.length > 0) {
      const counts = await db
        .select({
          client_id: alertesTable.client_id,
          count: sql<number>`count(*)::int`,
        })
        .from(alertesTable)
        .where(and(eq(alertesTable.statut, "non_lu"), eq(alertesTable.user_id, userId)))
        .groupBy(alertesTable.client_id);

      alertCounts = Object.fromEntries(counts.map((c) => [c.client_id, c.count]));
    }

    const result = clients.map((c) => ({
      ...serializeClient(c),
      nb_alertes_actives: alertCounts[c.id] ?? 0,
    }));

    return res.json({
      data: result,
      pagination: {
        page,
        pageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (err) {
    logger.error({ err }, "Failed to fetch clients");
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/clients", requireAuth, async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    const parsed = CreateClientBody.safeParse(req.body);
    if (!parsed.success) {
      logger.debug({ errors: parsed.error.errors }, "Invalid create client body");
      return res.status(400).json({ error: "Données invalides" });
    }

    const [client] = await db
      .insert(clientsTable)
      .values({
        user_id: userId,
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
      try {
        await db.insert(historiqueVisitesTable).values({
          client_id: client.id,
          date_visite: parsed.data.derniere_visite,
        });
      } catch (err) {
        logger.warn({ err, clientId: client.id }, "Failed to create visit history");
        // Non-critical error
      }
    }

    return res.status(201).json({
      ...serializeClient(client),
      nb_alertes_actives: 0,
    });
  } catch (err) {
    logger.error({ err }, "Failed to create client");
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

router.get("/clients/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) return res.status(400).json({ error: "ID invalide" });

    const client = await getClientWithAlerts(id, userId);
    if (!client) return res.status(404).json({ error: "Client non trouvé" });

    return res.json(client);
  } catch (err) {
    logger.error({ err }, "Failed to fetch client");
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

router.patch("/clients/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) return res.status(400).json({ error: "ID invalide" });

    const parsed = UpdateClientBody.safeParse(req.body);
    if (!parsed.success) {
      logger.debug({ errors: parsed.error.errors }, "Invalid update client body");
      return res.status(400).json({ error: "Données invalides" });
    }

    // Verify client exists first
    const [existingClient] = await db
      .select({ id: clientsTable.id })
      .from(clientsTable)
      .where(and(eq(clientsTable.id, id), eq(clientsTable.user_id, userId)))
      .limit(1);

    if (!existingClient) {
      return res.status(404).json({ error: "Client non trouvé" });
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
    if (d.abonnement_date_renouvellement !== undefined)
      updateData.abonnement_date_renouvellement = d.abonnement_date_renouvellement;

    await db
      .update(clientsTable)
      .set(updateData)
      .where(and(eq(clientsTable.id, id), eq(clientsTable.user_id, userId)));

    const client = await getClientWithAlerts(id, userId);
    if (!client) {
      logger.warn({ id, userId }, "Client disappeared after update");
      return res.status(500).json({ error: "Erreur lors de la mise à jour" });
    }

    return res.json(client);
  } catch (err) {
    logger.error({ err }, "Failed to update client");
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

router.delete("/clients/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) return res.status(400).json({ error: "ID invalide" });

    const result = await db
      .delete(clientsTable)
      .where(and(eq(clientsTable.id, id), eq(clientsTable.user_id, userId)))
      .returning({ id: clientsTable.id });

    if (result.length === 0) {
      return res.status(404).json({ error: "Client non trouvé" });
    }

    return res.status(204).send();
  } catch (err) {
    logger.error({ err }, "Failed to delete client");
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/clients/:id/visit", requireAuth, async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) return res.status(400).json({ error: "ID invalide" });

    // Verify client exists
    const [existingClient] = await db
      .select({ id: clientsTable.id })
      .from(clientsTable)
      .where(and(eq(clientsTable.id, id), eq(clientsTable.user_id, userId)))
      .limit(1);

    if (!existingClient) {
      return res.status(404).json({ error: "Client non trouvé" });
    }

    const today = new Date().toISOString().split("T")[0];

    await db
      .update(clientsTable)
      .set({ derniere_visite: today, date_dernier_contact: today })
      .where(and(eq(clientsTable.id, id), eq(clientsTable.user_id, userId)));

    try {
      await db.insert(historiqueVisitesTable).values({ client_id: id, date_visite: today });
    } catch (err) {
      logger.warn({ err, clientId: id }, "Failed to create visit history record");
      // Non-critical error
    }

    // Calculate average frequency
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
      try {
        await db.update(clientsTable).set({ frequence_moyenne_jours: avgFreq }).where(eq(clientsTable.id, id));
      } catch (err) {
        logger.warn({ err, clientId: id }, "Failed to update frequency");
      }
    }

    const client = await getClientWithAlerts(id, userId);
    if (!client) {
      logger.warn({ id, userId }, "Client not found after visit update");
      return res.status(500).json({ error: "Erreur lors de la mise à jour" });
    }

    return res.json(client);
  } catch (err) {
    logger.error({ err }, "Failed to record visit");
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
