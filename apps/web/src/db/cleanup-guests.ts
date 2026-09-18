import { cleanupExpiredGuests, guestTtlHours } from "../lib/users";
import { sql } from "./index";

async function main() {
  const ttl = guestTtlHours();
  const result = await cleanupExpiredGuests(ttl);
  console.log(
    `Guest cleanup (ttl=${ttl}h): deleted ${result.deletedUsers} users, ${result.deletedDocuments} uploads.`,
  );
  await sql.end();
  process.exit(0);
}

main().catch(async (err) => {
  console.error(err);
  try {
    await sql.end();
  } catch {
    // ignore
  }
  process.exit(1);
});
