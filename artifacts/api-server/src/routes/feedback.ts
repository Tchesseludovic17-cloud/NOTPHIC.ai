import { Router } from "express";
import { db } from "@workspace/db";
import { feedbackTable } from "@workspace/db";
import { requireAuth, AuthRequest } from "../middlewares/requireAuth";

const router = Router();

router.post("/feedback", requireAuth, async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    const { alerte_id, type_feedback, commentaire } = req.body as {
      alerte_id: number; type_feedback: string; commentaire?: string;
    };

    if (!alerte_id || !type_feedback) return res.status(400).json({ error: "Données manquantes" });

    const [fb] = await db
      .insert(feedbackTable)
      .values({ user_id: userId, alerte_id, type_feedback, commentaire: commentaire ?? null })
      .returning();

    return res.status(201).json({ id: fb.id, type_feedback: fb.type_feedback, created_at: fb.created_at.toISOString() });
  } catch {
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
