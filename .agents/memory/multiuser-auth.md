---
name: Multi-user auth migration
description: DEMO_USER_ID=1 remplacé par clerk_id en DB, deux middlewares requireAuth/requireClerkAuth.
---

# Multi-user Auth Migration

**Why:** V1 était mono-utilisateur (DEMO_USER_ID=1). Clerk Auth ajoute de vrais comptes.

**Pattern:**
- `clerk_id TEXT UNIQUE` ajouté à la table `users` (migration manuelle via SQL ALTER TABLE).
- `requireClerkAuth`: vérifie Clerk uniquement, set `req.clerkUserId` — pour /users/me et /users/setup (qui créent l'utilisateur en DB).
- `requireAuth`: vérifie Clerk ET look-up DB par clerk_id, set `req.userId` (int) — pour toutes les autres routes.
- `last_active` mis à jour automatiquement à chaque appel `requireAuth` (fire-and-forget).
- `/users/setup` crée un nouvel enregistrement en DB avec `clerk_id` lié au compte Clerk.
- User id=1 "Coach dupont" n'a pas de clerk_id — ne peut pas se connecter sans créer un compte Clerk.

**How to apply:**
- Toutes les routes protégées utilisent `requireAuth` qui fournit `req.userId` (int interne).
- Route publique `/site/:slug` et `/health` sans auth.
