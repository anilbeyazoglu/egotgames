"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useEditor } from "./editor-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Upload,
  Globe,
  User as UserIcon,
  Search,
  Loader2,
  Trash2,
  ImageIcon,
  FileAudio,
  FileVideo,
  File,
  Plus,
  Download,
  MessageSquare
} from "lucide-react";
import { storage, auth, db } from "@/lib/firebase";
import { ref, uploadBytes, listAll, getDownloadURL, deleteObject, getMetadata } from "firebase/storage";
import { collection, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged, type User } from "firebase/auth";
import Image from "next/image";

type AssetType = "image" | "audio" | "video" | "other";

interface Asset {
  id: string;
  name: string;
  url: string;
  type: AssetType;
  path: string;
  size?: number;
  createdAt?: string;
}

type ViewMode = "project" | "public" | "user";

export function AssetsPanel() {
  const { gameId, sendAssetToChat } = useEditor();
  const [viewMode, setViewMode] = useState<ViewMode>("project");
  const [isLoading, setIsLoading] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const getAssetType = (filename: string, contentType?: string): AssetType => {
    if (contentType?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(filename)) return "image";
    if (contentType?.startsWith("audio/") || /\.(mp3|wav|ogg|m4a)$/i.test(filename)) return "audio";
    if (contentType?.startsWith("video/") || /\.(mp4|webm|mov)$/i.test(filename)) return "video";
    return "other";
  };

  const mapFirestoreAssetType = (type: string): AssetType => {
    const t = type.toLowerCase();
    if (t === "sprite") return "image";
    if (t === "sound") return "audio";
    if (t === "video") return "video";
    return "other";
  };

  const loadProjectAssets = useCallback(async () => {
    if (!gameId) return;
    
    setIsLoading(true);
    try {
      const assetsRef = ref(storage, `games/${gameId}/assets`);
      const res = await listAll(assetsRef);
      
      const assetPromises = res.items.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef);
        // Try to get metadata, but don't fail if we can't
        let meta = null;
        try {
          meta = await getMetadata(itemRef);
        } catch {
          console.warn("Failed to get metadata for", itemRef.name);
        }

        const name = itemRef.name;
        const type = getAssetType(name, meta?.contentType);
        
        return {
          id: itemRef.fullPath,
          name,
          url,
          type,
          path: itemRef.fullPath,
          size: meta?.size,
          createdAt: meta?.timeCreated
        };
      });

      const loadedAssets = await Promise.all(assetPromises);
      setAssets(loadedAssets);
    } catch (error) {
      console.error("Error loading assets:", error);
    } finally {
      setIsLoading(false);
    }
  }, [gameId]);

  const loadUserAssets = useCallback(async () => {
    if (!user) {
      setAssets([]);
      return;
    }
    
    setIsLoading(true);
    try {
      const q = query(
        collection(db, "assets"),
        where("ownerId", "==", user.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const userAssets: Asset[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.fileName || data.name || "Untitled",
          url: data.url,
          type: mapFirestoreAssetType(data.type || ""),
          path: data.storagePath,
          size: 0,
          createdAt: data.createdAt?.toDate?.()?.toISOString()
        };
      });

      // Sort client-side to avoid Firestore index requirements
      userAssets.sort((a, b) => {
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setAssets(userAssets);
    } catch (error) {
      console.error("Error loading user assets:", error);
      // Fallback or empty if error
      setAssets([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load assets based on view mode
  useEffect(() => {
    if (viewMode === "project") {
      loadProjectAssets();
    } else if (viewMode === "user") {
      loadUserAssets();
    } else {
      // Mock data for public view for now
      setAssets([]);
    }
  }, [viewMode, gameId, user, loadProjectAssets, loadUserAssets]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Only allow upload in Project mode for now
    if (viewMode !== "project") {
      alert("Please switch to Project view to upload game-specific assets.");
      return;
    }

    setIsLoading(true);
    try {
      // Upload each file
      await Promise.all(Array.from(files).map(async (file) => {
        const assetRef = ref(storage, `games/${gameId}/assets/${file.name}`);
        await uploadBytes(assetRef, file);
      }));
      
      // Reload assets
      await loadProjectAssets();
      
      // Clear input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error uploading assets:", error);
      alert("Failed to upload assets. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportAsset = async (asset: Asset) => {
    if (!gameId) return;
    
    setIsLoading(true);
    try {
      // Fetch the blob
      const response = await fetch(asset.url);
      const blob = await response.blob();
      
      // Upload to project assets
      const assetRef = ref(storage, `games/${gameId}/assets/${asset.name}`);
      await uploadBytes(assetRef, blob);
      
      alert("Asset imported to project successfully!");
      // Switch to project view to see it
      setViewMode("project");
    } catch (error) {
      console.error("Error importing asset:", error);
      alert("Failed to import asset. CORS or permission issue likely.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAsset = async (asset: Asset) => {
    if (!confirm(`Are you sure you want to delete ${asset.name}?`)) return;

    setIsLoading(true);
    try {
      const assetRef = ref(storage, asset.path);
      await deleteObject(assetRef);
      await loadProjectAssets();
    } catch (error) {
      console.error("Error deleting asset:", error);
      alert("Failed to delete asset.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    // Could add toast notification here
  };

  const filteredAssets = assets.filter(asset => 
    asset.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-neutral-900">
      {/* Toolbar */}
      <div className="p-2 border-b border-white/10 flex flex-col gap-2">
        <div className="flex items-center gap-1">
          <Button 
            variant={viewMode === "project" ? "secondary" : "ghost"} 
            size="sm" 
            onClick={() => setViewMode("project")}
            className="flex-1 text-xs"
          >
            Project
          </Button>
          <Button 
            variant={viewMode === "public" ? "secondary" : "ghost"} 
            size="sm" 
            onClick={() => setViewMode("public")}
            className="flex-1 text-xs"
          >
            <Globe className="size-3 mr-1.5" />
            Public
          </Button>
          <Button 
            variant={viewMode === "user" ? "secondary" : "ghost"} 
            size="sm" 
            onClick={() => setViewMode("user")}
            className="flex-1 text-xs"
          >
            <UserIcon className="size-3 mr-1.5" />
            My Assets
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-white/40" />
            <Input 
              placeholder="Search assets..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-7 text-xs bg-neutral-950 border-white/10"
            />
          </div>
          {viewMode === "project" && (
            <Button 
              size="sm" 
              className="h-8 px-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="size-3 mr-1.5" />
              Upload
            </Button>
          )}
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden"
            multiple
            onChange={handleFileUpload}
          />
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-white/40" />
          </div>
        ) : filteredAssets.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {filteredAssets.map((asset) => (
              <div 
                key={asset.id} 
                className="group relative bg-neutral-950 border border-white/10 rounded-lg overflow-hidden hover:border-white/30 transition-colors"
              >
                <div className="aspect-square flex items-center justify-center bg-neutral-900/50">
                  {asset.type === "image" ? (
                    <div className="relative w-full h-full">
                      <Image 
                        src={asset.url} 
                        alt={asset.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : asset.type === "audio" ? (
                    <FileAudio className="size-8 text-white/40" />
                  ) : asset.type === "video" ? (
                    <FileVideo className="size-8 text-white/40" />
                  ) : (
                    <File className="size-8 text-white/40" />
                  )}
                </div>
                
                <div className="p-2">
                  <p className="text-xs font-medium truncate" title={asset.name}>{asset.name}</p>
                </div>

                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="size-7"
                    onClick={() => sendAssetToChat(asset.url, asset.name)}
                    title="Send to Chat"
                  >
                    <MessageSquare className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="size-7"
                    onClick={() => copyToClipboard(asset.url)}
                    title="Copy URL"
                  >
                    <Plus className="size-4" />
                  </Button>
                  {viewMode === "project" && (
                    <Button
                      size="icon"
                      variant="destructive"
                      className="size-7"
                      onClick={() => handleDeleteAsset(asset)}
                      title="Delete"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                  {viewMode === "user" && (
                    <Button
                      size="icon"
                      variant="secondary"
                      className="size-7"
                      onClick={() => handleImportAsset(asset)}
                      title="Import to Project"
                    >
                      <Download className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center text-white/40">
            {viewMode === "project" ? (
              <>
                <ImageIcon className="size-8 mb-2 opacity-50" />
                <p className="text-sm">No assets yet</p>
                <p className="text-xs mt-1">Upload files to use them in your game</p>
              </>
            ) : viewMode === "user" ? (
              <>
                <UserIcon className="size-8 mb-2 opacity-50" />
                <p className="text-sm">No personal assets found</p>
                <p className="text-xs mt-1">Upload assets in your dashboard to see them here</p>
              </>
            ) : (
              <>
                <Globe className="size-8 mb-2 opacity-50" />
                <p className="text-sm">Library coming soon</p>
                <p className="text-xs mt-1">Public library is under construction</p>
              </>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
