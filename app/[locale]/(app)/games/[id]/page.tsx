"use client";

import { use, useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Play,
  Edit3,
  Share2,
  BarChart3,
  Settings,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { notFound } from "next/navigation";

interface Game {
  id: string;
  title: string;
  description: string;
  typeName: string;
  categoryName: string;
  status: string;
  visibility: string;
  stats?: {
    plays: number;
    likes: number;
  };
  createdAt: any;
}

export default function GameDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGame() {
      try {
        const docRef = doc(db, "games", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setGame({ id: docSnap.id, ...docSnap.data() } as Game);
        } else {
          // Handle not found
          setGame(null);
        }
      } catch (error) {
        console.error("Error fetching game:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchGame();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!game) {
    // Ideally trigger nextjs notFound() but that works better in Server Components or during initial render if data was pre-fetched.
    // For client side, we can just show a UI.
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <h2 className="text-2xl font-bold">Game not found</h2>
        <Link href="/games">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Games
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link
              href="/games"
              className="hover:text-white transition-colors flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Games
            </Link>
            <span>/</span>
            <span className="text-white">{game.title}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{game.title}</h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{game.typeName}</Badge>
            <Badge
              className={
                game.status === "published"
                  ? "bg-green-500/10 text-green-500"
                  : "bg-yellow-500/10 text-yellow-500"
              }
            >
              {game.status}
            </Badge>
            <Badge variant="secondary">{game.visibility}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Share2 className="mr-2 h-4 w-4" /> Share
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="mr-2 h-4 w-4" /> Settings
          </Button>
          <Button
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Edit3 className="mr-2 h-4 w-4" /> Edit
          </Button>
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Play className="mr-2 h-4 w-4" /> Play
          </Button>
        </div>
      </div>

      <Separator className="bg-white/10" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-white/10 bg-black/20">
            <div className="aspect-video w-full bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center rounded-t-xl">
              <span className="text-neutral-500">
                Game Preview / Cover Image
              </span>
            </div>
            <CardHeader>
              <CardTitle>About this game</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {game.description || "No description provided."}
              </p>
            </CardContent>
          </Card>

          <Tabs defaultValue="levels" className="w-full">
            <TabsList className="bg-white/5 border border-white/10 text-muted-foreground">
              <TabsTrigger
                value="levels"
                className="data-[state=active]:bg-white/10 data-[state=active]:text-white"
              >
                Levels
              </TabsTrigger>
              <TabsTrigger
                value="rankings"
                className="data-[state=active]:bg-white/10 data-[state=active]:text-white"
              >
                Leaderboard
              </TabsTrigger>
            </TabsList>
            <TabsContent value="levels" className="mt-4">
              <Card className="border-white/10 bg-black/20">
                <CardHeader>
                  <CardTitle>Levels</CardTitle>
                  <CardDescription>
                    Manage your game levels here.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    No levels created yet. Open the editor to add levels.
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="rankings" className="mt-4">
              <Card className="border-white/10 bg-black/20">
                <CardHeader>
                  <CardTitle>Leaderboard</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    No scores recorded yet.
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card className="border-white/10 bg-black/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" /> Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Plays</span>
                <span className="text-xl font-bold">
                  {game.stats?.plays || 0}
                </span>
              </div>
              <Separator className="bg-white/5" />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Likes</span>
                <span className="text-xl font-bold">
                  {game.stats?.likes || 0}
                </span>
              </div>
              <Separator className="bg-white/5" />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Created</span>
                <span className="text-sm text-right">
                  {game.createdAt?.toDate
                    ? new Date(game.createdAt.toDate()).toLocaleDateString()
                    : "Just now"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
