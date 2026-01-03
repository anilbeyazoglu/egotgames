"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocsFromCache,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { User } from "firebase/auth";
import { Camera, Calendar, Gamepad2, Trash2, Download } from "lucide-react";

interface Screenshot {
  id: string;
  ownerId: string;
  gameId: string;
  gameTitle: string;
  url: string;
  storagePath: string;
  fileName: string;
  createdAt: Timestamp | null;
}

export default function ScreenshotsPage() {
  const t = useTranslations("Dashboard");

  const [user, setUser] = useState<User | null>(null);
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTimeout, setIsTimeout] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
        setScreenshots([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Data Listener
  useEffect(() => {
    let unsubscribeSnapshot: () => void;

    if (user) {
      setIsTimeout(false);

      const q = query(
        collection(db, "screenshots"),
        where("ownerId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      // Load from cache first
      getDocsFromCache(q)
        .then((cacheSnapshot) => {
          const data: Screenshot[] = [];
          cacheSnapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() } as Screenshot);
          });
          setScreenshots(data);
          setLoading(false);
        })
        .catch((err) => {
          console.log("[Perf] No cache available:", err.message);
        });

      // Set up realtime listener
      unsubscribeSnapshot = onSnapshot(
        q,
        (querySnapshot) => {
          const data: Screenshot[] = [];
          querySnapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() } as Screenshot);
          });
          setScreenshots(data);
          setLoading(false);
        },
        (error) => {
          console.error("Screenshots listener error:", error);
          setLoading(false);
        }
      );
    } else if (user === null) {
      setLoading(false);
      setScreenshots([]);
    }

    return () => {
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, [user]);

  // Safety timeout
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (loading) {
      timeoutId = setTimeout(() => {
        setIsTimeout(true);
      }, 8000);
    }
    return () => clearTimeout(timeoutId);
  }, [loading]);

  const handleDelete = async (screenshot: Screenshot) => {
    if (!user) return;

    setDeleting(screenshot.id);
    try {
      // Delete from storage
      const storageRef = ref(storage, screenshot.storagePath);
      await deleteObject(storageRef);

      // Delete from Firestore
      await deleteDoc(doc(db, "screenshots", screenshot.id));
    } catch (error) {
      console.error("Failed to delete screenshot:", error);
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = async (screenshot: Screenshot) => {
    try {
      const response = await fetch(screenshot.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = screenshot.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to download screenshot:", error);
    }
  };

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
          <h2 className="text-3xl font-bold tracking-tight">
            {t("screenshots.title")}
          </h2>
          <p className="text-muted-foreground">{t("screenshots.description")}</p>
        </div>
      </div>

      {screenshots.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
            <Camera className="h-6 w-6 text-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">
            {t("screenshots.empty.title")}
          </h3>
          <p className="mb-4 text-sm text-muted-foreground max-w-sm">
            {t("screenshots.empty.description")}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {screenshots.map((screenshot) => (
            <Card
              key={screenshot.id}
              className="h-full hover:bg-white/5 transition-colors border-white/10 overflow-hidden group"
            >
              <div className="aspect-video w-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center relative">
                {screenshot.url ? (
                  <img
                    src={screenshot.url}
                    alt={`Screenshot from ${screenshot.gameTitle}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera className="h-16 w-16 text-white/20" />
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={() => handleDownload(screenshot)}
                    className="h-8 w-8"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => handleDelete(screenshot)}
                    disabled={deleting === screenshot.id}
                    className="h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <CardHeader className="p-4 pb-2">
                <CardTitle className="line-clamp-1 text-sm flex items-center gap-2">
                  <Gamepad2 className="h-4 w-4 text-muted-foreground" />
                  {screenshot.gameTitle}
                </CardTitle>
              </CardHeader>

              <CardFooter className="p-4 pt-0 text-xs text-muted-foreground flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {screenshot.createdAt?.toDate
                      ? new Date(screenshot.createdAt.toDate()).toLocaleDateString()
                      : "Just now"}
                  </span>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
