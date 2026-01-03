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

async function seedGameTypes() {
  console.log("Starting game types & categories seed...\n");

  try {
    const collections = await db.listCollections();
    console.log(
      "Connected! Found collections:",
      collections.map((c) => c.id).join(", ") || "(none)"
    );
  } catch (err) {
    console.error("Connection test failed:", err.message);
    process.exit(1);
  }

  // Game Categories (will update existing or create new)
  const categories = [
    {
      id: "arcade",
      name: "Arcade",
      description: "Classic arcade-style games with simple controls and addictive gameplay loops.",
    },
    {
      id: "puzzle",
      name: "Puzzle",
      description: "Brain-teasing games that challenge logic, pattern recognition, and problem-solving.",
    },
    {
      id: "action-adventure",
      name: "Action/Adventure",
      description: "Games focused on exploration, combat, and puzzle solving.",
    },
    {
      id: "simulation",
      name: "Simulation",
      description: "Games that simulate real-world activities, systems, or environments.",
    },
    {
      id: "casual",
      name: "Casual/Hyper-Casual",
      description: "Simple, easy-to-play games perfect for quick gaming sessions.",
    },
    {
      id: "educational",
      name: "Educational",
      description: "Games designed to teach concepts through interactive gameplay.",
    },
    {
      id: "strategy",
      name: "Strategy",
      description: "Games requiring tactical thinking and planning to achieve objectives.",
    },
    {
      id: "racing",
      name: "Racing",
      description: "Fast-paced games focused on speed, competition, and vehicle control.",
    },
    {
      id: "sports",
      name: "Sports",
      description: "Games based on real-world sports and athletic competitions.",
    },
  ];

  console.log("\n--- Seeding Categories ---");
  for (const category of categories) {
    await db.collection("game_categories").doc(category.id).set({
      name: category.name,
      slug: category.id,
      description: category.description,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    console.log("✓ Category: " + category.name);
  }

  // Game Types
  const gameTypes = [
    // Arcade Games (p5.js)
    {
      id: "classic-snake",
      categoryId: "arcade",
      name: "Classic Snake",
      engine: "p5js",
      perspective: "top-down",
      artStyle: "minimal",
      description: "Guide a growing snake to eat food without hitting walls or itself.",
    },
    {
      id: "breakout-clone",
      categoryId: "arcade",
      name: "Breakout/Brick Breaker",
      engine: "p5js",
      perspective: "top-down",
      artStyle: "retro",
      description: "Bounce a ball to break bricks and clear levels.",
    },
    {
      id: "space-shooter",
      categoryId: "arcade",
      name: "Space Shooter",
      engine: "p5js",
      perspective: "top-down",
      artStyle: "pixel",
      description: "Defend against waves of enemies in a vertical scrolling shooter.",
    },
    {
      id: "pong-style",
      categoryId: "arcade",
      name: "Pong/Paddle Games",
      engine: "p5js",
      perspective: "side-view",
      artStyle: "minimal",
      description: "Classic paddle and ball gameplay for one or two players.",
    },
    {
      id: "asteroids-clone",
      categoryId: "arcade",
      name: "Asteroids",
      engine: "p5js",
      perspective: "top-down",
      artStyle: "vector",
      description: "Navigate a spaceship and destroy asteroids in a wraparound space.",
    },

    // Puzzle Games (p5.js)
    {
      id: "match-three",
      categoryId: "puzzle",
      name: "Match-3 Puzzle",
      engine: "p5js",
      perspective: "front-view",
      artStyle: "colorful",
      description: "Swap adjacent pieces to match three or more of the same type.",
    },
    {
      id: "sliding-puzzle",
      categoryId: "puzzle",
      name: "Sliding Puzzle",
      engine: "p5js",
      perspective: "front-view",
      artStyle: "clean",
      description: "Rearrange tiles by sliding them into the empty space.",
    },
    {
      id: "memory-match",
      categoryId: "puzzle",
      name: "Memory Match",
      engine: "p5js",
      perspective: "front-view",
      artStyle: "illustrated",
      description: "Find matching pairs by flipping cards and remembering positions.",
    },
    {
      id: "tetris-style",
      categoryId: "puzzle",
      name: "Falling Blocks",
      engine: "p5js",
      perspective: "front-view",
      artStyle: "geometric",
      description: "Arrange falling blocks to complete rows and score points.",
    },
    {
      id: "sokoban",
      categoryId: "puzzle",
      name: "Sokoban/Box Pusher",
      engine: "p5js",
      perspective: "top-down",
      artStyle: "pixel",
      description: "Push boxes onto target locations in the fewest moves.",
    },

    // Action/Adventure (p5.js & three.js)
    {
      id: "retro-2d-pixel",
      categoryId: "action-adventure",
      name: "Retro 2D Pixel Art",
      engine: "p5js",
      perspective: "side-scroller",
      artStyle: "pixel",
      description: "Classic side-scrolling action with pixel art visuals.",
    },
    {
      id: "top-down-adventure",
      categoryId: "action-adventure",
      name: "Top-Down Adventure",
      engine: "p5js",
      perspective: "top-down",
      artStyle: "pixel",
      description: "Explore a world from above, solve puzzles, and defeat enemies.",
    },
    {
      id: "3d-dungeon-crawler",
      categoryId: "action-adventure",
      name: "3D Dungeon Crawler",
      engine: "threejs",
      perspective: "first-person",
      artStyle: "low-poly",
      description: "Explore procedural dungeons in immersive 3D environments.",
    },
    {
      id: "3d-exploration",
      categoryId: "action-adventure",
      name: "3D Exploration",
      engine: "threejs",
      perspective: "third-person",
      artStyle: "stylized",
      description: "Explore open 3D environments and discover hidden secrets.",
    },

    // Simulation (p5.js & three.js)
    {
      id: "life-simulation",
      categoryId: "simulation",
      name: "Life Simulation",
      engine: "p5js",
      perspective: "top-down",
      artStyle: "abstract",
      description: "Watch emergent behaviors from simple life-like rules (Conway's Game of Life, etc.).",
    },
    {
      id: "ecosystem-sim",
      categoryId: "simulation",
      name: "Ecosystem Simulation",
      engine: "p5js",
      perspective: "top-down",
      artStyle: "nature",
      description: "Create and observe interactions between different species.",
    },
    {
      id: "physics-sandbox",
      categoryId: "simulation",
      name: "Physics Sandbox",
      engine: "p5js",
      perspective: "side-view",
      artStyle: "minimal",
      description: "Experiment with physics: gravity, collisions, and particle systems.",
    },
    {
      id: "3d-flight-sim",
      categoryId: "simulation",
      name: "Flight Simulator",
      engine: "threejs",
      perspective: "cockpit",
      artStyle: "realistic",
      description: "Pilot aircraft through 3D skies with realistic controls.",
    },
    {
      id: "city-builder",
      categoryId: "simulation",
      name: "City Builder",
      engine: "threejs",
      perspective: "isometric",
      artStyle: "low-poly",
      description: "Build and manage your own city in 3D.",
    },

    // Casual/Hyper-Casual (p5.js)
    {
      id: "endless-runner",
      categoryId: "casual",
      name: "Endless Runner",
      engine: "p5js",
      perspective: "side-scroller",
      artStyle: "colorful",
      description: "Run endlessly while dodging obstacles and collecting items.",
    },
    {
      id: "tap-timing",
      categoryId: "casual",
      name: "Tap/Timing Game",
      engine: "p5js",
      perspective: "front-view",
      artStyle: "minimal",
      description: "Tap at the right moment to succeed - simple but addictive.",
    },
    {
      id: "color-switch",
      categoryId: "casual",
      name: "Color Matching",
      engine: "p5js",
      perspective: "vertical",
      artStyle: "neon",
      description: "Navigate through obstacles by matching colors.",
    },
    {
      id: "clicker-idle",
      categoryId: "casual",
      name: "Clicker/Idle Game",
      engine: "p5js",
      perspective: "front-view",
      artStyle: "illustrated",
      description: "Click to earn, upgrade, and automate your way to riches.",
    },
    {
      id: "flappy-style",
      categoryId: "casual",
      name: "Flappy/Jump Game",
      engine: "p5js",
      perspective: "side-scroller",
      artStyle: "cartoon",
      description: "Tap to flap or jump through an endless series of obstacles.",
    },

    // Educational (p5.js)
    {
      id: "math-game",
      categoryId: "educational",
      name: "Math Challenge",
      engine: "p5js",
      perspective: "front-view",
      artStyle: "friendly",
      description: "Practice arithmetic through engaging mini-games.",
    },
    {
      id: "typing-tutor",
      categoryId: "educational",
      name: "Typing Game",
      engine: "p5js",
      perspective: "front-view",
      artStyle: "clean",
      description: "Improve typing speed and accuracy through gameplay.",
    },
    {
      id: "word-puzzle",
      categoryId: "educational",
      name: "Word Puzzle",
      engine: "p5js",
      perspective: "front-view",
      artStyle: "illustrated",
      description: "Build vocabulary with word searches, crosswords, and anagrams.",
    },
    {
      id: "coding-game",
      categoryId: "educational",
      name: "Visual Coding",
      engine: "p5js",
      perspective: "front-view",
      artStyle: "tech",
      description: "Learn programming concepts through visual block-based puzzles.",
    },

    // Strategy (p5.js & three.js)
    {
      id: "tower-defense-2d",
      categoryId: "strategy",
      name: "Tower Defense 2D",
      engine: "p5js",
      perspective: "top-down",
      artStyle: "cartoon",
      description: "Place towers strategically to defend against waves of enemies.",
    },
    {
      id: "tower-defense-3d",
      categoryId: "strategy",
      name: "Tower Defense 3D",
      engine: "threejs",
      perspective: "isometric",
      artStyle: "low-poly",
      description: "Defend your base in immersive 3D environments.",
    },
    {
      id: "turn-based-tactics",
      categoryId: "strategy",
      name: "Turn-Based Tactics",
      engine: "p5js",
      perspective: "top-down",
      artStyle: "pixel",
      description: "Command units in grid-based tactical battles.",
    },
    {
      id: "card-battler",
      categoryId: "strategy",
      name: "Card Battler",
      engine: "p5js",
      perspective: "front-view",
      artStyle: "illustrated",
      description: "Build decks and battle opponents with strategic card play.",
    },

    // Racing (p5.js & three.js)
    {
      id: "top-down-racer",
      categoryId: "racing",
      name: "Top-Down Racer",
      engine: "p5js",
      perspective: "top-down",
      artStyle: "retro",
      description: "Race around tracks from a bird's-eye view.",
    },
    {
      id: "3d-kart-racer",
      categoryId: "racing",
      name: "3D Kart Racing",
      engine: "threejs",
      perspective: "third-person",
      artStyle: "cartoon",
      description: "Race go-karts on colorful 3D tracks with power-ups.",
    },
    {
      id: "endless-racer",
      categoryId: "racing",
      name: "Endless Road",
      engine: "threejs",
      perspective: "third-person",
      artStyle: "low-poly",
      description: "Drive endlessly on procedurally generated roads.",
    },

    // Sports (p5.js & three.js)
    {
      id: "2d-soccer",
      categoryId: "sports",
      name: "2D Soccer/Football",
      engine: "p5js",
      perspective: "top-down",
      artStyle: "minimal",
      description: "Fast-paced soccer action from a top-down view.",
    },
    {
      id: "basketball-shooter",
      categoryId: "sports",
      name: "Basketball Shooter",
      engine: "p5js",
      perspective: "side-view",
      artStyle: "cartoon",
      description: "Aim and shoot hoops with physics-based ball mechanics.",
    },
    {
      id: "golf-game",
      categoryId: "sports",
      name: "Mini Golf",
      engine: "threejs",
      perspective: "third-person",
      artStyle: "stylized",
      description: "Putt your way through creative 3D mini golf courses.",
    },
    {
      id: "bowling-3d",
      categoryId: "sports",
      name: "3D Bowling",
      engine: "threejs",
      perspective: "first-person",
      artStyle: "realistic",
      description: "Bowl strikes in realistic 3D bowling alleys.",
    },
  ];

  console.log("\n--- Seeding Game Types ---");
  for (const gameType of gameTypes) {
    await db.collection("game_types").doc(gameType.id).set({
      categoryId: gameType.categoryId,
      name: gameType.name,
      slug: gameType.id,
      description: gameType.description,
      baseConfig: {
        engine: gameType.engine,
        perspective: gameType.perspective,
        artStyle: gameType.artStyle,
      },
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    console.log("✓ Game Type: " + gameType.name);
  }

  console.log("\n========================================");
  console.log(`Seeding complete!`);
  console.log(`  Categories: ${categories.length}`);
  console.log(`  Game Types: ${gameTypes.length}`);
  console.log("========================================\n");
}

seedGameTypes().catch(console.error);
