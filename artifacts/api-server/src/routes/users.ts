import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, affiliationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { SetupUserBody, UpdateMeBody } from "@workspace/api-zod";

const router = Router();
const DEMO_USER_ID = 1;

function toSlug(nom: string): string {
  return nom
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);
}

function genCodeParrainage(id: number): string {
  return "NORP" + String(id).padStart(4, "0");
}

router.get("/users/me", async (_req, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, DEMO_USER_ID)).limit(1);
    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });
    return res.json({ ...user, created_at: user.created_at.toISOString() });
  } catch {
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/users/setup", async (req, res) => {
  try {
    const parsed = SetupUserBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Données invalides" });

    const slug = toSlug(parsed.data.nom_activite);
    const existing = await db.select().from(usersTable).where(eq(usersTable.id, DEMO_USER_ID)).limit(1);

    if (existing.length > 0) {
      const [updated] = await db
        .update(usersTable)
        .set({
          nom_activite: parsed.data.nom_activite,
          slug,
          categorie_activite: parsed.data.categorie_activite,
          description_activite: parsed.data.description_activite ?? null,
          client_ideal: parsed.data.client_ideal ?? null,
          reduction_offerte: parsed.data.reduction_offerte ?? null,
          email: parsed.data.email ?? null,
        })
        .where(eq(usersTable.id, DEMO_USER_ID))
        .returning();
      return res.status(201).json({ ...updated, created_at: updated.created_at.toISOString() });
    }

    const [user] = await db
      .insert(usersTable)
      .values({
        nom_activite: parsed.data.nom_activite,
        slug,
        categorie_activite: parsed.data.categorie_activite,
        description_activite: parsed.data.description_activite ?? null,
        client_ideal: parsed.data.client_ideal ?? null,
        reduction_offerte: parsed.data.reduction_offerte ?? null,
        email: parsed.data.email ?? null,
        plan: "gratuit",
      })
      .returning();

    const code = genCodeParrainage(user.id);
    const [withCode] = await db
      .update(usersTable)
      .set({ code_parrainage: code })
      .where(eq(usersTable.id, user.id))
      .returning();

    // Handle referral if code_parrainage_parrain provided
    const parrainCode = (parsed.data as Record<string, unknown>).code_parrainage_parrain as string | undefined;
    if (parrainCode) {
      const [parrain] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.code_parrainage, parrainCode))
        .limit(1);
      if (parrain) {
        await db.insert(affiliationsTable).values({
          user_id_parrain: parrain.id,
          user_id_filleul: user.id,
          statut_actif: true,
          taux_commission_actuel: 20,
        });
      }
    }

    return res.status(201).json({ ...withCode, created_at: withCode.created_at.toISOString() });
  } catch {
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

router.patch("/users/me", async (req, res) => {
  try {
    const parsed = UpdateMeBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Données invalides" });

    const updateData: Record<string, unknown> = {};
    if (parsed.data.nom_activite !== undefined) {
      updateData.nom_activite = parsed.data.nom_activite;
      updateData.slug = toSlug(parsed.data.nom_activite);
    }
    if (parsed.data.categorie_activite !== undefined) updateData.categorie_activite = parsed.data.categorie_activite;
    if (parsed.data.description_activite !== undefined) updateData.description_activite = parsed.data.description_activite;
    if (parsed.data.client_ideal !== undefined) updateData.client_ideal = parsed.data.client_ideal;
    if (parsed.data.reduction_offerte !== undefined) updateData.reduction_offerte = parsed.data.reduction_offerte;
    if (parsed.data.email !== undefined) updateData.email = parsed.data.email;

    const [user] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, DEMO_USER_ID)).returning();
    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });
    return res.json({ ...user, created_at: user.created_at.toISOString() });
  } catch {
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
