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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";

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
