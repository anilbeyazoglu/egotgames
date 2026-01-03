"use client";

import { use, useEffect, useState } from "react";
import { db, storage } from "@/lib/firebase";
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, deleteObject, listAll } from "firebase/storage";
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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Play,
  Edit3,
  BarChart3,
  Settings,
  Loader2,
  Upload,
  Trash2,
  AlertTriangle,
  ImageIcon,
  Globe,
  EyeOff,
} from "lucide-react";
import { Link, useRouter } from "@/i18n/routing";
import Image from "next/image";
import { ShareDialog } from "@/components/share-dialog";

interface SharedUser {
  odbyUserId: string;
  username: string;
  avatarUrl?: string;
}

interface Game {
  id: string;
  title: string;
  description: string;
  typeName: string;
  categoryName: string;
  status: string;
  visibility: "public" | "private";
  coverUrl?: string;
  sharedWith?: SharedUser[];
  stats?: {
    plays: number;
    likes: number;
  };
  createdAt: { toDate: () => Date } | null;
}

export default function GameDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);

  // Settings dialog state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsName, setSettingsName] = useState("");
  const [settingsDescription, setSettingsDescription] = useState("");
  const [settingsCoverUrl, setSettingsCoverUrl] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Publish state
  const [isPublishing, setIsPublishing] = useState(false);

  // Toggle publish status
  const handleTogglePublish = async () => {
    if (!game) return;
    setIsPublishing(true);
    try {
      const newStatus = game.status === "published" ? "draft" : "published";
      const gameDocRef = doc(db, "games", game.id);
      await updateDoc(gameDocRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      setGame({ ...game, status: newStatus });
    } catch (error) {
      console.error("Error updating publish status:", error);
    } finally {
      setIsPublishing(false);
    }
  };

  useEffect(() => {
    async function fetchGame() {
      try {
        const docRef = doc(db, "games", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setGame({ id: docSnap.id, ...docSnap.data() } as Game);
        } else {
          // Handle not found
          setGame(null);
        }
      } catch (error) {
        console.error("Error fetching game:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchGame();
  }, [id]);

  // Open settings dialog and populate with current values
  const openSettings = () => {
    if (game) {
      setSettingsName(game.title);
      setSettingsDescription(game.description || "");
      setSettingsCoverUrl(game.coverUrl || "");
      setCoverFile(null);
      setCoverPreview(null);
      setSettingsOpen(true);
    }
  };

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
    if (!game) return;
    setIsUpdatingSettings(true);

    try {
      const gameDocRef = doc(db, "games", game.id);
      const updates: Record<string, unknown> = {
        title: settingsName,
        description: settingsDescription,
        updatedAt: serverTimestamp(),
      };

      // Upload cover image if selected
      if (coverFile) {
        const coverRef = ref(storage, `games/${game.id}/cover.${coverFile.name.split(".").pop()}`);
        await uploadBytes(coverRef, coverFile);
        const coverUrl = `https://firebasestorage.googleapis.com/v0/b/${storage.app.options.storageBucket}/o/${encodeURIComponent(coverRef.fullPath)}?alt=media`;
        updates.coverUrl = coverUrl;
        setSettingsCoverUrl(coverUrl);
      }

      await updateDoc(gameDocRef, updates);
      
      // Update local state
      setGame({ ...game, title: settingsName, description: settingsDescription, coverUrl: updates.coverUrl as string || game.coverUrl });
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
    if (!game || deleteConfirmInput !== game.title) return;

    setIsDeleting(true);

    try {
      // Delete all files in game folder from Storage
      const gameFolderRef = ref(storage, `games/${game.id}`);
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
      const gameDocRef = doc(db, "games", game.id);
      await deleteDoc(gameDocRef);

      // Redirect to games list
      router.push("/games");
    } catch (error) {
      console.error("Error deleting game:", error);
      alert("Failed to delete game. Please try again.");
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!game) {
    // Ideally trigger nextjs notFound() but that works better in Server Components or during initial render if data was pre-fetched.
    // For client side, we can just show a UI.
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <h2 className="text-2xl font-bold">Game not found</h2>
        <Link href="/games">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Games
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link
              href="/games"
              className="hover:text-white transition-colors flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Games
            </Link>
            <span>/</span>
            <span className="text-white">{game.title}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{game.title}</h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{game.typeName}</Badge>
            <Badge
              className={
                game.status === "published"
                  ? "bg-green-500/10 text-green-500"
                  : "bg-yellow-500/10 text-yellow-500"
              }
            >
              {game.status}
            </Badge>
            <Badge variant="secondary">{game.visibility}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={game.status === "published" ? "outline" : "default"}
            size="sm"
            onClick={handleTogglePublish}
            disabled={isPublishing}
            className={game.status === "published" ? "" : "bg-green-600 hover:bg-green-700 text-white"}
          >
            {isPublishing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : game.status === "published" ? (
              <EyeOff className="mr-2 h-4 w-4" />
            ) : (
              <Globe className="mr-2 h-4 w-4" />
            )}
            {game.status === "published" ? "Unpublish" : "Publish"}
          </Button>
          <ShareDialog
            gameId={game.id}
            gameTitle={game.title}
            visibility={game.visibility || "private"}
            sharedWith={game.sharedWith}
            onVisibilityChange={(newVisibility) => {
              setGame({ ...game, visibility: newVisibility });
            }}
          />
          <Button variant="outline" size="sm" onClick={openSettings}>
            <Settings className="mr-2 h-4 w-4" /> Settings
          </Button>
          <Link href={`/editor/${game.id}`}>
            <Button
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Edit3 className="mr-2 h-4 w-4" /> Edit
            </Button>
          </Link>
          <Link href={`/play/${game.id}`}>
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Play className="mr-2 h-4 w-4" /> Play
            </Button>
          </Link>
        </div>
      </div>

      <Separator className="bg-white/10" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-white/10 bg-black/20">
            <div className="aspect-video w-full bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center rounded-t-xl relative overflow-hidden">
              {game.coverUrl ? (
                <Image
                  src={game.coverUrl}
                  alt={game.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <span className="text-neutral-500">
                  No cover image yet
                </span>
              )}
            </div>
            <CardHeader>
              <CardTitle>About this game</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {game.description || "No description provided."}
              </p>
            </CardContent>
          </Card>

          <Tabs defaultValue="levels" className="w-full">
            <TabsList className="bg-white/5 border border-white/10 text-muted-foreground">
              <TabsTrigger
                value="levels"
                className="data-[state=active]:bg-white/10 data-[state=active]:text-white"
              >
                Levels
              </TabsTrigger>
              <TabsTrigger
                value="rankings"
                className="data-[state=active]:bg-white/10 data-[state=active]:text-white"
              >
                Leaderboard
              </TabsTrigger>
            </TabsList>
            <TabsContent value="levels" className="mt-4">
              <Card className="border-white/10 bg-black/20">
                <CardHeader>
                  <CardTitle>Levels</CardTitle>
                  <CardDescription>
                    Manage your game levels here.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    No levels created yet. Open the editor to add levels.
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="rankings" className="mt-4">
              <Card className="border-white/10 bg-black/20">
                <CardHeader>
                  <CardTitle>Leaderboard</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    No scores recorded yet.
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card className="border-white/10 bg-black/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" /> Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Plays</span>
                <span className="text-xl font-bold">
                  {game.stats?.plays || 0}
                </span>
              </div>
              <Separator className="bg-white/5" />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Likes</span>
                <span className="text-xl font-bold">
                  {game.stats?.likes || 0}
                </span>
              </div>
              <Separator className="bg-white/5" />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Created</span>
                <span className="text-sm text-right">
                  {game.createdAt?.toDate
                    ? new Date(game.createdAt.toDate()).toLocaleDateString()
                    : "Just now"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

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
              <span className="font-semibold text-white"> &quot;{game.title}&quot; </span>
              and all of its files.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label htmlFor="confirm-delete" className="text-white/80">
              Type <span className="font-mono font-semibold text-white">{game.title}</span> to confirm:
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
              disabled={deleteConfirmInput !== game.title || isDeleting}
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
