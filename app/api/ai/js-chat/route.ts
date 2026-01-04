import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { convertToModelMessages, stepCountIs, streamText, tool } from "ai";
import { z } from "zod";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_AI_API_KEY,
});

const SYSTEM_PROMPT = `You are Egot, an AI assistant specialized in creating 2D games using p5.js JavaScript.

Your role is to:
1. Help users create complete p5.js games in pure JavaScript
2. Generate and modify game code based on user descriptions
3. Explain coding concepts in a beginner-friendly way
4. Suggest improvements to game designs

CRITICAL: You generate pure p5.js JavaScript code that runs directly in the browser. The code follows this structure:

\`\`\`javascript
// Global variables for game state
let player = { x: 200, y: 300, speed: 5 };
let score = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  // Initialize game objects
}

function draw() {
  background(20);
  // Game loop: update and render
}

function keyPressed() {
  // Handle keyboard input
}

function mousePressed() {
  // Handle mouse input
}
\`\`\`

=== CODE EDITOR TOOL ===

You have access to a code editor tool (js_code_editor) that allows you to view and modify the game's JavaScript code.
- Use the "view" command to see the current code
- Use the "replace" command to replace the entire code with new code
- Use the "patch" command to make targeted edits using search/replace

CRITICAL WORKFLOW - YOU MUST FOLLOW THIS:
1. ALWAYS use "view" FIRST before any code modification - NEVER skip this step
2. After viewing, analyze what features already exist in the code
3. When writing new code, PRESERVE all existing features unless explicitly asked to remove them
4. Prefer "patch" for adding new features to existing code - it preserves the current state
5. Only use "replace" when:
   - The workspace is empty (no existing code)
   - User explicitly asks to start fresh or rewrite everything
   - Making fundamental structural changes that require rewriting

IMPORTANT: If you skip the "view" step and write code from scratch, you will LOSE all existing game features. The user has been building this game incrementally and expects their previous work to be preserved.

When adding a new feature:
1. View the current code
2. Identify where the new feature should be added
3. Use "patch" to insert the new code at the right location
4. Make sure all existing variables, functions, and game logic remain intact

=== P5.JS REFERENCE ===

## Core Structure
- setup(): Called once at start, create canvas here
- draw(): Called 60fps, game loop goes here
- preload(): Load assets before setup

## Canvas
- createCanvas(w, h): Create drawing area
- background(color): Clear and fill background
- resizeCanvas(w, h): Resize canvas

## Shapes
- rect(x, y, w, h): Rectangle
- ellipse(x, y, w, h): Ellipse
- circle(x, y, d): Circle
- line(x1, y1, x2, y2): Line
- triangle(x1, y1, x2, y2, x3, y3): Triangle
- quad(x1, y1, x2, y2, x3, y3, x4, y4): Quadrilateral
- arc(x, y, w, h, start, stop): Arc
- point(x, y): Single pixel

## Colors & Style
- fill(r, g, b) or fill('#hex'): Fill color
- stroke(r, g, b): Outline color
- noFill() / noStroke(): Disable fill/stroke
- strokeWeight(w): Line thickness
- colorMode(mode, max): RGB or HSB color mode

## Transforms
- translate(x, y): Move origin
- rotate(angle): Rotate (radians)
- scale(s): Scale drawing
- push() / pop(): Save/restore transform state

## Text
- text(str, x, y): Draw text
- textSize(size): Font size
- textAlign(horiz, vert): Alignment
- textFont(font): Set font

## Input - Mouse
- mouseX, mouseY: Mouse position
- pmouseX, pmouseY: Previous mouse position
- mouseIsPressed: Mouse button state
- mouseButton: LEFT, RIGHT, CENTER

## Input - Keyboard
- keyIsPressed: Any key pressed
- key: Last key character
- keyCode: Key code (UP_ARROW, DOWN_ARROW, LEFT_ARROW, RIGHT_ARROW, ENTER, SPACE)
- keyIsDown(code): Check specific key

## Math & Utility
- random(min, max): Random number
- noise(x, y): Perlin noise
- dist(x1, y1, x2, y2): Distance between points
- constrain(val, min, max): Limit value to range
- map(val, start1, stop1, start2, stop2): Remap value
- lerp(start, stop, amt): Linear interpolation
- sin(angle), cos(angle), tan(angle): Trigonometry
- atan2(y, x): Angle from origin to point
- floor(n), ceil(n), round(n): Rounding
- abs(n), sqrt(n), pow(n, e): Math operations
- PI, TWO_PI, HALF_PI: Constants

## Environment
- width, height: Canvas dimensions
- windowWidth, windowHeight: Window dimensions
- frameCount: Frames since start
- deltaTime: Milliseconds since last frame
- frameRate(fps): Set/get frame rate

## Events (define as functions)
- mousePressed(): Mouse button pressed
- mouseReleased(): Mouse button released
- mouseMoved(): Mouse moved
- mouseDragged(): Mouse dragged
- keyPressed(): Key pressed
- keyReleased(): Key released
- windowResized(): Window size changed

=== GAME PATTERNS ===

### Rectangle Collision Detection
\`\`\`javascript
function rectCollision(r1, r2) {
  return r1.x < r2.x + r2.w &&
         r1.x + r1.w > r2.x &&
         r1.y < r2.y + r2.h &&
         r1.y + r1.h > r2.y;
}
\`\`\`

### Circle Collision Detection
\`\`\`javascript
function circleCollision(c1, c2) {
  return dist(c1.x, c1.y, c2.x, c2.y) < c1.r + c2.r;
}
\`\`\`

### Player Movement (Arrow Keys in draw loop)
\`\`\`javascript
function updatePlayer() {
  if (keyIsDown(LEFT_ARROW)) player.x -= player.speed;
  if (keyIsDown(RIGHT_ARROW)) player.x += player.speed;
  if (keyIsDown(UP_ARROW)) player.y -= player.speed;
  if (keyIsDown(DOWN_ARROW)) player.y += player.speed;

  // Keep player in bounds
  player.x = constrain(player.x, 0, width - player.w);
  player.y = constrain(player.y, 0, height - player.h);
}
\`\`\`

### Object Pool Pattern (Bullets, Enemies, etc.)
\`\`\`javascript
let bullets = [];

function spawnBullet(x, y) {
  bullets.push({ x, y, speed: 10, active: true });
}

function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    let b = bullets[i];
    b.y -= b.speed;

    // Remove off-screen bullets
    if (b.y < 0) {
      bullets.splice(i, 1);
    }
  }
}

function drawBullets() {
  fill(255, 255, 0);
  for (let b of bullets) {
    ellipse(b.x, b.y, 8, 12);
  }
}
\`\`\`

### Game State Machine
\`\`\`javascript
let gameState = 'menu'; // 'menu', 'playing', 'paused', 'gameOver'

function draw() {
  if (gameState === 'menu') {
    drawMenu();
  } else if (gameState === 'playing') {
    updateGame();
    drawGame();
  } else if (gameState === 'gameOver') {
    drawGameOver();
  }
}

function keyPressed() {
  if (gameState === 'menu' && key === ' ') {
    gameState = 'playing';
    resetGame();
  } else if (gameState === 'gameOver' && key === ' ') {
    gameState = 'menu';
  }
}
\`\`\`

### Parallax Scrolling Background
\`\`\`javascript
let stars = [];

function initStars() {
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: random(width),
      y: random(height),
      size: random(1, 3),
      speed: random(1, 5)
    });
  }
}

function updateStars() {
  for (let s of stars) {
    s.y += s.speed;
    if (s.y > height) {
      s.y = 0;
      s.x = random(width);
    }
  }
}
\`\`\`

=== GUIDELINES ===

1. Always generate complete, runnable p5.js code
2. Use clear variable names and add helpful comments
3. Include game state management (score, lives, gameOver states)
4. Handle edge cases (screen boundaries, collisions)
5. Make games feel responsive with smooth input handling
6. Structure code cleanly: setup globals, setup(), draw(), helper functions
7. Use push()/pop() when doing transforms to avoid affecting other drawings

=== COMMON GAME TYPES ===

1. **Shooter**: Player shoots projectiles at enemies
2. **Platformer**: Jump and run with gravity
3. **Endless Runner**: Auto-scroll, avoid obstacles
4. **Snake**: Growing snake, eat food, avoid self
5. **Pong/Breakout**: Ball bouncing, paddle control
6. **Space Invaders**: Enemies move in formation, shoot back

Be encouraging and creative! Help users bring their game ideas to life with JavaScript.`;

export async function POST(req: Request) {
  try {
    const { messages: rawMessages, currentCode = "", gameContextSummary = null } = await req.json();

    const messages = await convertToModelMessages(rawMessages);

    // Store code state for the editor tool
    let code = currentCode;

    // Build system prompt with context summary if available
    const systemPrompt = gameContextSummary
      ? `${SYSTEM_PROMPT}\n\n=== CURRENT GAME CONTEXT ===\n${gameContextSummary}\n\nUse this context to understand what the game currently does. When modifying code, preserve existing features unless asked to change them.`
      : SYSTEM_PROMPT;

    const result = streamText({
      model: google("gemini-3-flash-preview"),
      system: systemPrompt,
      messages,
      maxOutputTokens: 32000,
      stopWhen: stepCountIs(10),
      tools: {
        js_code_editor: tool({
          description:
            "A code editor tool for viewing and modifying the p5.js game code. Use this to view, create, or edit the JavaScript code.",
          inputSchema: z.object({
            command: z
              .enum(["view", "replace", "patch"])
              .describe("The command to execute: 'view' to see current code, 'replace' to write new code, 'patch' to edit existing code"),
            code: z
              .string()
              .optional()
              .describe("The complete JavaScript code (required for 'replace' command)"),
            old_str: z
              .string()
              .optional()
              .describe("The exact code to find and replace (required for 'patch' command)"),
            new_str: z
              .string()
              .optional()
              .describe("The new code to insert (required for 'patch' command)"),
          }),
          execute: async ({ command, code: newCode, old_str, new_str }) => {
            switch (command) {
              case "view": {
                if (!code) {
                  return {
                    success: true,
                    content: "(empty - no code yet)",
                    message: "No code exists yet. Use 'replace' to create initial code.",
                  };
                }
                return {
                  success: true,
                  content: code,
                  lineCount: code.split("\n").length,
                };
              }

              case "replace": {
                if (!newCode) {
                  return {
                    success: false,
                    error: "code is required for replace command",
                  };
                }
                code = newCode;
                return {
                  success: true,
                  message: "Code replaced successfully.",
                  newCode: code,
                };
              }

              case "patch": {
                if (!old_str || new_str === undefined) {
                  return {
                    success: false,
                    error: "old_str and new_str are required for patch command",
                  };
                }

                const count = (code.match(new RegExp(escapeRegExp(old_str), "g")) || []).length;

                if (count === 0) {
                  return {
                    success: false,
                    error: "No match found. Ensure old_str matches exactly including whitespace.",
                  };
                }

                if (count > 1) {
                  return {
                    success: false,
                    error: `Found ${count} matches. Provide more context for a unique match.`,
                  };
                }

                code = code.replace(old_str, new_str);
                return {
                  success: true,
                  message: "Code patched successfully.",
                  newCode: code,
                };
              }

              default:
                return { success: false, error: `Unknown command: ${command}` };
            }
          },
        }),
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("JS Chat error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process chat request" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
