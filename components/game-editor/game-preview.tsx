"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useEditor } from "./editor-context";
import { Button } from "@/components/ui/button";
import { Play, Pause, Square, RotateCcw, Maximize2, Camera, Loader2 } from "lucide-react";
import { storage, db } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

export function GamePreview() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { code, gameState, playGame, pauseGame, stopGame, addConsoleOutput, clearConsole, gameId } =
    useEditor();
  const [savingCover, setSavingCover] = useState(false);

  const generatePreviewHTML = useCallback(
    (jsCode: string) => {
      return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      display: flex; 
      justify-content: center; 
      align-items: center; 
      min-height: 100vh; 
      background: #1a1a1a; 
      overflow: hidden;
    }
    canvas { 
      display: block;
      box-shadow: 0 0 20px rgba(0,0,0,0.5);
    }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"></script>
</head>
<body>
  <script>
    // Override console.log to send to parent
    const originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn
    };
    
    console.log = function(...args) {
      originalConsole.log.apply(console, args);
      window.parent.postMessage({ type: 'console', level: 'log', message: args.map(a => String(a)).join(' ') }, '*');
    };
    
    console.error = function(...args) {
      originalConsole.error.apply(console, args);
      window.parent.postMessage({ type: 'console', level: 'error', message: args.map(a => String(a)).join(' ') }, '*');
    };
    
    console.warn = function(...args) {
      originalConsole.warn.apply(console, args);
      window.parent.postMessage({ type: 'console', level: 'warn', message: args.map(a => String(a)).join(' ') }, '*');
    };

    // Handle errors
    window.onerror = function(message, source, lineno, colno, error) {
      window.parent.postMessage({ 
        type: 'console', 
        level: 'error', 
        message: 'Error: ' + message + ' (line ' + lineno + ')' 
      }, '*');
      return true;
    };

    try {
      ${jsCode || `
        function setup() {
          createCanvas(400, 400);
        }

        function draw() {
          background(30);
          fill(150, 100, 255);
          noStroke();
          ellipse(mouseX, mouseY, 50, 50);

          fill(255, 255, 255, 100);
          textAlign(CENTER, CENTER);
          textSize(14);
          text('Move your mouse!', width/2, height - 30);
        }
      `}

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
    } catch(e) {
      console.error('Script error:', e.message);
    }
  </script>
</body>
</html>
`;
    },
    []
  );

  // Listen for console messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "console") {
        const prefix =
          event.data.level === "error"
            ? "❌ "
            : event.data.level === "warn"
            ? "⚠️ "
            : "";
        addConsoleOutput(`${prefix}${event.data.message}`);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [addConsoleOutput]);

  // Update iframe when playing
  useEffect(() => {
    if (gameState.isPlaying && iframeRef.current) {
      const html = generatePreviewHTML(code);
      iframeRef.current.srcdoc = html;
    }
  }, [gameState.isPlaying, code, generatePreviewHTML]);

  const handlePlay = () => {
    clearConsole();
    playGame();
  };

  const handleStop = () => {
    stopGame();
    if (iframeRef.current) {
      iframeRef.current.srcdoc = "";
    }
  };

  const handleRestart = () => {
    handleStop();
    setTimeout(handlePlay, 100);
  };

  const handleFullscreen = () => {
    if (iframeRef.current) {
      if (iframeRef.current.requestFullscreen) {
        iframeRef.current.requestFullscreen();
      } else if ((iframeRef.current as HTMLIFrameElement & { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen) {
        (iframeRef.current as HTMLIFrameElement & { webkitRequestFullscreen: () => void }).webkitRequestFullscreen();
      }
    }
  };

  // Handle save as cover image
  const handleSaveCover = useCallback(() => {
    if (!iframeRef.current?.contentWindow || !gameId) {
      return;
    }
    setSavingCover(true);
    iframeRef.current.contentWindow.postMessage({ type: "captureScreenshot" }, "*");
  }, [gameId]);

  // Listen for screenshot data from iframe for cover image
  useEffect(() => {
    const handleScreenshotMessage = async (event: MessageEvent) => {
      if (event.data?.type === "screenshotData" && savingCover && gameId) {
        try {
          const dataUrl = event.data.dataUrl;

          // Convert data URL to blob
          const response = await fetch(dataUrl);
          const blob = await response.blob();

          // Upload to Firebase Storage as cover image
          const coverRef = ref(storage, `games/${gameId}/cover.png`);
          await uploadBytes(coverRef, blob);
          const coverUrl = await getDownloadURL(coverRef);

          // Update game document with cover URL
          const gameDocRef = doc(db, "games", gameId);
          await updateDoc(gameDocRef, {
            coverUrl: coverUrl,
            updatedAt: serverTimestamp(),
          });

          addConsoleOutput("Cover image saved successfully!");
          setSavingCover(false);
        } catch (error) {
          console.error("Failed to save cover image:", error);
          addConsoleOutput("❌ Failed to save cover image");
          setSavingCover(false);
        }
      } else if (event.data?.type === "screenshotError" && savingCover) {
        console.error("Screenshot error:", event.data.error);
        addConsoleOutput("❌ Failed to capture screenshot: " + event.data.error);
        setSavingCover(false);
      }
    };

    window.addEventListener("message", handleScreenshotMessage);
    return () => window.removeEventListener("message", handleScreenshotMessage);
  }, [savingCover, gameId, addConsoleOutput]);

  return (
    <div className="h-full flex flex-col bg-neutral-900">
      {/* Preview Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-neutral-950">
        <div className="flex items-center gap-1">
          {!gameState.isPlaying ? (
            <Button
              size="sm"
              onClick={handlePlay}
              className="bg-green-600 hover:bg-green-700 text-white h-7 px-3"
            >
              <Play className="size-3 mr-1" />
              Run
            </Button>
          ) : (
            <>
              {gameState.isPaused ? (
                <Button
                  size="sm"
                  onClick={playGame}
                  className="bg-green-600 hover:bg-green-700 text-white h-7 px-3"
                >
                  <Play className="size-3 mr-1" />
                  Resume
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={pauseGame}
                  className="h-7 px-3"
                >
                  <Pause className="size-3 mr-1" />
                  Pause
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={handleStop}
                className="h-7 px-3"
              >
                <Square className="size-3 mr-1" />
                Stop
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRestart}
                className="h-7 px-3"
              >
                <RotateCcw className="size-3" />
              </Button>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          {gameState.isPlaying && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 gap-1"
              onClick={handleSaveCover}
              disabled={savingCover}
              title="Save as Cover Image"
            >
              {savingCover ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Camera className="size-3" />
              )}
              <span className="text-xs">Cover</span>
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2"
            onClick={handleFullscreen}
            disabled={!gameState.isPlaying}
            title="Fullscreen"
          >
            <Maximize2 className="size-3" />
          </Button>
        </div>
      </div>

      {/* Preview Canvas */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {gameState.isPlaying ? (
          <iframe
            ref={iframeRef}
            className="w-full h-full border-none"
            sandbox="allow-scripts allow-same-origin"
            allow="accelerometer; camera; microphone; gyroscope; magnetometer; fullscreen; autoplay; clipboard-write"
            title="Game Preview"
          />
        ) : (
          <div className="text-center text-neutral-500">
            <div className="text-4xl mb-3">🎮</div>
            <p className="text-sm">Press Run to preview your game</p>
          </div>
        )}
      </div>

      {/* Console Output */}
      <div className="h-32 border-t border-white/10 bg-neutral-950 flex flex-col">
        <div className="flex items-center justify-between px-3 py-1 border-b border-white/10">
          <span className="text-xs font-medium text-neutral-400">Console</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={clearConsole}
            className="h-5 px-2 text-xs"
          >
            Clear
          </Button>
        </div>
        <div className="flex-1 overflow-auto p-2 font-mono text-xs">
          {gameState.consoleOutput.length === 0 ? (
            <span className="text-neutral-600">No output yet...</span>
          ) : (
            gameState.consoleOutput.map((line, i) => (
              <div
                key={i}
                className={
                  line.startsWith("❌")
                    ? "text-red-400"
                    : line.startsWith("⚠️")
                    ? "text-yellow-400"
                    : "text-neutral-300"
                }
              >
                {line}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
