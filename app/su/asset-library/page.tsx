"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, ImageIcon, Music } from "lucide-react";
import { db, storage } from "@/lib/firebase";
import {
  Timestamp,
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

type PublicAssetType =
  | "sprite"
  | "tileset"
  | "background"
  | "ui"
  | "animation"
  | "sound"
  | "other";

type PublicAsset = {
  id: string;
  name: string;
  description?: string;
  type?: PublicAssetType | string;
  url?: string;
  thumbnailUrl?: string;
  tags?: string[];
  format?: string;
  width?: number | null;
  height?: number | null;
  fileSize?: number;
  status?: string;
  createdAt?: Timestamp | Date | null;
  creatorName?: string;
};

const fallbackAssets: PublicAsset[] = [
  {
    id: "placeholder-1",
    name: "Cyber Neon Tileset",
    description: "80s-inspired neon city tiles, 16x16 grid.",
    type: "tileset",
    tags: ["neon", "city", "tileset"],
    format: "png",
    width: 1024,
    height: 512,
    fileSize: 420000,
    status: "approved",
    creatorName: "Admin",
  },
  {
    id: "placeholder-2",
    name: "Retro UI Pack",
    description: "Buttons, HUD, and modal frames for retro platformers.",
    type: "ui",
    tags: ["ui", "retro"],
    format: "png",
    width: 2048,
    height: 2048,
    fileSize: 820000,
    status: "approved",
    creatorName: "Admin",
  },
];

const formatBytes = (bytes?: number) => {
  if (!bytes && bytes !== 0) return "—";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

async function getImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  if (!file.type.startsWith("image/")) return null;
  try {
    const bitmap = await createImageBitmap(file);
    const dimensions = { width: bitmap.width, height: bitmap.height };
    bitmap.close?.();
    return dimensions;
  } catch {
    return null;
  }
}

export default function AdminAssetLibraryPage() {
  const [assets, setAssets] = useState<PublicAsset[]>(fallbackAssets);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<PublicAssetType | "">("");
  const [tags, setTags] = useState("");
  const [isGenerated, setIsGenerated] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function queryPublicAssets() {
    return query(
      collection(db, "publicAssets"),
      orderBy("createdAt", "desc"),
      limit(50)
    );
  }

  useEffect(() => {
    const unsubscribe = onSnapshot(
      queryPublicAssets(),
      (snapshot) => {
        const next = snapshot.docs.map((doc) => {
          const data = doc.data() as any;
          return {
            id: doc.id,
            ...data,
          } as PublicAsset;
        });
        setAssets(next.length ? next : fallbackAssets);
        setLoading(false);
      },
      (err) => {
        console.error("[PublicAssets] load failed", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const orderedAssets = useMemo(
    () =>
      assets.map((asset) => ({
        ...asset,
        tags: asset.tags || [],
        status: asset.status || "approved",
      })),
    [assets]
  );

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!file) {
      setError("Please choose a file to upload.");
      return;
    }
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!type) {
      setError("Select an asset type.");
      return;
    }

    setUploading(true);
    try {
      const path = `public_assets/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file, { contentType: file.type });
      const url = await getDownloadURL(storageRef);

      const dimensions = await getImageDimensions(file);
      const tagsArray = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      await addDoc(collection(db, "publicAssets"), {
        name: name.trim(),
        description: description.trim() || "",
        type,
        tags: tagsArray,
        url,
        thumbnailUrl: url,
        storagePath: path,
        width: dimensions?.width ?? null,
        height: dimensions?.height ?? null,
        fileSize: file.size,
        format: file.type?.split("/").pop() || "",
        creatorId: "admin",
        creatorName: "Admin",
        isGenerated,
        downloadCount: 0,
        likeCount: 0,
        useCount: 0,
        status: "approved",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setName("");
      setDescription("");
      setType("");
      setTags("");
      setIsGenerated(false);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("[PublicAssets] upload failed", err);
      setError("Upload failed. Please retry.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-neutral-400">Storage</p>
          <h1 className="text-3xl font-bold tracking-tight">Public assets</h1>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-white text-black hover:bg-neutral-200 font-semibold"
        >
          <Upload className="mr-2 h-4 w-4" />
          New asset
        </Button>
      </div>

      <Card className="border-white/10 bg-neutral-900 text-white">
        <CardHeader>
          <CardTitle>Library</CardTitle>
          <CardDescription className="text-neutral-400">
            Latest 50 assets from <code>publicAssets</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5">
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="hidden md:table-cell">Format</TableHead>
                <TableHead className="hidden lg:table-cell">Resolution</TableHead>
                <TableHead className="text-right">Size</TableHead>
                <TableHead className="hidden lg:table-cell">Status</TableHead>
                <TableHead className="hidden md:table-cell text-right">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow className="border-white/5">
                  <TableCell colSpan={7} className="text-center py-6">
                    <div className="flex items-center justify-center gap-3 text-neutral-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading assets…
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                orderedAssets.map((asset) => (
                  <TableRow key={asset.id} className="border-white/5">
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{asset.name}</span>
                        {asset.description && (
                          <span className="text-xs text-neutral-400 line-clamp-1">
                            {asset.description}
                          </span>
                        )}
                        {asset.tags && asset.tags.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {asset.tags.slice(0, 3).map((tag) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className="border-white/15 bg-white/5 text-xs text-neutral-300"
                              >
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="capitalize text-neutral-300">
                      {asset.type || "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-neutral-300">
                      {asset.format || "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-neutral-300">
                      {asset.width && asset.height ? `${asset.width}×${asset.height}` : "—"}
                    </TableCell>
                    <TableCell className="text-right text-neutral-300">
                      {formatBytes(asset.fileSize)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge
                        variant="outline"
                        className="border-white/15 bg-white/5 capitalize text-neutral-200"
                      >
                        {asset.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-right text-neutral-400">
                      {asset.createdAt
                        ? new Date(
                            asset.createdAt instanceof Timestamp
                              ? asset.createdAt.toDate()
                              : asset.createdAt
                          ).toLocaleDateString()
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-neutral-950 text-white border-white/10">
          <DialogHeader>
            <DialogTitle>Upload new asset</DialogTitle>
            <DialogDescription className="text-neutral-400">
              Publish community assets to the <code>publicAssets</code> collection.
            </DialogDescription>
          </DialogHeader>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleUpload}>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Cyber Neon Tileset"
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={(value) => setType(value as PublicAssetType)}>
                <SelectTrigger id="type" className="bg-white/5 border-white/10">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 text-white border-white/10">
                  <SelectItem value="sprite">Sprite</SelectItem>
                  <SelectItem value="tileset">Tileset</SelectItem>
                  <SelectItem value="background">Background</SelectItem>
                  <SelectItem value="ui">UI</SelectItem>
                  <SelectItem value="animation">Animation</SelectItem>
                  <SelectItem value="sound">Sound</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short summary for creators."
                className="bg-white/5 border-white/10 min-h-[96px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="neon, city, cyberpunk"
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label>Generated?</Label>
              <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                <Checkbox
                  id="generated"
                  checked={isGenerated}
                  onCheckedChange={(value) => setIsGenerated(Boolean(value))}
                />
                <Label htmlFor="generated" className="text-sm text-neutral-300 cursor-pointer">
                  AI generated asset
                </Label>
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="file">File</Label>
              <div className="flex flex-col gap-3 rounded-lg border border-dashed border-white/15 bg-white/5 p-4">
                <div className="flex items-center gap-3 text-neutral-400">
                  {type === "sound" ? (
                    <Music className="h-5 w-5" />
                  ) : (
                    <ImageIcon className="h-5 w-5" />
                  )}
                  <span className="text-sm">
                    PNG, GIF, JSON, or MP3. Max 25 MB (enforced by Storage rules).
                  </span>
                </div>
                <Input
                  id="file"
                  type="file"
                  accept=".png,.gif,.json,.mp3,image/*,audio/*"
                  className="bg-transparent file:bg-white file:text-black file:rounded-md file:px-3 file:py-2"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  ref={fileInputRef}
                />
              </div>
            </div>
            {error && (
              <div className="md:col-span-2 text-sm text-red-400" role="alert">
                {error}
              </div>
            )}
            <DialogFooter className="md:col-span-2 flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
              <Button
                type="button"
                variant="ghost"
                className="text-white hover:bg-white/10"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={uploading}
                className="bg-white text-black hover:bg-neutral-200 font-semibold"
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Publish asset
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
