"use client";

import { useState, useEffect } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  getDocsFromCache,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, ArrowLeft, Blocks, Code2, Sparkles, Wand2 } from "lucide-react";
import type { GameCreationMode } from "@/lib/types";

interface GameType {
  id: string;
  name: string;
  slug: string;
}

// Prompt suggestions for each mode
const PROMPT_SUGGESTIONS: Record<GameCreationMode, string[]> = {
  blockly: [
    "A catching game where objects fall from the sky and I need to catch them with a basket. Make it colorful and fun!",
    "A maze game where I control a character to find the exit while avoiding obstacles. Add a timer!",
    "A simple clicker game where I click on targets that appear randomly. Track my score and make it challenging!",
  ],
  javascript: [
    "A space shooter with a spaceship that shoots lasers at incoming asteroids. Arrow keys to move, space to shoot. Add particles and explosions!",
    "A platformer game with gravity, jumping, and moving platforms. The player collects coins and avoids spikes.",
    "A snake game where the snake grows when eating food. Include wall collision, self-collision, and increasing speed.",
  ],
};

export default function CreateGamePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [gameTypes, setGameTypes] = useState<GameType[]>([]);
  const [prompt, setPrompt] = useState("");
  const [gameCreationMode, setGameCreationMode] = useState<GameCreationMode>("javascript");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    async function fetchGameTypes() {
      const q = query(
        collection(db, "game_types"),
        where("isActive", "==", true)
      );

      // Try cache first for instant load
      try {
        const cacheSnapshot = await getDocsFromCache(q);
        const types: GameType[] = [];
        cacheSnapshot.forEach((doc) => {
          types.push({ id: doc.id, ...doc.data() } as GameType);
        });
        if (types.length > 0) {
          setGameTypes(types);
          return;
        }
      } catch {
        // Cache miss, try network
      }

      // Fallback to network
      try {
        const querySnapshot = await getDocs(q);
        const types: GameType[] = [];
        querySnapshot.forEach((doc) => {
          types.push({ id: doc.id, ...doc.data() } as GameType);
        });
        setGameTypes(types);
      } catch (error) {
        console.error("Error fetching game types:", error);
      }
    }
    fetchGameTypes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in to create a game.");
      return;
    }

    if (gameTypes.length === 0) {
      alert("Game types not loaded. Please try again.");
      return;
    }

    setLoading(true);
    setStatusMessage("Generating game details...");

    try {
      // Step 1: Generate metadata from prompt
      const metadataResponse = await fetch("/api/games/generate-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          gameTypes,
          gameCreationMode,
        }),
      });

      if (!metadataResponse.ok) {
        const error = await metadataResponse.json();
        throw new Error(error.error || "Failed to generate game details");
      }

      const metadata = await metadataResponse.json();
      setStatusMessage("Creating your game...");

      // Step 2: Create the game in Firestore
      const docRef = await addDoc(collection(db, "games"), {
        title: metadata.title,
        description: metadata.description,
        gameCreationMode,
        typeId: metadata.typeId,
        typeName: metadata.typeName,
        ownerId: user.uid,
        status: "draft",
        visibility: "private",
        initialPrompt: metadata.optimizedPrompt,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        stats: {
          plays: 0,
          likes: 0,
        },
      });

      setStatusMessage("Opening game editor...");

      // Step 3: Redirect to game editor with flag to auto-start AI
      router.push(`/editor/${docRef.id}?autostart=true`);
    } catch (error) {
      console.error("Error creating game:", error);
      alert(error instanceof Error ? error.message : "Failed to create game");
    } finally {
      setLoading(false);
      setStatusMessage("");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/games"
        className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Games
      </Link>

      <Card className="border-border bg-card overflow-hidden">
        <CardHeader>
          <CardTitle>Create New Game</CardTitle>
          <CardDescription>
            Describe your game idea and our AI will help you build it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Game Creation Mode Selection */}
            <div className="space-y-3">
              <Label>Development Mode</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* JavaScript Mode Card */}
                <button
                  type="button"
                  onClick={() => setGameCreationMode("javascript")}
                  disabled={loading}
                  className={`relative p-4 rounded-lg border-2 text-left transition-all disabled:opacity-50 ${
                    gameCreationMode === "javascript"
                      ? "border-yellow-500 bg-yellow-500/10"
                      : "border-border bg-muted/50 hover:border-muted-foreground/30 hover:bg-muted"
                  }`}
                >
                  {gameCreationMode === "javascript" && (
                    <div className="absolute top-2 right-2">
                      <div className="size-5 rounded-full bg-yellow-500 flex items-center justify-center">
                        <svg className="size-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${gameCreationMode === "javascript" ? "bg-yellow-500/20" : "bg-muted"}`}>
                      <Code2 className={`size-6 ${gameCreationMode === "javascript" ? "text-yellow-400" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">JavaScript</h3>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-500/20 text-orange-400">
                          Advanced
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Full code editor with p5.js for experienced developers.
                      </p>
                    </div>
                  </div>
                </button>

                {/* Blockly Mode Card */}
                <button
                  type="button"
                  onClick={() => setGameCreationMode("blockly")}
                  disabled={loading}
                  className={`relative p-4 rounded-lg border-2 text-left transition-all disabled:opacity-50 ${
                    gameCreationMode === "blockly"
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-border bg-muted/50 hover:border-muted-foreground/30 hover:bg-muted"
                  }`}
                >
                  {gameCreationMode === "blockly" && (
                    <div className="absolute top-2 right-2">
                      <div className="size-5 rounded-full bg-purple-500 flex items-center justify-center">
                        <svg className="size-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${gameCreationMode === "blockly" ? "bg-purple-500/20" : "bg-muted"}`}>
                      <Blocks className={`size-6 ${gameCreationMode === "blockly" ? "text-purple-400" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">Blockly</h3>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/20 text-green-400">
                          <Sparkles className="size-3" />
                          Beginner
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Visual block-based programming with AI assistance.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Game Idea Prompt */}
            <div className="space-y-3">
              <Label htmlFor="prompt">Describe your game idea</Label>
              <Textarea
                id="prompt"
                placeholder="E.g., A space shooter where you control a spaceship and destroy asteroids. Use arrow keys to move and space to shoot. The game gets harder as you progress..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={loading}
                rows={5}
                className="resize-none"
              />

              {/* Prompt Suggestions */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Or try one of these ideas:
                </p>
                <div className="flex flex-wrap gap-2">
                  {PROMPT_SUGGESTIONS[gameCreationMode].map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setPrompt(suggestion)}
                      disabled={loading}
                      className="text-xs px-3 py-1.5 rounded-full border border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground hover:border-muted-foreground/30 transition-colors disabled:opacity-50 text-left"
                    >
                      {suggestion.length > 50 ? suggestion.slice(0, 50) + "..." : suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {statusMessage || "Creating..."}
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Create Game with AI
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
