import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  SetupUserBody,
  UpdateMeBody,
} from "@workspace/api-zod";

const router = Router();

const DEMO_USER_ID = 1;

router.get("/users/me", async (_req, res) => {
  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, DEMO_USER_ID))
      .limit(1);

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    return res.json({
      ...user,
      created_at: user.created_at.toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/users/setup", async (req, res) => {
  try {
    const parsed = SetupUserBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Données invalides" });
    }

    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, DEMO_USER_ID))
      .limit(1);

    if (existing.length > 0) {
      const [updated] = await db
        .update(usersTable)
        .set({
          nom_activite: parsed.data.nom_activite,
          categorie_activite: parsed.data.categorie_activite,
          description_activite: parsed.data.description_activite ?? null,
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
        categorie_activite: parsed.data.categorie_activite,
        description_activite: parsed.data.description_activite ?? null,
        email: parsed.data.email ?? null,
        plan: "gratuit",
      })
      .returning();

    return res.status(201).json({ ...user, created_at: user.created_at.toISOString() });
  } catch (err) {
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

router.patch("/users/me", async (req, res) => {
  try {
    const parsed = UpdateMeBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Données invalides" });
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.nom_activite !== undefined) updateData.nom_activite = parsed.data.nom_activite;
    if (parsed.data.categorie_activite !== undefined) updateData.categorie_activite = parsed.data.categorie_activite;
    if (parsed.data.description_activite !== undefined) updateData.description_activite = parsed.data.description_activite;
    if (parsed.data.email !== undefined) updateData.email = parsed.data.email;

    const [user] = await db
      .update(usersTable)
      .set(updateData)
      .where(eq(usersTable.id, DEMO_USER_ID))
      .returning();

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    return res.json({ ...user, created_at: user.created_at.toISOString() });
  } catch (err) {
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
