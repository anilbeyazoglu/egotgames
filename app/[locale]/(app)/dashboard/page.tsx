"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocsFromCache,
} from "firebase/firestore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Gamepad2,
  Users,
  ArrowUpRight,
  ArrowRight,
  Calendar,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

interface Game {
  id: string;
  title: string;
  description: string;
  typeName: string;
  status: string;
  coverUrl?: string;
  createdAt: any;
}

export default function DashboardPage() {
  const t = useTranslations("Dashboard.overview");

  const [user, setUser] = useState<any>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [totalGames, setTotalGames] = useState(0);
  const [loading, setLoading] = useState(true);

  // Auth listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
        setGames([]);
        setTotalGames(0);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch recent games (limit 3)
  useEffect(() => {
    let unsubscribeSnapshot: () => void;

    if (user) {
      const q = query(
        collection(db, "games"),
        where("ownerId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(3)
      );

      // Cache-first
      getDocsFromCache(q)
        .then((cacheSnapshot) => {
          const gamesData: Game[] = [];
          cacheSnapshot.forEach((doc) => {
            gamesData.push({ id: doc.id, ...doc.data() } as Game);
          });
          setGames(gamesData);
          setLoading(false);
        })
        .catch(() => {
          // Cache miss, listener will handle it
        });

      // Real-time listener
      unsubscribeSnapshot = onSnapshot(
        q,
        (querySnapshot) => {
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

      // Also fetch total count (separate query without limit)
      const countQuery = query(
        collection(db, "games"),
        where("ownerId", "==", user.uid)
      );
      onSnapshot(countQuery, (snapshot) => {
        setTotalGames(snapshot.size);
      });
    }

    return () => {
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, [user]);

  return (
    <div className="space-y-8">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border bg-card text-foreground dark:bg-neutral-900 dark:text-white dark:border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("totalGames")}
            </CardTitle>
            <Gamepad2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGames}</div>
            <p className="text-xs text-muted-foreground">
              {t("totalGamesTrend")}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card text-foreground dark:bg-neutral-900 dark:text-white dark:border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("activePlayers")}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,350</div>
            <p className="text-xs text-muted-foreground">
              {t("activePlayersTrend")}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card text-foreground dark:bg-neutral-900 dark:text-white dark:border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("assetUsage")}
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">
              {t("assetUsageTrend")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Your Games Section */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">{t("yourGames")}</h2>
        <Button
          asChild
          className="bg-white text-black hover:bg-neutral-200 font-bold"
        >
          <Link href="/games/create">
            <Plus className="mr-2 h-4 w-4" /> {t("newGame")}
          </Link>
        </Button>
      </div>

      {/* Games Grid */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card
              key={i}
              className="border-border bg-card animate-pulse dark:bg-neutral-900 dark:border-white/10"
            >
              <CardHeader>
                <div className="h-5 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
              </CardHeader>
              <CardContent>
                <div className="aspect-video w-full rounded-md bg-muted"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : games.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-8 text-center dark:border-white/10">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Gamepad2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">{t("noGamesYet")}</h3>
          <p className="mb-4 text-sm text-muted-foreground max-w-sm">
            {t("noGamesDescription")}
          </p>
          <Button asChild>
            <Link href="/games/create">{t("createFirstGame")}</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {games.map((game) => (
              <Link key={game.id} href={`/games/${game.id}`}>
                <Card className="h-full border-border bg-card text-foreground hover:border-primary/40 transition-colors cursor-pointer group dark:bg-neutral-900 dark:text-white dark:border-white/10 dark:hover:border-white/30">
                  <div className="aspect-video w-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center relative overflow-hidden">
                    {game.coverUrl ? (
                      <img
                        src={game.coverUrl}
                        alt={game.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Gamepad2 className="h-12 w-12 text-white/20 group-hover:text-white/30 transition-colors" />
                    )}
                  </div>
                  <CardHeader className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs">
                        {game.typeName || "Game"}
                      </Badge>
                      <Badge
                        className={
                          game.status === "published"
                            ? "bg-green-500/10 text-green-500"
                            : "bg-yellow-500/10 text-yellow-500"
                        }
                      >
                        {game.status}
                      </Badge>
                    </div>
                    <CardTitle className="line-clamp-1">{game.title}</CardTitle>
                    <CardDescription className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {game.createdAt?.toDate
                        ? new Date(game.createdAt.toDate()).toLocaleDateString()
                        : "Just now"}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>

          {/* More Games Link */}
          {totalGames > 3 && (
            <div className="flex justify-center pt-4">
              <Link
                href="/games"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground dark:hover:text-white transition-colors"
              >
                {t("viewAllGames")} ({totalGames})
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
