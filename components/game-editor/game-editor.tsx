"use client";

import { useState, useCallback, useEffect } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { EditorProvider, useEditor } from "./editor-context";
import { AIAssistantPanel } from "./ai-assistant-panel";
import { EditorTabs } from "./editor-tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Settings,
  Share2,
  Save,
  Loader2,
  Upload,
  Trash2,
  AlertTriangle,
  ImageIcon,
} from "lucide-react";
import { Link, useRouter } from "@/i18n/routing";
import Image from "next/image";
import { storage, db } from "@/lib/firebase";
import { ref, uploadString, uploadBytes, deleteObject, listAll, getBytes } from "firebase/storage";
import { doc, updateDoc, deleteDoc, serverTimestamp, getDoc } from "firebase/firestore";
import type { BlocklyWorkspace } from "./types";
import type { GameCreationMode } from "@/lib/types";

interface GameEditorContentProps {
  gameId: string;
  gameName?: string;
  gameDescription?: string;
  gameCoverUrl?: string;
  gameCreationMode: GameCreationMode;
}

function GameEditorContent({
  gameId,
  gameName = "Untitled Game",
  gameDescription = "",
  gameCoverUrl = "",
  gameCreationMode,
}: GameEditorContentProps) {
  const router = useRouter();
  const { workspace, code } = useEditor();

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Settings dialog state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsName, setSettingsName] = useState(gameName);
  const [settingsDescription, setSettingsDescription] = useState(gameDescription);
  const [settingsCoverUrl, setSettingsCoverUrl] = useState(gameCoverUrl);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Save game files to Firebase Storage
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const gameFolder = `games/${gameId}`;

      // Save Blockly workspace (blocks XML/JSON) - only in Blockly mode
      if (gameCreationMode === "blockly" && workspace.blocks) {
        const blocksRef = ref(storage, `${gameFolder}/workspace.json`);
        await uploadString(blocksRef, workspace.blocks, "raw", {
          contentType: "application/json",
        });
      }

      // Save generated/written code
      if (code || workspace.generatedCode) {
        const codeRef = ref(storage, `${gameFolder}/sketch.js`);
        await uploadString(codeRef, code || workspace.generatedCode, "raw", {
          contentType: "application/javascript",
        });
      }

      // Update game document timestamp
      const gameDocRef = doc(db, "games", gameId);
      await updateDoc(gameDocRef, {
        updatedAt: serverTimestamp(),
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error("Error saving game:", error);
      alert("Failed to save game. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [gameId, workspace, code, gameCreationMode]);

  // Handle cover image selection
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Update game settings
  const handleUpdateSettings = async () => {
    setIsUpdatingSettings(true);

    try {
      const gameDocRef = doc(db, "games", gameId);
      const updates: Record<string, unknown> = {
        title: settingsName,
        description: settingsDescription,
        updatedAt: serverTimestamp(),
      };

      // Upload cover image if selected
      if (coverFile) {
        const coverRef = ref(storage, `games/${gameId}/cover.${coverFile.name.split(".").pop()}`);
        await uploadBytes(coverRef, coverFile);
        const coverUrl = `https://firebasestorage.googleapis.com/v0/b/${storage.app.options.storageBucket}/o/${encodeURIComponent(coverRef.fullPath)}?alt=media`;
        updates.coverUrl = coverUrl;
        setSettingsCoverUrl(coverUrl);
      }

      await updateDoc(gameDocRef, updates);
      setSettingsOpen(false);
      setCoverFile(null);
      setCoverPreview(null);
    } catch (error) {
      console.error("Error updating settings:", error);
      alert("Failed to update settings. Please try again.");
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  // Delete game and all its files
  const handleDeleteGame = async () => {
    if (deleteConfirmInput !== gameName) return;

    setIsDeleting(true);

    try {
      // Delete all files in game folder from Storage
      const gameFolderRef = ref(storage, `games/${gameId}`);
      try {
        const fileList = await listAll(gameFolderRef);
        await Promise.all(fileList.items.map((item) => deleteObject(item)));
        // Delete subfolders if any
        for (const folder of fileList.prefixes) {
          const subFiles = await listAll(folder);
          await Promise.all(subFiles.items.map((item) => deleteObject(item)));
        }
      } catch {
        // Folder might not exist yet, that's ok
      }

      // Delete game document from Firestore
      const gameDocRef = doc(db, "games", gameId);
      await deleteDoc(gameDocRef);

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Error deleting game:", error);
      alert("Failed to delete game. Please try again.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-black text-white">
      {/* Header */}
      <header className="h-12 flex items-center justify-between px-4 border-b border-white/10 bg-neutral-950 shrink-0">
        <div className="flex items-center gap-3">
          <Link href={`/games/${gameId}`}>
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div className="h-5 w-px bg-white/20" />
          <h1 className="font-semibold text-sm">{settingsName}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 gap-1.5"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {saveSuccess ? "Saved!" : "Save"}
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-3 gap-1.5">
            <Share2 className="size-4" />
            Share
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="size-4" />
          </Button>
        </div>
      </header>

      {/* Main Editor Area - 2 Panel Layout */}
      <ResizablePanelGroup
        orientation="horizontal"
        className="flex-1"
        defaultLayout={{ assistant: 25, editor: 75 }}
      >
        {/* Left Panel - AI Assistant */}
        <ResizablePanel id="assistant" minSize="200px" maxSize="40%">
          <AIAssistantPanel gameId={gameId} />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel - Tabbed Editor (Preview/Blocks/Code) */}
        <ResizablePanel id="editor" minSize="50%">
          <EditorTabs />
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-[500px] bg-neutral-950 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Game Settings</DialogTitle>
            <DialogDescription className="text-white/60">
              Update your game details and settings.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Game Name */}
            <div className="grid gap-2">
              <Label htmlFor="game-name">Game Name</Label>
              <Input
                id="game-name"
                value={settingsName}
                onChange={(e) => setSettingsName(e.target.value)}
                className="bg-neutral-900 border-white/10"
                placeholder="Enter game name"
              />
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={settingsDescription}
                onChange={(e) => setSettingsDescription(e.target.value)}
                className="bg-neutral-900 border-white/10 min-h-[100px]"
                placeholder="Describe your game..."
              />
            </div>

            {/* Cover Image */}
            <div className="grid gap-2">
              <Label>Cover Image</Label>
              <div className="flex gap-4">
                <div className="w-32 h-20 bg-neutral-900 border border-white/10 rounded-lg overflow-hidden flex items-center justify-center relative">
                  {coverPreview || settingsCoverUrl ? (
                    <Image
                      src={coverPreview || settingsCoverUrl}
                      alt="Cover"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <ImageIcon className="size-8 text-white/30" />
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-center gap-2">
                  <Label
                    htmlFor="cover-upload"
                    className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-neutral-900 border border-white/10 rounded-lg hover:bg-neutral-800 transition-colors w-fit"
                  >
                    <Upload className="size-4" />
                    Upload Image
                  </Label>
                  <input
                    id="cover-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                    className="hidden"
                  />
                  <p className="text-xs text-white/40">
                    Recommended: 1280x720px (16:9)
                  </p>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="mt-6 pt-6 border-t border-red-500/30">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="size-4 text-red-500" />
                <h3 className="text-sm font-semibold text-red-500">Danger Zone</h3>
              </div>
              <p className="text-sm text-white/60 mb-3">
                Once you delete a game, there is no going back. Please be certain.
              </p>
              <Button
                variant="outline"
                className="border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-400"
                onClick={() => {
                  setSettingsOpen(false);
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="size-4 mr-2" />
                Delete Game
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setSettingsOpen(false)}
              className="text-white/60 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateSettings}
              disabled={isUpdatingSettings || !settingsName.trim()}
              className="bg-white text-black hover:bg-white/90"
            >
              {isUpdatingSettings ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[450px] bg-neutral-950 border-red-500/30 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="size-5" />
              Delete Game
            </DialogTitle>
            <DialogDescription className="text-white/60">
              This action cannot be undone. This will permanently delete the game
              <span className="font-semibold text-white"> &quot;{gameName}&quot; </span>
              and all of its files.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label htmlFor="confirm-delete" className="text-white/80">
              Type <span className="font-mono font-semibold text-white">{gameName}</span> to confirm:
            </Label>
            <Input
              id="confirm-delete"
              value={deleteConfirmInput}
              onChange={(e) => setDeleteConfirmInput(e.target.value)}
              className="mt-2 bg-neutral-900 border-white/10"
              placeholder="Enter game name"
              autoComplete="off"
            />
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeleteConfirmInput("");
              }}
              className="text-white/60 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteGame}
              disabled={deleteConfirmInput !== gameName || isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="size-4 mr-2" />
              )}
              Delete Game
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface LoadedGameData {
  gameName: string;
  gameDescription: string;
  gameCoverUrl: string;
  gameCreationMode: GameCreationMode;
  initialWorkspace: BlocklyWorkspace;
}

export function GameEditor({ gameId }: { gameId: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [gameData, setGameData] = useState<LoadedGameData | null>(null);

  useEffect(() => {
    async function loadGameData() {
      try {
        // Load game document from Firestore
        const gameDocRef = doc(db, "games", gameId);
        const gameDoc = await getDoc(gameDocRef);

        let gameName = "Untitled Game";
        let gameDescription = "";
        let gameCoverUrl = "";
        let gameCreationMode: GameCreationMode = "blockly";

        if (gameDoc.exists()) {
          const data = gameDoc.data();
          gameName = data.title || gameName;
          gameDescription = data.description || "";
          gameCoverUrl = data.coverUrl || "";
          gameCreationMode = data.gameCreationMode || "blockly";
        }

        // Load workspace.json from Storage
        let blocks = "";
        try {
          const workspaceRef = ref(storage, `games/${gameId}/workspace.json`);
          const workspaceBytes = await getBytes(workspaceRef);
          blocks = new TextDecoder().decode(workspaceBytes);
        } catch {
          // No workspace file yet, that's ok
        }

        // Load sketch.js from Storage
        let generatedCode = "";
        try {
          const sketchRef = ref(storage, `games/${gameId}/sketch.js`);
          const sketchBytes = await getBytes(sketchRef);
          generatedCode = new TextDecoder().decode(sketchBytes);
        } catch {
          // No sketch file yet, that's ok
        }

        setGameData({
          gameName,
          gameDescription,
          gameCoverUrl,
          gameCreationMode,
          initialWorkspace: { blocks, generatedCode },
        });
      } catch (error) {
        console.error("Error loading game data:", error);
        // Still set game data with defaults so editor can work
        setGameData({
          gameName: "Untitled Game",
          gameDescription: "",
          gameCoverUrl: "",
          gameCreationMode: "blockly",
          initialWorkspace: { blocks: "", generatedCode: "" },
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadGameData();
  }, [gameId]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin" />
          <p className="text-white/60">Loading game...</p>
        </div>
      </div>
    );
  }

  if (!gameData) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        <p className="text-white/60">Failed to load game</p>
      </div>
    );
  }

  return (
    <EditorProvider
      gameId={gameId}
      gameName={gameData.gameName}
      initialWorkspace={gameData.initialWorkspace}
      gameCreationMode={gameData.gameCreationMode}
    >
      <GameEditorContent
        gameId={gameId}
        gameName={gameData.gameName}
        gameDescription={gameData.gameDescription}
        gameCoverUrl={gameData.gameCoverUrl}
        gameCreationMode={gameData.gameCreationMode}
      />
    </EditorProvider>
  );
}
