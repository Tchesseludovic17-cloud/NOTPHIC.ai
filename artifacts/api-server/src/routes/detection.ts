import { Router } from "express";
import { db } from "@workspace/db";
import { clientsTable, alertesTable, usersTable } from "@workspace/db";
import { eq, and, isNull, or } from "drizzle-orm";

const router = Router();

const DEMO_USER_ID = 1;

function daysBetween(date1: Date, date2: Date): number {
  const diff = date2.getTime() - date1.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function parseDate(s: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

async function alerteExisteDeja(
  clientId: number,
  typeSignal: string
): Promise<boolean> {
  const existing = await db
    .select()
    .from(alertesTable)
    .where(
      and(
        eq(alertesTable.client_id, clientId),
        eq(alertesTable.type_signal, typeSignal),
        eq(alertesTable.statut, "non_lu")
      )
    )
    .limit(1);
  return existing.length > 0;
}

router.post("/detection/run", async (_req, res) => {
  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, DEMO_USER_ID))
      .limit(1);

    if (!user) {
      return res.json({ alertes_creees: 0, message: "Aucun utilisateur trouvé" });
    }

    const clients = await db
      .select()
      .from(clientsTable)
      .where(eq(clientsTable.user_id, DEMO_USER_ID));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let alertesCreees = 0;
    const isCommerceFidele = user.categorie_activite === "commerce_fidele";

    for (const client of clients) {
      const derniereVisite = parseDate(client.derniere_visite);
      const dateContact = parseDate(client.date_dernier_contact);
      const dateProchainRdv = parseDate(client.date_prochain_rdv);
      const dateDernierRdv = parseDate(client.date_dernier_rdv);
      const dateRenouvellement = parseDate(client.abonnement_date_renouvellement);

      const dateRef = derniereVisite ?? dateContact;
      const joursDepuisContact = dateRef ? daysBetween(dateRef, today) : null;

      // RULE 1: SILENCE
      const silenceSeuil = isCommerceFidele ? 2 : 5;
      if (joursDepuisContact !== null && joursDepuisContact >= silenceSeuil) {
        const alreadyExists = await alerteExisteDeja(client.id, "silence");
        if (!alreadyExists) {
          const jours = joursDepuisContact;
          const message = `${client.nom} n'a pas donné signe de vie depuis ${jours} jour${jours > 1 ? "s" : ""}.`;
          const relance = `Bonjour ${client.nom}, j'espère que vous allez bien ! Je voulais simplement prendre de vos nouvelles. N'hésitez pas à me contacter si vous avez besoin de quoi que ce soit.`;
          await db.insert(alertesTable).values({
            client_id: client.id,
            user_id: DEMO_USER_ID,
            type_signal: "silence",
            message,
            message_relance_suggere: relance,
            gravite: jours >= 10 ? "haute" : "moyenne",
            statut: "non_lu",
          });
          alertesCreees++;
        }
      }

      // RULE 2: RUPTURE DE FRÉQUENCE
      if (
        client.frequence_moyenne_jours &&
        client.frequence_moyenne_jours > 0 &&
        joursDepuisContact !== null
      ) {
        const seuilRupture = client.frequence_moyenne_jours * 1.5;
        if (joursDepuisContact >= seuilRupture) {
          const alreadyExists = await alerteExisteDeja(client.id, "rupture_frequence");
          if (!alreadyExists) {
            const message = `${client.nom} venait en moyenne tous les ${client.frequence_moyenne_jours} jours, mais cela fait ${joursDepuisContact} jours qu'il/elle n'est pas revenu(e). Je vous suggère de lui envoyer un message.`;
            const relance = `Bonjour ${client.nom} ! Cela fait un moment que je n'ai pas eu de vos nouvelles. Vous manquez ! Souhaitez-vous reprendre nos échanges ?`;
            await db.insert(alertesTable).values({
              client_id: client.id,
              user_id: DEMO_USER_ID,
              type_signal: "rupture_frequence",
              message,
              message_relance_suggere: relance,
              gravite: "haute",
              statut: "non_lu",
            });
            alertesCreees++;
          }
        }
      }

      // RULE 3: ANNULATION SANS REPRISE
      if (
        client.dernier_rdv_statut === "annule" &&
        dateDernierRdv
      ) {
        const joursDepuisAnnulation = daysBetween(dateDernierRdv, today);
        const pasDeNouveauRdv = !dateProchainRdv || dateProchainRdv <= today;

        if (joursDepuisAnnulation >= 7 && pasDeNouveauRdv) {
          const alreadyExists = await alerteExisteDeja(client.id, "annulation_sans_reprise");
          if (!alreadyExists) {
            const message = `${client.nom} a annulé son dernier rendez-vous il y a ${joursDepuisAnnulation} jours et n'en a pas repris depuis.`;
            const relance = `Bonjour ${client.nom}, suite à votre annulation, avez-vous eu l'occasion de trouver un créneau qui vous convient mieux ? Je serais ravi(e) de vous accueillir à nouveau.`;
            await db.insert(alertesTable).values({
              client_id: client.id,
              user_id: DEMO_USER_ID,
              type_signal: "annulation_sans_reprise",
              message,
              message_relance_suggere: relance,
              gravite: "haute",
              statut: "non_lu",
            });
            alertesCreees++;
          }
        }
      }

      // RULE 4: NON-RENOUVELLEMENT
      if (
        client.abonnement_actif === true &&
        dateRenouvellement
      ) {
        const joursDepuisRenouvellement = daysBetween(dateRenouvellement, today);
        if (joursDepuisRenouvellement >= 0) {
          const alreadyExists = await alerteExisteDeja(client.id, "non_renouvellement");
          if (!alreadyExists) {
            const message = `L'abonnement de ${client.nom} devait être renouvelé le ${dateRenouvellement.toLocaleDateString("fr-FR")} et ne l'a pas été.`;
            const relance = `Bonjour ${client.nom}, votre abonnement est arrivé à échéance. Souhaitez-vous le renouveler ? Je reste disponible pour en discuter.`;
            await db.insert(alertesTable).values({
              client_id: client.id,
              user_id: DEMO_USER_ID,
              type_signal: "non_renouvellement",
              message,
              message_relance_suggere: relance,
              gravite: "haute",
              statut: "non_lu",
            });
            alertesCreees++;
          }
        }
      }
    }

    const msg = alertesCreees === 0
      ? "Analyse terminée — aucune nouvelle alerte détectée."
      : `Analyse terminée — ${alertesCreees} nouvelle${alertesCreees > 1 ? "s" : ""} alerte${alertesCreees > 1 ? "s" : ""} créée${alertesCreees > 1 ? "s" : ""}.`;

    return res.json({ alertes_creees: alertesCreees, message: msg });
  } catch (err) {
    return res.status(500).json({ error: "Erreur lors de la détection" });
  }
});

export default router;
