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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, ArrowLeft, Blocks, Code2, Sparkles } from "lucide-react";
import type { GameCreationMode } from "@/lib/types";

interface GameType {
  id: string;
  name: string;
  slug: string;
}

export default function CreateGamePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [gameTypes, setGameTypes] = useState<GameType[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [gameCreationMode, setGameCreationMode] = useState<GameCreationMode>("blockly");

  useEffect(() => {
    async function fetchGameTypes() {
      const q = query(
        collection(db, "game_types"),
        where("isActive", "==", true)
      );

      // Try cache first for instant load
      try {
        const cacheSnapshot = await getDocsFromCache(q);
        console.log(`[Perf] Game types from cache: ${cacheSnapshot.size}`);
        const types: GameType[] = [];
        cacheSnapshot.forEach((doc) => {
          types.push({ id: doc.id, ...doc.data() } as GameType);
        });
        if (types.length > 0) {
          setGameTypes(types);
          return; // Got data from cache, done
        }
      } catch (err) {
        console.log("[Perf] No cache for game_types, trying network...");
      }

      // Fallback to network if cache is empty or failed
      try {
        const querySnapshot = await getDocs(q);
        console.log(`[Perf] Game types from network: ${querySnapshot.size}`);
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
    if (!title || !selectedType) return;

    // Auth check
    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in to create a game."); // Simple alert for now, or redirect to login
      return;
    }

    setLoading(true);
    try {
      const typeData = gameTypes.find((t) => t.id === selectedType);

      const docRef = await addDoc(collection(db, "games"), {
        title,
        description,
        gameCreationMode,
        typeId: selectedType,
        typeName: typeData?.name || "Unknown",
        ownerId: user.uid,
        status: "draft",
        visibility: "private",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        stats: {
          plays: 0,
          likes: 0,
        },
      });

      router.push(`/games/${docRef.id}`);
    } catch (error) {
      console.error("Error creating game:", error);
      // Logic to show error toast could be added here
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/games"
        className="flex items-center text-sm text-muted-foreground hover:text-white transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Games
      </Link>

      <Card className="border-white/10 bg-black/50 overflow-hidden">
        <CardHeader>
          <CardTitle>Create New Game</CardTitle>
          <CardDescription>
            Start a new game project. Choose a template to get started quickly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Game Creation Mode Selection */}
            <div className="space-y-3">
              <Label>Development Mode</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Blockly Mode Card */}
                <button
                  type="button"
                  onClick={() => setGameCreationMode("blockly")}
                  className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                    gameCreationMode === "blockly"
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
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
                    <div className={`p-2 rounded-lg ${gameCreationMode === "blockly" ? "bg-purple-500/20" : "bg-white/10"}`}>
                      <Blocks className={`size-6 ${gameCreationMode === "blockly" ? "text-purple-400" : "text-white/60"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">Blockly</h3>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/20 text-green-400">
                          <Sparkles className="size-3" />
                          Beginner
                        </span>
                      </div>
                      <p className="text-sm text-white/60 mt-1">
                        Visual block-based programming with AI assistance. Perfect for learning game development.
                      </p>
                    </div>
                  </div>
                </button>

                {/* JavaScript Mode Card */}
                <button
                  type="button"
                  onClick={() => setGameCreationMode("javascript")}
                  className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                    gameCreationMode === "javascript"
                      ? "border-yellow-500 bg-yellow-500/10"
                      : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
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
                    <div className={`p-2 rounded-lg ${gameCreationMode === "javascript" ? "bg-yellow-500/20" : "bg-white/10"}`}>
                      <Code2 className={`size-6 ${gameCreationMode === "javascript" ? "text-yellow-400" : "text-white/60"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">JavaScript</h3>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-500/20 text-orange-400">
                          Advanced
                        </span>
                      </div>
                      <p className="text-sm text-white/60 mt-1">
                        Full code editor with p5.js. Maximum flexibility for experienced developers.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Game Title</Label>
              <Input
                id="title"
                placeholder="My Awesome Game"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="bg-white/5 border-white/10 text-white focus:border-white/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your game..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-white/5 border-white/10 text-white focus:border-white/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Game Type</Label>
              <Select
                value={selectedType}
                onValueChange={setSelectedType}
                required
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white focus:border-white/20">
                  <SelectValue placeholder="Select a game type" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-white/10 text-white">
                  {gameTypes.map((type) => (
                    <SelectItem
                      key={type.id}
                      value={type.id}
                      className="focus:bg-white/10 focus:text-white cursor-pointer"
                    >
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Project
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
