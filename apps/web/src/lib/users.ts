import { randomBytes, randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import { and, eq, lt } from "drizzle-orm";
import { db } from "@/db";
import { conversations, documents, users } from "@/db/schema";

const BCRYPT_ROUNDS = 10;

export function guestTtlHours(): number {
  const n = Number(process.env.GUEST_TTL_HOURS || 48);
  return Number.isFinite(n) && n > 0 ? n : 48;
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, BCRYPT_ROUNDS);
}

export async function createRegisteredUser(params: {
  email: string;
  password: string;
}): Promise<{ id: string; email: string }> {
  const email = params.email.trim().toLowerCase();
  const passwordHash = await hashPassword(params.password);
  const [row] = await db
    .insert(users)
    .values({
      email,
      passwordHash,
      isGuest: false,
    })
    .returning({ id: users.id, email: users.email });
  return row!;
}

/** Throwaway account: synthetic email + random password (returned once for signIn). */
export async function createGuestUser(): Promise<{
  id: string;
  email: string;
  password: string;
}> {
  const id = randomUUID();
  const password = randomBytes(24).toString("base64url");
  const email = `guest-${id}@guest.invalid`;
  const passwordHash = await hashPassword(password);
  const [row] = await db
    .insert(users)
    .values({
      id,
      email,
      passwordHash,
      isGuest: true,
    })
    .returning({ id: users.id, email: users.email });
  return { id: row!.id, email: row!.email, password };
}

/**
 * Delete expired guest users and their uploads / conversations.
 * Corpus docs (owner null / source_type corpus) are untouched.
 */
export async function cleanupExpiredGuests(
  ttlHours: number = guestTtlHours(),
): Promise<{ deletedUsers: number; deletedDocuments: number }> {
  const cutoff = new Date(Date.now() - ttlHours * 60 * 60 * 1000);
  const expired = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.isGuest, true), lt(users.createdAt, cutoff)));

  if (!expired.length) {
    return { deletedUsers: 0, deletedDocuments: 0 };
  }

  const ids = expired.map((u) => u.id);
  let deletedDocuments = 0;

  for (const userId of ids) {
    const removed = await db
      .delete(documents)
      .where(eq(documents.ownerUserId, userId))
      .returning({ id: documents.id });
    deletedDocuments += removed.length;
    await db.delete(conversations).where(eq(conversations.userId, userId));
    await db.delete(users).where(eq(users.id, userId));
  }

  return { deletedUsers: ids.length, deletedDocuments };
}
