---
name: Admin dashboard
description: est_admin booléen en DB, route /api/admin/overview, page /admin visible seulement aux admins.
---

# Admin Dashboard

**Why:** L'opérateur de la plateforme a besoin d'une vue globale des utilisateurs.

**DB:** `est_admin BOOLEAN DEFAULT false` + `last_active TIMESTAMP` sur la table `users`.

**API:** `GET /api/admin/overview` — nécessite `requireAuth` + `requireAdmin` middleware.
Retourne: liste utilisateurs avec nb_clients, nb_alertes, actif (7j), global stats, suggestions.

**Frontend:** `/admin` page (artifacts/norphic/src/pages/admin.tsx) — Layout normal, lien "Admin" dans la nav seulement si `user.est_admin === true`.

**How to apply:**
- Pour marquer un admin: `UPDATE users SET est_admin = true WHERE id = X`.
- User id=1 est marqué admin (Coach dupont, compte de test initial).
- "Actif" = last_active dans les 7 derniers jours.
