import { getAuth } from "@clerk/express";
import { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export interface AuthRequest extends Request {
  clerkUserId: string;
  userId: number;
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const auth = getAuth(req);
  const clerkUserId = auth?.userId;
  if (!clerkUserId) {
    return res.status(401).json({ error: "Non authentifié" });
  }

  const [dbUser] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.clerk_id, clerkUserId))
    .limit(1);

  if (!dbUser) {
    return res.status(404).json({ error: "Utilisateur non configuré", code: "NOT_SETUP" });
  }

  (req as AuthRequest).clerkUserId = clerkUserId;
  (req as AuthRequest).userId = dbUser.id;
  return next();
};

export const requireClerkAuth = (req: Request, res: Response, next: NextFunction) => {
  const auth = getAuth(req);
  const clerkUserId = auth?.userId;
  if (!clerkUserId) {
    return res.status(401).json({ error: "Non authentifié" });
  }
  (req as AuthRequest).clerkUserId = clerkUserId;
  return next();
};
