"use client";

import { use, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { db, storage, auth } from "@/lib/firebase";
import { Link, useRouter } from "@/i18n/routing";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
  addDoc,
  increment,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { getBytes, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Button } from "@/components/ui/button";
import { Loader2, X, Camera } from "lucide-react";
import type { User } from "firebase/auth";
import { ShareDialog } from "@/components/share-dialog";

interface SharedUser {
  odbyUserId: string;
  username: string;
  avatarUrl?: string;
}

type GameRecord = {
  id: string;
  title?: string;
  slug?: string;
  visibility?: "public" | "private";
  sharedWith?: SharedUser[];
};

const fallbackCode = `
function setup() {
  createCanvas(windowWidth, windowHeight);
}

function draw() {
  background(15);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(18);
  text("No saved game code found.", width / 2, height / 2);
}
`;

function buildRuntimeHtml(jsCode: string) {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
      canvas { display: block; width: 100% !important; height: 100% !important; }
    </style>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"></script>
  </head>
  <body>
    <script>
      try {
        ${jsCode}
        if (typeof window.resizeCanvas === "function") {
          window.addEventListener("resize", () => {
            try {
              window.resizeCanvas(window.innerWidth, window.innerHeight);
            } catch (err) {
              // Ignore resize errors from sketches without a canvas.
            }
          });
        }

        // Screenshot capture handler
        window.addEventListener("message", (event) => {
          if (event.data && event.data.type === "captureScreenshot") {
            try {
              const canvas = document.querySelector("canvas");
              if (canvas) {
                const dataUrl = canvas.toDataURL("image/png");
                window.parent.postMessage({ type: "screenshotData", dataUrl }, "*");
              } else {
                window.parent.postMessage({ type: "screenshotError", error: "No canvas found" }, "*");
              }
            } catch (err) {
              window.parent.postMessage({ type: "screenshotError", error: err.message }, "*");
            }
          }
        });
      } catch (e) {
        document.body.innerHTML = '<div style="color:#fff;font-family:monospace;padding:24px;">' +
          'Game runtime error: ' + e.message + '</div>';
      }
    </script>
  </body>
</html>`;
}

export default function PlayPage({
  params,
}: {
  params: Promise<{ gameSlug: string }>;
}) {
  const { gameSlug } = use(params);
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [game, setGame] = useState<GameRecord | null>(null);
  const [code, setCode] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const hasRecordedPlay = useRef(false);

  // Auth listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Screenshot message handler
  const handleScreenshot = useCallback(async () => {
    if (!iframeRef.current?.contentWindow || !game || !user) {
      return;
    }

    setCapturing(true);

    // Send message to iframe to capture screenshot
    iframeRef.current.contentWindow.postMessage({ type: "captureScreenshot" }, "*");
  }, [game, user]);

  // Listen for screenshot data from iframe
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === "screenshotData" && capturing && user && game) {
        try {
          const dataUrl = event.data.dataUrl;

          // Convert data URL to blob
          const response = await fetch(dataUrl);
          const blob = await response.blob();

          // Generate filename: gameName_isoDate.png
          const gameName = (game.title || "game").replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
          const isoDate = new Date().toISOString().replace(/[:.]/g, "-");
          const fileName = `${gameName}_${isoDate}.png`;

          // Upload to Firebase Storage
          const storagePath = `screenshots/${user.uid}/${fileName}`;
          const storageRef = ref(storage, storagePath);
          await uploadBytes(storageRef, blob);
          const downloadURL = await getDownloadURL(storageRef);

          // Save to Firestore
          await addDoc(collection(db, "screenshots"), {
            ownerId: user.uid,
            gameId: game.id,
            gameTitle: game.title || "Untitled",
            url: downloadURL,
            storagePath: storagePath,
            fileName: fileName,
            createdAt: serverTimestamp(),
          });

          setCapturing(false);
        } catch (error) {
          console.error("Failed to save screenshot:", error);
          setCapturing(false);
        }
      } else if (event.data?.type === "screenshotError" && capturing) {
        console.error("Screenshot error:", event.data.error);
        setCapturing(false);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [capturing, user, game]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setLoadError(null);
    hasRecordedPlay.current = false;

    async function fetchGame() {
      try {
        const docRef = doc(db, "games", gameSlug);
        const docSnap = await getDoc(docRef);

        let resolvedGame: GameRecord | null = null;

        if (docSnap.exists()) {
          resolvedGame = { ...(docSnap.data() as Omit<GameRecord, "id">), id: docSnap.id };
        } else {
          const slugQuery = query(
            collection(db, "games"),
            where("slug", "==", gameSlug),
            limit(1)
          );
          const slugSnap = await getDocs(slugQuery);
          if (!slugSnap.empty) {
            const slugDoc = slugSnap.docs[0];
            resolvedGame = { ...(slugDoc.data() as Omit<GameRecord, "id">), id: slugDoc.id };
          }
        }

        if (!resolvedGame) {
          throw new Error("Game not found");
        }

        let shouldRecordPlay = true;
        const playSessionKey = `egot:play:${resolvedGame.id}`;

        try {
          if (sessionStorage.getItem(playSessionKey)) {
            shouldRecordPlay = false;
          } else {
            sessionStorage.setItem(playSessionKey, "1");
          }
        } catch {
          // Session storage might be unavailable; fall back to recording the play.
        }

        if (!hasRecordedPlay.current && shouldRecordPlay) {
          hasRecordedPlay.current = true;
          updateDoc(doc(db, "games", resolvedGame.id), {
            "stats.plays": increment(1),
          }).catch((error) => {
            console.error("Failed to record play:", error);
            hasRecordedPlay.current = false;
            try {
              sessionStorage.removeItem(playSessionKey);
            } catch {
              // Ignore session storage cleanup errors.
            }
          });
        }

        const codeRef = ref(storage, `games/${resolvedGame.id}/sketch.js`);
        let jsCode = "";
        try {
          const bytes = await getBytes(codeRef, 1024 * 1024 * 2);
          jsCode = new TextDecoder().decode(bytes);
        } catch {
          jsCode = fallbackCode;
        }

        if (!isMounted) return;
        setGame(resolvedGame);
        setCode(jsCode);
        setLoading(false);
      } catch (error) {
        console.error("Failed to load game:", error);
        if (!isMounted) return;
        setLoadError("Unable to load this game.");
        setCode(fallbackCode);
        setLoading(false);
      }
    }

    if (gameSlug) {
      fetchGame();
    } else {
      setLoadError("Invalid game id.");
      setLoading(false);
    }
    return () => {
      isMounted = false;
    };
  }, [gameSlug]);

  const runtimeHtml = useMemo(() => buildRuntimeHtml(code || fallbackCode), [code]);

  return (
    <div className="h-screen flex flex-col bg-black text-white">
      <header className="h-14 flex items-center justify-between px-6 border-b border-white/10">
        <div className="text-sm font-semibold truncate">
          {game?.title || "Loading..."}
        </div>
        <div className="flex items-center gap-2">
          {game && (
            <ShareDialog
              gameId={game.id}
              gameTitle={game.title || "Untitled"}
              visibility={game.visibility || "private"}
              sharedWith={game.sharedWith}
              onVisibilityChange={(newVisibility) => {
                setGame({ ...game, visibility: newVisibility });
              }}
              trigger={
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 text-sm text-neutral-300 hover:text-white"
                >
                  Share
                </Button>
              }
            />
          )}
          <Button
            variant="ghost"
            onClick={handleScreenshot}
            disabled={capturing || !user || loading}
            className="flex items-center gap-2 text-sm text-neutral-300 hover:text-white"
          >
            {capturing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
            {capturing ? "Saving..." : "Screenshot"}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              if (typeof window !== "undefined" && window.history.length > 1) {
                router.back();
              } else {
                router.push("/games");
              }
            }}
            className="flex items-center gap-2 text-sm text-neutral-300 hover:text-white"
          >
            <X className="h-4 w-4" />
            Close
          </Button>
        </div>
      </header>

      <main className="flex-1 bg-black">
        {loading ? (
          <div className="flex h-full items-center justify-center text-neutral-400">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading game...
          </div>
        ) : loadError ? (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <p className="text-neutral-400">{loadError}</p>
            <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <Link href="/games">Back to games</Link>
            </Button>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            title="Game Player"
            className="h-full w-full border-none"
            sandbox="allow-scripts allow-same-origin"
            allow="accelerometer; camera; microphone; gyroscope; magnetometer; fullscreen; autoplay; clipboard-write"
            srcDoc={runtimeHtml}
          />
        )}
      </main>
    </div>
  );
}
