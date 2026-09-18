import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { chunkText } from "@cite-rag/rag";
import { db, sql } from "./index";
import { chunks, documents, users } from "./schema";
import { embedTexts } from "../lib/embeddings";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

async function ensureDemoUser() {
  const email = process.env.DEMO_USER_EMAIL || "demo@cite-rag.app";
  const password = process.env.DEMO_USER_PASSWORD || "demo-cite-rag-2026";
  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing[0]) {
    console.log(`Demo user exists: ${email}`);
    return existing[0];
  }
  const passwordHash = await hash(password, 10);
  const [user] = await db
    .insert(users)
    .values({ email, passwordHash, isGuest: false })
    .returning();
  console.log(`Created seed user: ${email}`);
  return user!;
}

async function seedFixtureDocs() {
  const fixturesDir = join(process.cwd(), "../../data/fixtures");
  const files = ["rag-intro.txt", "citations.txt", "rate-limits.txt"];
  for (const file of files) {
    const path = join(fixturesDir, file);
    if (!existsSync(path)) continue;
    const text = readFileSync(path, "utf8");
    const sourceUri = `fixture://${file}`;
    const existing = await db
      .select()
      .from(documents)
      .where(eq(documents.sourceUri, sourceUri))
      .limit(1);
    if (existing[0]?.status === "ready") {
      console.log(`Skip ready fixture: ${file}`);
      continue;
    }

    const title = file.replace(/\.txt$/, "").replace(/-/g, " ");
    let docId = existing[0]?.id;
    if (!docId) {
      const [doc] = await db
        .insert(documents)
        .values({
          title,
          sourceType: "corpus",
          sourceUri,
          mime: "text/plain",
          byteSize: Buffer.byteLength(text),
          status: "pending",
        })
        .returning();
      docId = doc!.id;
    }

    const parts = chunkText(text);
    const embeddings = await embedTexts(parts.map((p) => p.content));
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]!;
      await db.insert(chunks).values({
        documentId: docId,
        chunkIndex: part.chunkIndex,
        pageOrSection: part.pageOrSection,
        content: part.content,
        tokenCount: part.tokenCount,
        embedding: embeddings[i]!,
      });
    }
    await db
      .update(documents)
      .set({ status: "ready" })
      .where(eq(documents.id, docId));
    console.log(`Seeded fixture: ${file}`);
  }
}

async function main() {
  await ensureDemoUser();
  await seedFixtureDocs();
  await sql.end({ timeout: 5 });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
