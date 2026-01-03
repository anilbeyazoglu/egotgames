"use client";

import { useEffect, useState } from "react";
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
import { Loader2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { Timestamp, collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";

type AdminTransaction = {
  id: string;
  user: string;
  type: string;
  amount: string;
  status: string;
  created: string;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const fallbackTransactions: AdminTransaction[] = [
  {
    id: "TX-98214",
    user: "Ava Stone",
    type: "Payout",
    amount: "$1,200.00",
    status: "Completed",
    created: "Mar 03, 09:24",
  },
  {
    id: "TX-98201",
    user: "Rift Arena",
    type: "In-app purchase",
    amount: "$86.00",
    status: "Completed",
    created: "Mar 03, 08:10",
  },
  {
    id: "TX-98177",
    user: "Mina Park",
    type: "Payout",
    amount: "$540.00",
    status: "Pending",
    created: "Mar 02, 22:18",
  },
  {
    id: "TX-98155",
    user: "Orbit Runner",
    type: "In-app purchase",
    amount: "$12.00",
    status: "Failed",
    created: "Mar 02, 18:04",
  },
  {
    id: "TX-98123",
    user: "Leo Martins",
    type: "Payout",
    amount: "$320.00",
    status: "Completed",
    created: "Mar 02, 14:35",
  },
  {
    id: "TX-98099",
    user: "Forge & Flame",
    type: "In-app purchase",
    amount: "$64.00",
    status: "Completed",
    created: "Mar 02, 12:12",
  },
];

const statusTone: Record<string, string> = {
  Completed: "bg-emerald-500/20 text-emerald-200 border-emerald-500/30",
  Pending: "bg-amber-500/20 text-amber-200 border-amber-500/30",
  Failed: "bg-red-500/20 text-red-200 border-red-500/30",
};

function formatDate(value: any) {
  if (!value) return "—";
  try {
    const date =
      value instanceof Timestamp ? value.toDate() : new Date(value.seconds ? value.seconds * 1000 : value);
    return date.toLocaleString(undefined, {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] =
    useState<AdminTransaction[]>(fallbackTransactions);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const txQuery = query(
      collection(db, "transactions"),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      txQuery,
      (snapshot) => {
        const next = snapshot.docs.map((doc) => {
          const data = doc.data() as any;
          const amount =
            typeof data.amount === "number"
              ? currencyFormatter.format(data.amount)
              : data.amount || "—";

          return {
            id: doc.id,
            user: data.userName || data.userId || data.gameName || "Unknown",
            type: data.type || "Transaction",
            amount,
            status: data.status || "Completed",
            created: formatDate(data.createdAt),
          };
        });

        setTransactions(next.length ? next : fallbackTransactions);
        setLoading(false);
      },
      (error) => {
        console.error("[AdminTransactions] Failed to load transactions", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm text-neutral-400">Ledger</p>
        <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
      </div>

      <Card className="border-white/10 bg-neutral-900 text-white">
        <CardHeader>
          <CardTitle>Recent payouts & charges</CardTitle>
          <CardDescription className="text-neutral-400">
            Last 48 hours of platform money movement.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5">
                <TableHead>ID</TableHead>
                <TableHead>User / Game</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow className="border-white/5">
                  <TableCell colSpan={6} className="text-center py-6">
                    <div className="flex items-center justify-center gap-3 text-neutral-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading transactions…
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => (
                  <TableRow key={tx.id} className="border-white/5">
                    <TableCell className="font-medium">{tx.id}</TableCell>
                    <TableCell className="text-neutral-300">{tx.user}</TableCell>
                    <TableCell className="text-neutral-300">{tx.type}</TableCell>
                    <TableCell className="text-right text-neutral-300">
                      {tx.amount}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusTone[tx.status] || "border-white/10"}
                      >
                        {tx.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-neutral-400">
                      {tx.created}
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
