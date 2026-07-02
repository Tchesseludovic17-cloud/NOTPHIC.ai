import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, clientsTable, historiqueVisitesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/site/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.slug, slug)).limit(1);
    if (!user) return res.status(404).json({ error: "Site non trouvé" });

    return res.json({
      slug: user.slug,
      nom_activite: user.nom_activite,
      description_activite: user.description_activite ?? null,
      client_ideal: user.client_ideal ?? null,
      reduction_offerte: user.reduction_offerte ?? null,
      categorie_activite: user.categorie_activite,
    });
  } catch {
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/site/:slug/contact", async (req, res) => {
  try {
    const { slug } = req.params;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.slug, slug)).limit(1);
    if (!user) return res.status(404).json({ error: "Site non trouvé" });

    const { nom, telephone, email, message } = req.body as {
      nom: string; telephone?: string; email?: string; message?: string;
    };

    if (!nom) return res.status(400).json({ error: "Le nom est requis" });

    const today = new Date().toISOString().split("T")[0];

    // Upsert: look for existing client by email or phone
    let existingClient = null;
    if (email) {
      const rows = await db
        .select()
        .from(clientsTable)
        .where(and(eq(clientsTable.user_id, user.id), eq(clientsTable.email, email)))
        .limit(1);
      existingClient = rows[0] ?? null;
    }
    if (!existingClient && telephone) {
      const rows = await db
        .select()
        .from(clientsTable)
        .where(and(eq(clientsTable.user_id, user.id), eq(clientsTable.telephone, telephone)))
        .limit(1);
      existingClient = rows[0] ?? null;
    }

    if (existingClient) {
      await db
        .update(clientsTable)
        .set({ derniere_visite: today, date_dernier_contact: today, derniere_visite_via: "site_en_ligne" })
        .where(eq(clientsTable.id, existingClient.id));
      await db.insert(historiqueVisitesTable).values({ client_id: existingClient.id, date_visite: today, via: "site_en_ligne" });
    } else {
      const [newClient] = await db
        .insert(clientsTable)
        .values({
          user_id: user.id,
          nom,
          telephone: telephone ?? null,
          email: email ?? null,
          derniere_visite: today,
          date_dernier_contact: today,
          derniere_visite_via: "site_en_ligne",
        })
        .returning();
      await db.insert(historiqueVisitesTable).values({ client_id: newClient.id, date_visite: today, via: "site_en_ligne" });
    }

    return res.json({ success: true, message: "Votre demande a bien été reçue. Nous vous contacterons rapidement." });
  } catch {
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
