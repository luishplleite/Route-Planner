import { db } from "./server/db";
import { users } from "./shared/models/auth";

async function seed() {
  await db.insert(users).values({
    id: "dummy-user-id",
    email: "user@example.com",
    firstName: "User",
    lastName: "Test",
    profileImageUrl: "https://example.com/image.png"
  }).onConflictDoNothing();
  console.log("Seed complete");
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
