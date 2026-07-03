---
name: Clerk Auth setup
description: Clerk provisionné via setupClerkWhitelabelAuth, proxy middleware, Tailwind v4 layer config requise.
---

# Clerk Auth Setup

Clerk provisionné via `setupClerkWhitelabelAuth()` — app_id: `app_3Fy50SeqLWgdlU2D6P2EjcxBkJ6`.

**Why:** Auth multi-utilisateurs nécessaire pour SaaS.

**How to apply:**
- `VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` sont auto-provisionnés.
- `clerkProxyMiddleware` monté AVANT body parsers dans app.ts.
- `clerkMiddleware` utilise `publishableKeyFromHost` pour supporter domaines custom.
- Tailwind v4 : `@layer theme, base, clerk, components, utilities;` AVANT `@import "tailwindcss"` dans index.css.
- Vite : `tailwindcss({ optimize: false })` requis pour éviter bug prod avec @clerk/themes CSS.
- `<SignIn routing="path">` ne s'affiche QU'à son URL exacte — ne pas l'injecter dans HomeRedirect, rediriger vers `/sign-in` à la place.
- Auth est cookie-based côté web — pas de Bearer token, pas de setAuthTokenGetter.
