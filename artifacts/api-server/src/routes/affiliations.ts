import { Router } from "express";
import { db } from "@workspace/db";
import { affiliationsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();
const DEMO_USER_ID = 1;

router.get("/affiliations/me", async (_req, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, DEMO_USER_ID)).limit(1);
    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });

    const code_parrainage = user.code_parrainage ?? "NORP" + String(user.id).padStart(4, "0");
    const lien_parrainage = `https://norphic.com/inscription?ref=${code_parrainage}`;

    const rows = await db
      .select({ affil: affiliationsTable, filleul: usersTable })
      .from(affiliationsTable)
      .leftJoin(usersTable, eq(affiliationsTable.user_id_filleul, usersTable.id))
      .where(eq(affiliationsTable.user_id_parrain, DEMO_USER_ID));

    const filleuls_actifs = rows.filter((r) => r.affil.statut_actif).length;
    // Estimate: 20% commission on first month (€15 plan essentiel), 10% after → simplified estimate
    const commission_totale_estimee = rows.reduce((acc, r) => acc + (r.affil.statut_actif ? (r.affil.taux_commission_actuel / 100) * 15 : 0), 0);

    return res.json({
      code_parrainage,
      lien_parrainage,
      total_filleuls: rows.length,
      filleuls_actifs,
      commission_totale_estimee,
      filleuls: rows.map((r) => ({
        id: r.affil.id,
        nom_activite: r.filleul?.nom_activite ?? "—",
        statut_actif: r.affil.statut_actif,
        taux_commission_actuel: r.affil.taux_commission_actuel,
        created_at: r.affil.created_at.toISOString(),
      })),
    });
  } catch {
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
