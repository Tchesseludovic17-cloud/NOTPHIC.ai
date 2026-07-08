import { Router } from "express";
import { clerkClient } from "@clerk/express";
import { db } from "@workspace/db";
import { usersTable, affiliationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { SetupUserBody, UpdateMeBody } from "@workspace/api-zod";
import { requireClerkAuth, requireAuth, AuthRequest } from "../middlewares/requireAuth";
import { logger } from "../lib/logger";

const router = Router();

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

function serializeUser(user: any) {
  return {
    ...user,
    created_at: user.created_at instanceof Date ? user.created_at.toISOString() : user.created_at,
  };
}

router.get("/users/me", requireClerkAuth, async (req, res) => {
  try {
    const clerkUserId = (req as AuthRequest).clerkUserId;
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.clerk_id, clerkUserId))
      .limit(1);
    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé", code: "NOT_SETUP" });
    return res.json(serializeUser(user));
  } catch (err) {
    logger.error({ err }, "Failed to fetch user");
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/users/setup", requireClerkAuth, async (req, res) => {
  try {
    const parsed = SetupUserBody.safeParse(req.body);
    if (!parsed.success) {
      logger.debug({ errors: parsed.error.errors }, "Invalid setup user body");
      return res.status(400).json({ error: "Données invalides" });
    }

    const clerkUserId = (req as AuthRequest).clerkUserId;
    const slug = toSlug(parsed.data.nom_activite);
    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.clerk_id, clerkUserId))
      .limit(1);

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
        .where(eq(usersTable.clerk_id, clerkUserId))
        .returning();
      return res.status(200).json(serializeUser(updated));
    }

    // Fetch email from Clerk so admin detection works even if form doesn't send it
    let clerkEmail: string | null = parsed.data.email ?? null;
    try {
      const clerkUser = await clerkClient.users.getUser(clerkUserId);
      const primary = clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId);
      if (primary?.emailAddress) clerkEmail = primary.emailAddress;
    } catch (err) {
      logger.warn({ err, clerkUserId }, "Failed to fetch email from Clerk");
      // fallback to form value if Clerk call fails
    }

    const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
      .toLowerCase()
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);
    const isAdmin = Boolean(clerkEmail && ADMIN_EMAILS.includes(clerkEmail.toLowerCase()));

    // Use transaction-like pattern for multi-step operation
    const [user] = await db
      .insert(usersTable)
      .values({
        clerk_id: clerkUserId,
        nom_activite: parsed.data.nom_activite,
        slug,
        categorie_activite: parsed.data.categorie_activite,
        description_activite: parsed.data.description_activite ?? null,
        client_ideal: parsed.data.client_ideal ?? null,
        reduction_offerte: parsed.data.reduction_offerte ?? null,
        email: clerkEmail,
        plan: "gratuit",
        est_admin: isAdmin,
      })
      .returning();

    const code = genCodeParrainage(user.id);
    const [withCode] = await db
      .update(usersTable)
      .set({ code_parrainage: code })
      .where(eq(usersTable.id, user.id))
      .returning();

    // Handle referral code if provided
    const parrainCode = parsed.data.code_parrainage_parrain;
    if (parrainCode && typeof parrainCode === "string") {
      try {
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
      } catch (err) {
        logger.error({ err, parrainCode }, "Failed to create affiliation");
        // Non-critical error, continue
      }
    }

    return res.status(201).json(serializeUser(withCode));
  } catch (err) {
    logger.error({ err }, "Failed to setup user");
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

router.patch("/users/me", requireAuth, async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    const parsed = UpdateMeBody.safeParse(req.body);
    if (!parsed.success) {
      logger.debug({ errors: parsed.error.errors }, "Invalid update user body");
      return res.status(400).json({ error: "Données invalides" });
    }

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

    const [user] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, userId)).returning();
    if (!user) {
      logger.warn({ userId }, "User not found after update");
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }
    return res.json(serializeUser(user));
  } catch (err) {
    logger.error({ err }, "Failed to update user");
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
