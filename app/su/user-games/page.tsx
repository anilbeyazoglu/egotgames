"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { Timestamp, collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";

type AdminGame = {
  id: string;
  title: string;
  owner: string;
  status: string;
  players: string | number;
  updated: string;
};

const fallbackGames: AdminGame[] = [
  {
    id: "fallback-1",
    title: "Neon Skies",
    owner: "Ava Stone",
    status: "Live",
    players: "8.2K",
    updated: "2h ago",
  },
  {
    id: "fallback-2",
    title: "Forge & Flame",
    owner: "Liam West",
    status: "QA",
    players: "1.4K",
    updated: "1d ago",
  },
  {
    id: "fallback-3",
    title: "Orbit Runner",
    owner: "Jules Carter",
    status: "Live",
    players: "3.6K",
    updated: "4h ago",
  },
  {
    id: "fallback-4",
    title: "Echoes of Dawn",
    owner: "Mina Park",
    status: "Suspended",
    players: "—",
    updated: "30m ago",
  },
  {
    id: "fallback-5",
    title: "Pixel Drift",
    owner: "Leo Martins",
    status: "Draft",
    players: "0",
    updated: "12m ago",
  },
  {
    id: "fallback-6",
    title: "Rift Arena",
    owner: "Noah Patel",
    status: "Live",
    players: "12.4K",
    updated: "18m ago",
  },
];

const statusTone: Record<string, string> = {
  Live: "bg-emerald-500/20 text-emerald-200 border-emerald-500/30",
  QA: "bg-amber-500/20 text-amber-200 border-amber-500/30",
  Draft: "bg-neutral-500/20 text-neutral-200 border-neutral-500/30",
  Suspended: "bg-red-500/20 text-red-200 border-red-500/30",
};

function formatUpdated(value: any) {
  if (!value) return "—";
  const date =
    value instanceof Timestamp ? value.toDate() : new Date(value.seconds ? value.seconds * 1000 : value);
  try {
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return "—";
  }
}

export default function AdminUserGamesPage() {
  const [games, setGames] = useState<AdminGame[]>(fallbackGames);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const gamesQuery = query(
      collection(db, "games"),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      gamesQuery,
      (snapshot) => {
        const next = snapshot.docs.map((doc) => {
          const data = doc.data() as any;
          return {
            id: doc.id,
            title: data.title || "Untitled game",
            owner: data.ownerName || data.ownerId || "Unknown",
            status: data.status || "Draft",
            players:
              data.stats?.plays ??
              data.activePlayers ??
              data.players ??
              data.playerCount ??
              0,
            updated: formatUpdated(data.updatedAt || data.createdAt),
          };
        });

        setGames(next.length ? next : fallbackGames);
        setLoading(false);
      },
      (error) => {
        console.error("[AdminUserGames] Failed to load games", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const tableRows = useMemo(() => games, [games]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm text-neutral-400">Catalog</p>
        <h1 className="text-3xl font-bold tracking-tight">User games</h1>
      </div>

      <Card className="border-white/10 bg-neutral-900 text-white">
        <CardHeader>
          <CardTitle>Game inventory</CardTitle>
          <CardDescription className="text-neutral-400">
            Moderation status, ownership, and live player counts.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5">
                <TableHead>Title</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Players</TableHead>
                <TableHead className="text-right">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow className="border-white/5">
                  <TableCell colSpan={5} className="text-center py-6">
                    <div className="flex items-center justify-center gap-3 text-neutral-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading games…
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                tableRows.map((game) => (
                  <TableRow key={game.id} className="border-white/5">
                    <TableCell className="font-medium">{game.title}</TableCell>
                    <TableCell className="text-neutral-300">
                      {game.owner}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusTone[game.status] || "border-white/10"}
                      >
                        {game.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-neutral-300">
                      {game.players}
                    </TableCell>
                    <TableCell className="text-right text-neutral-400">
                      {game.updated}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
