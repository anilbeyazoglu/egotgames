"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  onSnapshot,
  getDocsFromCache,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Plus, Gamepad2, Calendar, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Game {
  id: string;
  title: string;
  description: string;
  typeName: string;
  categoryName: string;
  status: string;
  stats?: {
    plays: number;
    likes: number;
  };
  createdAt: any;
}

export default function GamesPage() {
  const t = useTranslations("Dashboard"); // Assuming we might add more keys later
  // For now using hardcoded strings or generic t function where applicable if keys missing

  // State for User and Games
  const [user, setUser] = useState<any>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTimeout, setIsTimeout] = useState(false);

  // 1. Auth Listener
  useEffect(() => {
    performance.mark("auth-start");
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      performance.mark("auth-end");
      performance.measure("Auth Duration", "auth-start", "auth-end");
      const measure = performance.getEntriesByName("Auth Duration")[0];
      console.log(
        `[Perf] Auth state resolved in ${measure.duration.toFixed(2)}ms`,
        currentUser ? "User found" : "No user"
      );

      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
        setGames([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Data Listener (Dependent on User)
  useEffect(() => {
    let unsubscribeSnapshot: () => void;

    if (user) {
      console.log("Setting up games for:", user.uid);
      setIsTimeout(false);

      const q = query(
        collection(db, "games"),
        where("ownerId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      // STEP 1: Load from cache INSTANTLY (no network wait)
      getDocsFromCache(q)
        .then((cacheSnapshot) => {
          console.log(
            `[Perf] Cache read: ${cacheSnapshot.size} docs instantly`
          );
          const gamesData: Game[] = [];
          cacheSnapshot.forEach((doc) => {
            gamesData.push({ id: doc.id, ...doc.data() } as Game);
          });
          setGames(gamesData);
          setLoading(false); // Stop loading immediately
        })
        .catch((err) => {
          console.log(
            "[Perf] No cache available, waiting for network...",
            err.message
          );
          // Cache miss is fine, listener will handle it
        });

      // STEP 2: Set up realtime listener for updates (network)
      unsubscribeSnapshot = onSnapshot(
        q,
        (querySnapshot) => {
          console.log(
            `[Perf] Network update: ${querySnapshot.size} docs, fromCache: ${querySnapshot.metadata.fromCache}`
          );
          const gamesData: Game[] = [];
          querySnapshot.forEach((doc) => {
            gamesData.push({ id: doc.id, ...doc.data() } as Game);
          });
          setGames(gamesData);
          setLoading(false);
        },
        (error) => {
          console.error("Games listener error:", error);
          setLoading(false);
        }
      );
    } else if (user === null) {
      setLoading(false);
      setGames([]);
    }

    return () => {
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, [user]); // Re-run when user changes

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        {isTimeout && (
          <div className="text-center space-y-2 animate-in fade-in">
            <p className="text-muted-foreground">
              This is taking longer than expected...
            </p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Games</h2>
          <p className="text-muted-foreground">
            Manage and create your game projects.
          </p>
        </div>
        <Link href="/games/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Create Game
          </Button>
        </Link>
      </div>

      {games.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
            <Gamepad2 className="h-6 w-6 text-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No games yet</h3>
          <p className="mb-4 text-sm text-muted-foreground max-w-sm">
            You haven't created any games yet. Start by creating your first
            project!
          </p>
          <Link href="/games/create">
            <Button>Create Game</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <Link key={game.id} href={`/games/${game.id}`}>
              <Card className="h-full hover:bg-white/5 transition-colors cursor-pointer border-white/10 overflow-hidden">
                <div className="aspect-video w-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center mb-4">
                  <Gamepad2 className="h-12 w-12 text-white/20" />
                </div>
                <CardHeader className="p-4 pt-0">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="mb-2">
                      {game.typeName || "Game"}
                    </Badge>
                    <Badge
                      className={
                        game.status === "published"
                          ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                          : "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"
                      }
                    >
                      {game.status}
                    </Badge>
                  </div>
                  <CardTitle className="line-clamp-1">{game.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {game.description || "No description provided."}
                  </p>
                </CardContent>
                <CardFooter className="p-4 pt-0 text-xs text-muted-foreground flex justify-between items-center mt-auto">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{game.stats?.plays || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {game.createdAt?.toDate
                        ? new Date(game.createdAt.toDate()).toLocaleDateString()
                        : "Just now"}
                    </span>
                  </div>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
