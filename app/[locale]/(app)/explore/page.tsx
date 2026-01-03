"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Gamepad2,
  Heart,
  Loader2,
  Play,
  Search,
  Sparkles,
  TrendingUp,
} from "lucide-react";

type ExploreGame = {
  id: string;
  title: string;
  description?: string;
  typeName?: string;
  categoryName?: string;
  slug?: string;
  coverUrl?: string;
  stats?: {
    plays?: number;
    likes?: number;
  };
  createdAt?: any;
};

const exploreLimit = 200;
const sectionLimit = 9;

function toMillis(value: any) {
  if (!value) return 0;
  if (typeof value === "number") return value;
  if (value instanceof Date) return value.getTime();
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.toDate === "function") return value.toDate().getTime();
  return 0;
}

function formatDate(value: any) {
  const millis = toMillis(value);
  if (!millis) return "Just now";
  return new Date(millis).toLocaleDateString();
}

function buildSearchIndex(game: ExploreGame) {
  return [
    game.title,
    game.description,
    game.typeName,
    game.categoryName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function GameCard({ game, playLabel }: { game: ExploreGame; playLabel: string }) {
  const plays = game.stats?.plays ?? 0;
  const likes = game.stats?.likes ?? 0;
  const href = `/play/${game.slug || game.id}`;

  return (
    <Link href={href} className="group">
      <Card className="h-full border-white/10 bg-black/40 hover:bg-white/5 transition-colors overflow-hidden">
        <div className="relative aspect-video w-full bg-gradient-to-br from-sky-500/10 via-indigo-500/10 to-purple-500/10 flex items-center justify-center">
          {game.coverUrl ? (
            <Image
              src={game.coverUrl}
              alt={game.title}
              fill
              sizes="(max-width: 1024px) 100vw, 33vw"
              className="object-cover"
            />
          ) : (
            <Gamepad2 className="h-10 w-10 text-white/20" />
          )}
        </div>
        <CardHeader className="p-3">
          <div className="flex items-center justify-between gap-2">
            <Badge variant="outline" className="border-white/10 text-white/80">
              {game.typeName || "Game"}
            </Badge>
            <span className="text-xs text-white/40">{formatDate(game.createdAt)}</span>
          </div>
          <CardTitle className="line-clamp-1 text-base">{game.title}</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-0">
          <p className="text-xs text-white/60 line-clamp-2">
            {game.description || "No description provided."}
          </p>
        </CardContent>
        <CardFooter className="p-3 pt-2 text-xs text-white/60 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Play className="h-3 w-3" />
              {plays}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              {likes}
            </span>
          </div>
          <span className="text-white/40">{playLabel}</span>
        </CardFooter>
      </Card>
    </Link>
  );
}

function GameSection({
  title,
  icon,
  games,
  emptyMessage,
  playLabel,
}: {
  title: string;
  icon: React.ReactNode;
  games: ExploreGame[];
  emptyMessage: string;
  playLabel: string;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <span className="text-white/70">{icon}</span>
        <h2>{title}</h2>
      </div>
      {games.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/10 bg-white/5 p-6 text-sm text-white/60">
          {emptyMessage}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {games.map((game) => (
            <GameCard key={game.id} game={game} playLabel={playLabel} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function ExplorePage() {
  const t = useTranslations("Explore");
  const [games, setGames] = useState<ExploreGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadGames = async () => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const gamesQuery = query(
          collection(db, "games"),
          where("visibility", "==", "public"),
          where("status", "==", "published"),
          limit(exploreLimit)
        );
        const snapshot = await getDocs(gamesQuery);
        if (!isMounted) return;
        const data = snapshot.docs.map((docSnap) => {
          const payload = docSnap.data() as any;
          return {
            id: docSnap.id,
            title: payload.title || "Untitled game",
            description: payload.description || "",
            typeName: payload.typeName,
            categoryName: payload.categoryName,
            slug: payload.slug,
            coverUrl: payload.coverUrl,
            stats: {
              plays: payload.stats?.plays ?? 0,
              likes: payload.stats?.likes ?? 0,
            },
            createdAt: payload.createdAt,
          } as ExploreGame;
        });
        setGames(data);
      } catch (error) {
        console.error("Explore games load failed:", error);
        if (isMounted) {
          setErrorMessage(t("loadError"));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadGames();
    return () => {
      isMounted = false;
    };
  }, [t]);

  const bestRated = useMemo(() => {
    return [...games]
      .sort((a, b) => (b.stats?.likes ?? 0) - (a.stats?.likes ?? 0))
      .slice(0, sectionLimit);
  }, [games]);

  const mostPlayed = useMemo(() => {
    return [...games]
      .sort((a, b) => (b.stats?.plays ?? 0) - (a.stats?.plays ?? 0))
      .slice(0, sectionLimit);
  }, [games]);

  const newcomers = useMemo(() => {
    return [...games]
      .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))
      .slice(0, sectionLimit);
  }, [games]);

  const searchResults = useMemo(() => {
    const value = searchValue.trim().toLowerCase();
    if (!value) return [];
    return games.filter((game) => buildSearchIndex(game).includes(value));
  }, [games, searchValue]);

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
            <Sparkles className="h-5 w-5 text-white/70" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
            <p className="text-sm text-white/60">{t("description")}</p>
          </div>
        </div>
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-3 h-4 w-4 text-white/40" />
          <Input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-white/60">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("loading")}
        </div>
      ) : errorMessage ? (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          {errorMessage}
        </div>
      ) : games.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/10 bg-white/5 p-6 text-sm text-white/60">
          {t("empty")}
        </div>
      ) : (
        <div className="space-y-10">
          {searchValue.trim() ? (
            <GameSection
              title={t("searchResults")}
              icon={<Search className="h-5 w-5" />}
              games={searchResults}
              emptyMessage={t("emptySearch")}
              playLabel={t("play")}
            />
          ) : null}
          <GameSection
            title={t("bestRated")}
            icon={<Heart className="h-5 w-5" />}
            games={bestRated}
            emptyMessage={t("emptySection")}
            playLabel={t("play")}
          />
          <GameSection
            title={t("mostPlayed")}
            icon={<TrendingUp className="h-5 w-5" />}
            games={mostPlayed}
            emptyMessage={t("emptySection")}
            playLabel={t("play")}
          />
          <GameSection
            title={t("newcomers")}
            icon={<Sparkles className="h-5 w-5" />}
            games={newcomers}
            emptyMessage={t("emptySection")}
            playLabel={t("play")}
          />
        </div>
      )}
    </div>
  );
}
