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
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Search } from "lucide-react";
import { Timestamp, collection, limit, onSnapshot, query } from "firebase/firestore";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  games: number;
  status: "active" | "suspended" | "invited";
  joined: string;
};

const fallbackUsers: AdminUser[] = [
  {
    id: "fallback-1",
    name: "Ava Stone",
    email: "ava@egot.games",
    role: "Administrator",
    games: 24,
    status: "active",
    joined: "Jan 04, 2025",
  },
  {
    id: "fallback-2",
    name: "Liam West",
    email: "liam@eastforge.io",
    role: "Creator",
    games: 12,
    status: "active",
    joined: "Dec 18, 2024",
  },
  {
    id: "fallback-3",
    name: "Noah Patel",
    email: "noah@triplestudio.gg",
    role: "Creator",
    games: 7,
    status: "invited",
    joined: "Pending",
  },
  {
    id: "fallback-4",
    name: "Jules Carter",
    email: "jules@orbit.art",
    role: "Contributor",
    games: 9,
    status: "active",
    joined: "Nov 29, 2024",
  },
  {
    id: "fallback-5",
    name: "Mina Park",
    email: "mina@egot.games",
    role: "Support",
    games: 0,
    status: "suspended",
    joined: "Oct 07, 2024",
  },
  {
    id: "fallback-6",
    name: "Leo Martins",
    email: "leo@deepnorth.studio",
    role: "Creator",
    games: 15,
    status: "active",
    joined: "Jan 11, 2025",
  },
];

function formatDate(value: any) {
  if (!value) return "—";
  try {
    const date =
      value instanceof Timestamp ? value.toDate() : new Date(value.seconds ? value.seconds * 1000 : value);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export default function AdminUsersPage() {
  const [queryValue, setQueryValue] = useState("");
  const [users, setUsers] = useState<AdminUser[]>(fallbackUsers);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usersQuery = query(collection(db, "users"), limit(50));
    const unsubscribe = onSnapshot(
      usersQuery,
      (snapshot) => {
        const next = snapshot.docs.map((doc) => {
          const data = doc.data() as any;
          const rawStatus = typeof data.status === "string" ? data.status : "";
          const resolvedStatus: AdminUser["status"] =
            rawStatus === "invited" || rawStatus === "suspended"
              ? rawStatus
              : data.disabled
                ? "suspended"
                : "active";
          return {
            id: doc.id,
            name: data.displayName || data.name || data.username || "Unknown",
            email: data.email || "—",
            role: data.role || "Member",
            games: data.gamesCount || data.gameCount || 0,
            status: resolvedStatus,
            joined: formatDate(data.createdAt),
          };
        });

        setUsers(next.length ? next : fallbackUsers);
        setLoading(false);
      },
      (error) => {
        console.error("[AdminUsers] Failed to load users", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredUsers = useMemo(() => {
    const value = queryValue.toLowerCase().trim();
    if (!value) return users;

    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(value) ||
        user.email.toLowerCase().includes(value)
    );
  }, [queryValue, users]);

  const statusTone: Record<AdminUser["status"], string> = {
    active: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    invited: "bg-amber-500/20 text-amber-200 border-amber-500/30",
    suspended: "bg-red-500/20 text-red-200 border-red-500/30",
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm text-neutral-400">Directory</p>
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
      </div>

      <Card className="border-white/10 bg-neutral-900 text-white">
        <CardHeader className="gap-4 space-y-0 md:flex md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>User roster</CardTitle>
            <CardDescription className="text-neutral-400">
              Search and review creator accounts across the platform.
            </CardDescription>
          </div>
          <div className="relative w-full md:w-72">
            <Input
              value={queryValue}
              onChange={(event) => setQueryValue(event.target.value)}
              placeholder="Search by name or email"
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-neutral-500"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5">
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Games</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow className="border-white/5">
                  <TableCell colSpan={6} className="text-center py-6">
                    <div className="flex items-center justify-center gap-3 text-neutral-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading users…
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="border-white/5">
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-neutral-400">
                      {user.email}
                    </TableCell>
                    <TableCell className="text-neutral-300">
                      {user.role}
                    </TableCell>
                    <TableCell className="text-right text-neutral-300">
                      {user.games}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusTone[user.status]}
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-neutral-400">
                      {user.joined}
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
