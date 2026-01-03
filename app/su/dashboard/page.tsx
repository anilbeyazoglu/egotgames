"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import { Badge } from "@/components/ui/badge";
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
import {
  Activity,
  ArrowUpRight,
  Coins,
  Gamepad2,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  Timestamp,
  collection,
  getCountFromServer,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";

type Signal = {
  id: string;
  title: string;
  owner: string;
  impact: string;
  createdAt?: Timestamp | Date | null;
};

const systemSignals = [
  { label: "Realtime database", status: "Operational", detail: "142ms p95" },
  { label: "Auth provider", status: "Stable", detail: "No pending alerts" },
  { label: "Asset CDN", status: "Throttle", detail: "Usage at 76%" },
  { label: "Publish queue", status: "Queued", detail: "3 builds waiting" },
];

const fallbackSignals: Signal[] = [
  {
    id: "fallback-1",
    title: "Creator payout executed",
    owner: "Liam West",
    impact: "$4,200 • Stripe",
    createdAt: null,
  },
  {
    id: "fallback-2",
    title: "New studio onboarded",
    owner: "Ava Stone",
    impact: "5 seats activated",
    createdAt: null,
  },
  {
    id: "fallback-3",
    title: "Game flagged for review",
    owner: "MOD-201",
    impact: "2 reports in 10m",
    createdAt: null,
  },
  {
    id: "fallback-4",
    title: "Asset pack published",
    owner: "Jules Carter",
    impact: "Art • Cyber Neon",
    createdAt: null,
  },
  {
    id: "fallback-5",
    title: "Auth baseline updated",
    owner: "System",
    impact: "Rules version 1.8.2",
    createdAt: null,
  },
];

const numberFormatter = new Intl.NumberFormat("en-US");
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function formatRelativeTime(value?: Timestamp | Date | null) {
  if (!value) return "—";
  const date = value instanceof Timestamp ? value.toDate() : value;
  try {
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return "—";
  }
}

export default function AdminDashboardPage() {
  const [creatorCount, setCreatorCount] = useState<number | null>(null);
  const [gameCount, setGameCount] = useState<number | null>(null);
  const [volume, setVolume] = useState<number | null>(null);
  const [signals, setSignals] = useState<Signal[]>(fallbackSignals);
  const [loadingSignals, setLoadingSignals] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadMetrics() {
      try {
        const [usersSnap, gamesSnap] = await Promise.all([
          getCountFromServer(collection(db, "users")),
          getCountFromServer(collection(db, "games")),
        ]);

        const txSnapshot = await getDocs(
          query(
            collection(db, "transactions"),
            orderBy("createdAt", "desc"),
            limit(25)
          )
        );

        let calculatedVolume = 0;
        txSnapshot.forEach((doc) => {
          const amount = (doc.data() as any).amount;
          if (typeof amount === "number") {
            calculatedVolume += amount;
          }
        });

        if (!isMounted) return;
        setCreatorCount(usersSnap.data().count ?? 0);
        setGameCount(gamesSnap.data().count ?? 0);
        setVolume(calculatedVolume);
      } catch (error) {
        console.error("[AdminDashboard] Failed to load metrics", error);
        if (!isMounted) return;
        setCreatorCount(0);
        setGameCount(0);
        setVolume(0);
      }
    }

    loadMetrics();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    let txSignals: Signal[] = [];
    let gameSignals: Signal[] = [];

    const updateSignals = () => {
      if (!isMounted) return;
      const merged = [...txSignals, ...gameSignals]
        .sort((a, b) => {
          const aTime =
            a.createdAt instanceof Timestamp
              ? a.createdAt.seconds
              : a.createdAt instanceof Date
              ? a.createdAt.getTime() / 1000
              : 0;
          const bTime =
            b.createdAt instanceof Timestamp
              ? b.createdAt.seconds
              : b.createdAt instanceof Date
              ? b.createdAt.getTime() / 1000
              : 0;
          return bTime - aTime;
        })
        .slice(0, 5);

      setSignals(merged.length ? merged : fallbackSignals);
      setLoadingSignals(false);
    };

    const transactionsUnsub = onSnapshot(
      query(
        collection(db, "transactions"),
        orderBy("createdAt", "desc"),
        limit(5)
      ),
      (snapshot) => {
        txSignals = snapshot.docs.map((doc) => {
          const data = doc.data() as any;
          return {
            id: doc.id,
            title: data.type || "Transaction",
            owner: data.userName || data.userId || "Unknown",
            impact:
              typeof data.amount === "number"
                ? currencyFormatter.format(data.amount)
                : "—",
            createdAt: data.createdAt ?? null,
          };
        });
        updateSignals();
      },
      (error) => {
        console.error("[AdminDashboard] Transactions signal error", error);
        updateSignals();
      }
    );

    const gamesUnsub = onSnapshot(
      query(collection(db, "games"), orderBy("createdAt", "desc"), limit(5)),
      (snapshot) => {
        gameSignals = snapshot.docs.map((doc) => {
          const data = doc.data() as any;
          return {
            id: doc.id,
            title: data.title || "Game update",
            owner: data.ownerName || data.ownerId || "Unknown",
            impact: data.status || "Draft",
            createdAt: data.createdAt ?? null,
          };
        });
        updateSignals();
      },
      (error) => {
        console.error("[AdminDashboard] Games signal error", error);
        updateSignals();
      }
    );

    return () => {
      isMounted = false;
      transactionsUnsub();
      gamesUnsub();
    };
  }, []);

  const stats = useMemo(
    () => [
      {
        label: "Active creators",
        value:
          creatorCount === null
            ? "—"
            : numberFormatter.format(Math.max(creatorCount, 0)),
        trend: "Live count",
        icon: Users,
      },
      {
        label: "Games shipped",
        value:
          gameCount === null ? "—" : numberFormatter.format(Math.max(gameCount, 0)),
        trend: "In Firestore",
        icon: Gamepad2,
      },
      {
        label: "Transaction volume",
        value: volume === null ? "—" : currencyFormatter.format(Math.max(volume, 0)),
        trend: "Recent 25 records",
        icon: Coins,
      },
      {
        label: "Security posture",
        value: "SLA 99.2%",
        trend: "0 unresolved incidents",
        icon: ShieldCheck,
      },
    ],
    [creatorCount, gameCount, volume]
  );

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm text-neutral-400">Superuser overview</p>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        </div>
        <Badge className="gap-2 bg-white text-black hover:bg-neutral-200">
          <Activity className="h-4 w-4" />
          Live metrics
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className="border-white/10 bg-neutral-900 text-white"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-neutral-400">
                {stat.label}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-neutral-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-neutral-500">{stat.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-white/10 bg-neutral-900 text-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent signals</CardTitle>
              <CardDescription className="text-neutral-400">
                System and moderation activity landing in the last 6 hours.
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              Auto-refresh
              <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
            </Badge>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5">
                  <TableHead>Event</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Impact</TableHead>
                  <TableHead className="text-right">
                    {loadingSignals ? "Loading" : "Time"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {signals.map((item) => (
                  <TableRow key={item.id} className="border-white/5">
                    <TableCell className="font-medium">
                      {item.title}
                    </TableCell>
                    <TableCell className="text-neutral-300">
                      {item.owner}
                    </TableCell>
                    <TableCell className="text-neutral-400">
                      {item.impact}
                    </TableCell>
                    <TableCell className="text-right text-neutral-400">
                      {formatRelativeTime(item.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-neutral-900 text-white">
          <CardHeader>
            <CardTitle>System health</CardTitle>
            <CardDescription className="text-neutral-400">
              Quick status across infra slices.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {systemSignals.map((signal) => (
              <div
                key={signal.label}
                className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-3"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white">
                    {signal.label}
                  </p>
                  <p className="text-xs text-neutral-400">{signal.detail}</p>
                </div>
                <Badge
                  variant="secondary"
                  className="border-white/10 bg-white/10 text-white"
                >
                  {signal.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
