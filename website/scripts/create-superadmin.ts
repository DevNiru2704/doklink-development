import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/doklink_hospital";

async function createSuperAdmin() {
  console.log("🚀 Creating SuperAdmin account...");

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db();

    // Check if SuperAdmin already exists
    const existingSuperAdmin = await db.collection("users").findOne({
      role: "SuperAdmin",
    });

    if (existingSuperAdmin) {
      console.log("⚠️  SuperAdmin already exists!");
      console.log("   Email:", existingSuperAdmin.email);
      return;
    }

    // Create SuperAdmin
    const superAdminEmail = "superadmin@doklink.com";
    const superAdminPassword = "Super@123"; // Change this in production!

    const passwordHash = await bcrypt.hash(superAdminPassword, 10);

    const superAdmin = {
      name: "Super Administrator",
      email: superAdminEmail,
      passwordHash,
      role: "SuperAdmin",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      // No hospitalId for SuperAdmin
    };

    await db.collection("users").insertOne(superAdmin);

    console.log("✅ SuperAdmin created successfully!");
    console.log("\n📧 Login Credentials:");
    console.log("   Email:", superAdminEmail);
    console.log("   Password:", superAdminPassword);
    console.log("\n⚠️  IMPORTANT: Change the SuperAdmin password after first login!");
  } catch (error) {
    console.error("❌ Error creating SuperAdmin:", error);
  } finally {
    await client.close();
    console.log("\n✅ Database connection closed");
  }
}

createSuperAdmin();
