import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://citerag:citerag@localhost:5432/citerag";

const isLocal =
  connectionString.includes("localhost") ||
  connectionString.includes("127.0.0.1");

const globalForDb = globalThis as unknown as {
  sql?: ReturnType<typeof postgres>;
};

export const sql =
  globalForDb.sql ??
  postgres(connectionString, {
    prepare: false,
    max: 10,
    // Supabase / Neon require TLS; local Docker does not.
    ssl: isLocal ? false : "require",
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.sql = sql;
}

export const db = drizzle(sql, { schema });
