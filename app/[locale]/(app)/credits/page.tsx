"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocsFromCache,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, CreditCard, Check } from "lucide-react";

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  currency: string;
}

export default function CreditsPage() {
  // State
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTimeout, setIsTimeout] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Independent: Fetch Packages (Cache-first)
  useEffect(() => {
    console.log("Setting up packages...");
    const q = query(
      collection(db, "credit_packages"),
      where("isActive", "==", true)
    );

    // STEP 1: Load from cache instantly
    getDocsFromCache(q)
      .then((cacheSnapshot) => {
        console.log(`[Perf] Packages cache read: ${cacheSnapshot.size} docs`);
        const pkgs: CreditPackage[] = [];
        cacheSnapshot.forEach((d) => {
          pkgs.push({ id: d.id, ...d.data() } as CreditPackage);
        });
        pkgs.sort((a, b) => a.price - b.price);
        setPackages(pkgs);
        setLoading(false);
      })
      .catch((err) => {
        console.log(
          "[Perf] No cache for packages, waiting for network...",
          err.message
        );
      });

    // STEP 2: Set up realtime listener for updates
    const unsubscribePackages = onSnapshot(
      q,
      (querySnapshot) => {
        console.log("Packages network update:", querySnapshot.size);
        const pkgs: CreditPackage[] = [];
        querySnapshot.forEach((d) => {
          pkgs.push({ id: d.id, ...d.data() } as CreditPackage);
        });
        pkgs.sort((a, b) => a.price - b.price);
        setPackages(pkgs);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error("Packages listener error:", err);
        if (err?.code === "unavailable" || err?.message?.includes("offline")) {
          setError("Connection offline. Using cached prices if available.");
        }
      }
    );

    return () => unsubscribePackages();
  }, []);

  // 2. Auth State
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setBalance(null);
        // If not logged in, we are 'done' loading user data (which is none)
        // But strictly speaking, the page 'loading' state is usually about essential content.
        // Since packages are essential, we might want to wait for them?
        // Current logic: loading=true covers the whole initial fetch.
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // 3. User Balance (Dependent)
  useEffect(() => {
    if (user) {
      console.log("Fetching balance for:", user.uid);
      // For single doc, simple getDoc is fine, but onSnapshot is safer for consistency
      const userUnsub = onSnapshot(
        doc(db, "users", user.uid),
        (docSnap) => {
          if (docSnap.exists()) {
            setBalance(docSnap.data().credits || 0);
          } else {
            setBalance(0);
          }
          setLoading(false); // User data loaded
        },
        (err) => {
          console.error("Balance listener error:", err);
          // Non-critical, just log
          setLoading(false);
        }
      );
      return () => userUnsub();
    } else {
      // If no user, we are not loading user data
      // But check if packages loaded?
      // Let's assume after a short while if no user, loading is false.
      // Better: set loading false immediately if no user in Auth effect.
      setLoading(false);
    }
  }, [user]);

  // Safety Timeout for global loading state
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (loading) {
      timeoutId = setTimeout(() => {
        console.warn("Credits loading timed out (8s)");
        setIsTimeout(true);
      }, 8000);
    }
    return () => clearTimeout(timeoutId);
  }, [loading]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        {isTimeout && (
          <div className="text-center space-y-2 animate-in fade-in">
            <p className="text-muted-foreground">
              Connecting to server is slow...
            </p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Reload
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
        <h3 className="text-xl font-bold text-red-500">Connection Error</h3>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col items-center text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">AI Credits</h1>
        <p className="text-muted-foreground max-w-2xl">
          Power your game generation with AI credits. Create assets, generate
          levels, and more.
        </p>

        {balance !== null && (
          <div className="border border-border bg-muted/40 rounded-full px-6 py-2 flex items-center gap-2 mt-4 dark:bg-white/5 dark:border-white/10">
            <Coins className="h-5 w-5 text-yellow-500" />
            <span className="font-semibold text-xl">{balance}</span>
            <span className="text-sm text-muted-foreground">Available Credits</span>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-8 pt-8">
        {packages.map((pkg) => (
          <Card
            key={pkg.id}
            className="flex flex-col relative overflow-hidden border-border bg-card text-card-foreground hover:border-primary/40 transition-colors dark:bg-black/40 dark:border-white/10 dark:hover:border-white/20"
          >
            {pkg.id === "pro" && (
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                POPULAR
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-2xl">{pkg.name}</CardTitle>
              <CardDescription>
                <span className="text-3xl font-bold text-foreground dark:text-white">
                  ${pkg.price}
                </span>
                <span className="text-muted-foreground"> one-time</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-yellow-500" />
                <span className="font-bold text-lg">{pkg.credits} Credits</span>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Never expires</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Use for all AI features</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full" size="lg">
                <CreditCard className="mr-2 h-4 w-4" /> Purchase
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
