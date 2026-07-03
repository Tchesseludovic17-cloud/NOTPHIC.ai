import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, clientsTable, alertesTable, feedbackTable } from "@workspace/db";
import { eq, and, sql, gte } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middlewares/requireAuth";

const router = Router();

const requireAdmin = async (req: any, res: any, next: any) => {
  const userId = (req as AuthRequest).userId;
  const [user] = await db.select({ est_admin: usersTable.est_admin }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user?.est_admin) return res.status(403).json({ error: "Accès interdit" });
  return next();
};

router.get("/admin/overview", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const users = await db.select().from(usersTable).orderBy(usersTable.created_at);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const [{ nb_clients }] = await db
          .select({ nb_clients: sql<number>`count(*)::int` })
          .from(clientsTable)
          .where(eq(clientsTable.user_id, user.id));

        const [{ nb_alertes }] = await db
          .select({ nb_alertes: sql<number>`count(*)::int` })
          .from(alertesTable)
          .where(eq(alertesTable.user_id, user.id));

        const actif = user.last_active ? user.last_active >= sevenDaysAgo : false;

        return {
          id: user.id,
          nom_activite: user.nom_activite,
          categorie_activite: user.categorie_activite,
          email: user.email,
          slug: user.slug,
          plan: user.plan,
          est_admin: user.est_admin,
          created_at: user.created_at.toISOString(),
          last_active: user.last_active?.toISOString() ?? null,
          actif,
          nb_clients,
          nb_alertes,
        };
      })
    );

    const [{ total_alertes }] = await db
      .select({ total_alertes: sql<number>`count(*)::int` })
      .from(alertesTable);

    const [{ total_relances }] = await db
      .select({ total_relances: sql<number>`count(*)::int` })
      .from(feedbackTable)
      .where(sql`${feedbackTable.type_feedback} IN ('relance_reussie', 'relance_echouee')`);

    const [{ relances_reussies }] = await db
      .select({ relances_reussies: sql<number>`count(*)::int` })
      .from(feedbackTable)
      .where(eq(feedbackTable.type_feedback, "relance_reussie"));

    const taux_relance_global =
      total_relances > 0 ? Math.round((relances_reussies / total_relances) * 100) : null;

    const suggestions = await db
      .select({
        id: feedbackTable.id,
        commentaire: feedbackTable.commentaire,
        created_at: feedbackTable.created_at,
        user_id: feedbackTable.user_id,
      })
      .from(feedbackTable)
      .where(eq(feedbackTable.type_feedback, "suggestion"))
      .orderBy(feedbackTable.created_at);

    const suggestionsAvecNom = await Promise.all(
      suggestions.map(async (s) => {
        const [u] = await db
          .select({ nom_activite: usersTable.nom_activite })
          .from(usersTable)
          .where(eq(usersTable.id, s.user_id))
          .limit(1);
        return {
          ...s,
          created_at: s.created_at.toISOString(),
          nom_activite: u?.nom_activite ?? "—",
        };
      })
    );

    return res.json({
      users: usersWithStats,
      global: {
        total_utilisateurs: users.length,
        utilisateurs_actifs: usersWithStats.filter((u) => u.actif).length,
        total_alertes,
        taux_relance_global,
        total_relances,
        relances_reussies,
      },
      suggestions: suggestionsAvecNom,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
