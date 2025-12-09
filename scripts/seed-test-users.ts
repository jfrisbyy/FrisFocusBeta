import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

const testUsers = [
  {
    id: "test-user-1",
    email: "taylor@test.com",
    username: "taylorswift",
    displayName: "Taylor Swift Fan",
    firstName: "Taylor",
    lastName: "Swift",
  },
  {
    id: "test-user-2",
    email: "mike@test.com",
    username: "mikejones",
    displayName: "Mike Jones",
    firstName: "Mike",
    lastName: "Jones",
  },
  {
    id: "test-user-3",
    email: "emily@test.com",
    username: "emilyr",
    displayName: "Emily Roberts",
    firstName: "Emily",
    lastName: "Roberts",
  },
  {
    id: "test-user-4",
    email: "david@test.com",
    username: "davidl",
    displayName: "David Lee",
    firstName: "David",
    lastName: "Lee",
  },
  {
    id: "test-user-5",
    email: "sarah@test.com",
    username: "sarahk",
    displayName: "Sarah Kim",
    firstName: "Sarah",
    lastName: "Kim",
  },
];

async function seedTestUsers() {
  console.log("Seeding test users...");
  
  for (const testUser of testUsers) {
    const [existing] = await db.select().from(users).where(eq(users.id, testUser.id));
    
    if (existing) {
      console.log(`User ${testUser.displayName} already exists, skipping...`);
    } else {
      await db.insert(users).values(testUser);
      console.log(`Created user: ${testUser.displayName} (@${testUser.username})`);
    }
  }
  
  console.log("Done seeding test users!");
  process.exit(0);
}

seedTestUsers().catch((err) => {
  console.error("Error seeding users:", err);
  process.exit(1);
});
