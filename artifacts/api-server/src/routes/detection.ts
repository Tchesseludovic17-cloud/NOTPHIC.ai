import { Router } from "express";
import { db } from "@workspace/db";
import { clientsTable, alertesTable, usersTable, historiqueVisitesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middlewares/requireAuth";

const router = Router();

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function parseDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

function genRelance(type: string, nom: string, extra?: Record<string, unknown>): string {
  switch (type) {
    case "silence":
      return `Bonjour ${nom}, j'espère que vous allez bien ! Je voulais simplement prendre de vos nouvelles. N'hésitez pas à me contacter si vous avez besoin de quoi que ce soit.`;
    case "rupture_frequence":
      return `Bonjour ${nom}, j'espère que vous allez bien ! Ça fait un moment qu'on ne s'est pas vus, n'hésitez pas si vous souhaitez reprendre rendez-vous.`;
    case "annulation_sans_reprise":
      return `Bonjour ${nom}, suite à votre annulation, avez-vous trouvé un créneau qui vous convient mieux ? Je serais ravi(e) de vous accueillir à nouveau.`;
    case "non_renouvellement":
      return `Bonjour ${nom}, votre abonnement est arrivé à échéance. Souhaitez-vous le renouveler ? Je reste disponible pour en discuter.`;
    case "absence_jour_habituel":
      return `Bonjour ${nom}, on ne vous a pas vu ce ${extra?.jour ?? "semaine"} — tout va bien ? N'hésitez pas à passer !`;
    default:
      return `Bonjour ${nom}, j'espère que vous allez bien !`;
  }
}

async function alerteExiste(clientId: number, type: string): Promise<boolean> {
  const r = await db
    .select()
    .from(alertesTable)
    .where(and(eq(alertesTable.client_id, clientId), eq(alertesTable.type_signal, type), eq(alertesTable.statut, "non_lu")))
    .limit(1);
  return r.length > 0;
}

async function creeAlerte(clientId: number, userId: number, type: string, message: string, relance: string, gravite: string) {
  await db.insert(alertesTable).values({
    client_id: clientId,
    user_id: userId,
    type_signal: type,
    message,
    message_relance_suggere: relance,
    gravite,
    statut: "non_lu",
  });
}

router.post("/detection/run", requireAuth, async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) return res.json({ alertes_creees: 0, message: "Aucun utilisateur trouvé" });

    const clients = await db.select().from(clientsTable).where(eq(clientsTable.user_id, userId));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isCommerceFidele = user.categorie_activite === "commerce_fidele";
    let alertesCreees = 0;

    for (const client of clients) {
      const derniereVisite = parseDate(client.derniere_visite);
      const dateContact = parseDate(client.date_dernier_contact);
      const dateDernierRdv = parseDate(client.date_dernier_rdv);
      const dateProchainRdv = parseDate(client.date_prochain_rdv);
      const dateRenouvellement = parseDate(client.abonnement_date_renouvellement);

      const dateRef = derniereVisite ?? dateContact;
      const joursDepuis = dateRef ? daysBetween(dateRef, today) : null;

      const silenceSeuil = isCommerceFidele ? 2 : 5;
      if (joursDepuis !== null && joursDepuis >= silenceSeuil && !(await alerteExiste(client.id, "silence"))) {
        const msg = `${client.nom} n'a pas donné signe de vie depuis ${joursDepuis} jour${joursDepuis > 1 ? "s" : ""}.`;
        await creeAlerte(client.id, userId, "silence", msg, genRelance("silence", client.nom), joursDepuis >= 10 ? "haute" : "moyenne");
        alertesCreees++;
      }

      if (client.frequence_moyenne_jours && client.frequence_moyenne_jours > 0 && joursDepuis !== null) {
        const seuil = client.frequence_moyenne_jours * 1.5;
        if (joursDepuis >= seuil && !(await alerteExiste(client.id, "rupture_frequence"))) {
          const msg = `${client.nom} venait en moyenne tous les ${client.frequence_moyenne_jours} jours, mais cela fait ${joursDepuis} jours qu'il/elle n'est pas revenu(e).`;
          await creeAlerte(client.id, userId, "rupture_frequence", msg, genRelance("rupture_frequence", client.nom), "haute");
          alertesCreees++;
        }
      }

      if (client.dernier_rdv_statut === "annule" && dateDernierRdv) {
        const joursAnnul = daysBetween(dateDernierRdv, today);
        const pasDeNouveau = !dateProchainRdv || dateProchainRdv <= today;
        if (joursAnnul >= 7 && pasDeNouveau && !(await alerteExiste(client.id, "annulation_sans_reprise"))) {
          const msg = `${client.nom} a annulé son dernier rendez-vous il y a ${joursAnnul} jours et n'en a pas repris depuis.`;
          await creeAlerte(client.id, userId, "annulation_sans_reprise", msg, genRelance("annulation_sans_reprise", client.nom), "haute");
          alertesCreees++;
        }
      }

      if (client.abonnement_actif && dateRenouvellement) {
        const joursRenouv = daysBetween(dateRenouvellement, today);
        if (joursRenouv >= 0 && !(await alerteExiste(client.id, "non_renouvellement"))) {
          const msg = `L'abonnement de ${client.nom} devait être renouvelé le ${dateRenouvellement.toLocaleDateString("fr-FR")} et ne l'a pas été.`;
          await creeAlerte(client.id, userId, "non_renouvellement", msg, genRelance("non_renouvellement", client.nom), "haute");
          alertesCreees++;
        }
      }

      if (isCommerceFidele) {
        const visites = await db
          .select()
          .from(historiqueVisitesTable)
          .where(eq(historiqueVisitesTable.client_id, client.id));

        if (visites.length >= 3) {
          const jourCounts: Record<string, number> = {};
          for (const v of visites) {
            const jour = JOURS[new Date(v.date_visite).getDay()];
            jourCounts[jour] = (jourCounts[jour] ?? 0) + 1;
          }
          const jourHabituel = Object.entries(jourCounts).sort((a, b) => b[1] - a[1])[0];
          const ratio = jourHabituel[1] / visites.length;

          if (ratio >= 0.6) {
            const jourNom = jourHabituel[0];
            const todayNom = JOURS[today.getDay()];

            if (client.jour_habituel !== jourNom) {
              await db.update(clientsTable).set({ jour_habituel: jourNom }).where(eq(clientsTable.id, client.id));
            }

            if (todayNom === jourNom && (joursDepuis === null || joursDepuis > 0)) {
              if (!(await alerteExiste(client.id, "absence_jour_habituel"))) {
                const msg = `${client.nom} vient habituellement le ${jourNom}, mais n'est pas venu(e) aujourd'hui.`;
                await creeAlerte(client.id, userId, "absence_jour_habituel", msg, genRelance("absence_jour_habituel", client.nom, { jour: jourNom }), "moyenne");
                alertesCreees++;
              }
            }
          }
        }
      }
    }

    const msg =
      alertesCreees === 0
        ? "Analyse terminée — aucune nouvelle alerte détectée."
        : `Analyse terminée — ${alertesCreees} nouvelle${alertesCreees > 1 ? "s" : ""} alerte${alertesCreees > 1 ? "s" : ""} créée${alertesCreees > 1 ? "s" : ""}.`;

    return res.json({ alertes_creees: alertesCreees, message: msg });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erreur lors de la détection" });
  }
});

export default router;
