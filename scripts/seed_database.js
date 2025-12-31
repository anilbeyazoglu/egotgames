const admin = require("firebase-admin");
const serviceAccountPath = "./service-account.json";
const fs = require("fs");

// Initialize Firebase Admin
let appConfig = {
  projectId: "egotgames-2017",
};

if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.log("Using GOOGLE_APPLICATION_CREDENTIALS...");
} else if (fs.existsSync(serviceAccountPath)) {
  console.log("Found service-account.json, using it for credentials...");
  const serviceAccount = require(serviceAccountPath);
  appConfig.credential = admin.credential.cert(serviceAccount);
} else {
  // Fallback to ADC (will fail if no gcloud)
  console.log(
    "No service-account.json found. Attempting to use Application Default Credentials (ADC)..."
  );
}

if (!admin.apps.length) {
  try {
    admin.initializeApp(appConfig);
  } catch (e) {
    console.error("Failed to initialize Firebase Admin:", e.message);
    console.log("\nTo fix this (since you don't have gcloud):");
    console.log(
      "1. Go to Firebase Console > Project Settings > Service accounts"
    );
    console.log("2. Click 'Generate new private key'");
    console.log("3. Save the file as 'service-account.json' in this directory");
    process.exit(1);
  }
}

const { getFirestore } = require("firebase-admin/firestore");
const db = getFirestore(admin.app(), "egotgames-prod");

async function seedDatabase() {
  console.log("Starting database seed...");

  try {
    const collections = await db.listCollections();
    console.log(
      "Connected! Found collections:",
      collections.map((c) => c.id).join(", ") || "(none)"
    );
  } catch (err) {
    console.error("Connection test failed:", err.message);
    // If listCollections fails with NOT_FOUND, it definitely means Project/DB ID issue
  }

  // 1. Game Categories
  const actionAdventureRef = db
    .collection("game_categories")
    .doc("action-adventure");
  await actionAdventureRef.set({
    name: "Action/Adventure",
    slug: "action-adventure",
    description: "Games focused on exploration, combat, and puzzle solving.",
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log("Created Category: Action/Adventure");

  // 2. Game Types (linked to Action/Adventure)
  const retroPixelRef = db.collection("game_types").doc("retro-2d-pixel");
  await retroPixelRef.set({
    categoryId: "action-adventure",
    name: "Retro 2D Pixel Art",
    slug: "retro-2d-pixel",
    baseConfig: {
      engine: "phaser", // Example
      perspective: "side-scroller",
      artStyle: "pixel",
    },
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log("Created Game Type: Retro 2D Pixel Art");

  // 3. Credit Packages
  const packages = [
    {
      id: "starter",
      name: "Starter Pack",
      credits: 100,
      price: 9.99,
      currency: "USD",
    },
    {
      id: "pro",
      name: "Pro Pack",
      credits: 500,
      price: 39.99,
      currency: "USD",
    },
    {
      id: "enterprise",
      name: "Studio Pack",
      credits: 2000,
      price: 149.99,
      currency: "USD",
    },
  ];

  for (const pkg of packages) {
    await db
      .collection("credit_packages")
      .doc(pkg.id)
      .set({
        ...pkg,
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    console.log("Created Credit Package: " + pkg.name);
  }

  console.log("Database seeding completed successfully.");
}

seedDatabase().catch(console.error);
