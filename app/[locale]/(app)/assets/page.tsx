"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { db, auth, storage } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocsFromCache,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Layers,
  Image as ImageIcon,
  Music,
  Grid3X3,
  Sparkles,
  Coins,
  Calendar,
  Upload,
  Wand2,
  Loader2,
  Trash2,
} from "lucide-react";

interface Asset {
  id: string;
  ownerId: string;
  gameId?: string;
  type: string;
  url: string;
  storagePath?: string;
  isGenerated: boolean;
  cost: number;
  createdAt: any;
}

type AssetFilter = "all" | "sprite" | "sound" | "tileset";

const getAssetIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case "sprite":
      return ImageIcon;
    case "sound":
      return Music;
    case "tileset":
      return Grid3X3;
    default:
      return Layers;
  }
};

const getAssetTypeColor = (type: string) => {
  switch (type?.toLowerCase()) {
    case "sprite":
      return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20";
    case "sound":
      return "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20";
    case "tileset":
      return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
    default:
      return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20";
  }
};

export default function AssetsPage() {
  const t = useTranslations("Dashboard");

  // State
  const [user, setUser] = useState<any>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTimeout, setIsTimeout] = useState(false);
  const [filter, setFilter] = useState<AssetFilter>("all");
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
        setAssets([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Data Listener (Dependent on User)
  useEffect(() => {
    let unsubscribeSnapshot: () => void;

    if (user) {
      console.log("Setting up assets for:", user.uid);
      setIsTimeout(false);

      const q = query(
        collection(db, "assets"),
        where("ownerId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      // STEP 1: Load from cache INSTANTLY
      getDocsFromCache(q)
        .then((cacheSnapshot) => {
          console.log(
            `[Perf] Assets cache read: ${cacheSnapshot.size} docs instantly`
          );
          const assetsData: Asset[] = [];
          cacheSnapshot.forEach((doc) => {
            assetsData.push({ id: doc.id, ...doc.data() } as Asset);
          });
          setAssets(assetsData);
          setLoading(false);
        })
        .catch((err) => {
          console.log(
            "[Perf] No cache available, waiting for network...",
            err.message
          );
        });

      // STEP 2: Set up realtime listener for updates
      unsubscribeSnapshot = onSnapshot(
        q,
        (querySnapshot) => {
          console.log(
            `[Perf] Assets network update: ${querySnapshot.size} docs, fromCache: ${querySnapshot.metadata.fromCache}`
          );
          const assetsData: Asset[] = [];
          querySnapshot.forEach((doc) => {
            assetsData.push({ id: doc.id, ...doc.data() } as Asset);
          });
          setAssets(assetsData);
          setLoading(false);
        },
        (error) => {
          console.error("Assets listener error:", error);
          setLoading(false);
        }
      );
    } else if (user === null) {
      setLoading(false);
      setAssets([]);
    }

    return () => {
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, [user]);

  // Safety timeout for loading
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (loading) {
      timeoutId = setTimeout(() => {
        console.warn("Assets loading timed out (8s)");
        setIsTimeout(true);
      }, 8000);
    }
    return () => clearTimeout(timeoutId);
  }, [loading]);

  // Filter assets
  const filteredAssets =
    filter === "all"
      ? assets
      : assets.filter((a) => a.type?.toLowerCase() === filter);

  // Determine asset type from file
  const getAssetTypeFromFile = (file: File): string => {
    const mimeType = file.type;
    if (mimeType.startsWith("image/")) return "sprite";
    if (mimeType.startsWith("audio/")) return "sound";
    return "sprite";
  };

  // Handle file upload
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const assetType = getAssetTypeFromFile(file);
        const timestamp = Date.now();
        const fileName = `${timestamp}_${file.name}`;
        const storagePath = `assets/${user.uid}/${fileName}`;
        
        // Upload to Firebase Storage
        const storageRef = ref(storage, storagePath);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);

        // Create Firestore document
        await addDoc(collection(db, "assets"), {
          ownerId: user.uid,
          type: assetType,
          url: downloadURL,
          fileName: file.name,
          storagePath: storagePath,
          isGenerated: false,
          cost: 0,
          createdAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = "";
    }
  };

  // Handle asset deletion
  const handleDelete = async (asset: Asset) => {
    if (!user || deletingId) return;

    setDeletingId(asset.id);
    try {
      // Delete from Firebase Storage if storagePath exists
      if (asset.storagePath) {
        const storageRef = ref(storage, asset.storagePath);
        await deleteObject(storageRef).catch((err) => {
          // Ignore if file doesn't exist
          console.warn("Storage delete warning:", err.message);
        });
      }

      // Delete Firestore document
      await deleteDoc(doc(db, "assets", asset.id));
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setDeletingId(null);
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
            {t("assets.title")}
          </h2>
          <p className="text-muted-foreground">{t("assets.description")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled>
            <Wand2 className="h-4 w-4 mr-2" />
            Create with AI
          </Button>
          <Button asChild disabled={uploading}>
            <label className="cursor-pointer">
              {uploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {uploading ? "Uploading..." : "Upload"}
              <input
                type="file"
                className="hidden"
                accept="image/*,audio/*"
                multiple
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <Tabs
        defaultValue="all"
        value={filter}
        onValueChange={(v) => setFilter(v as AssetFilter)}
        className="w-full"
      >
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="all" className="data-[state=active]:bg-white/10">
            {t("assets.tabs.all")}
          </TabsTrigger>
          <TabsTrigger
            value="sprite"
            className="data-[state=active]:bg-white/10"
          >
            <ImageIcon className="h-4 w-4 mr-1" />
            {t("assets.tabs.sprites")}
          </TabsTrigger>
          <TabsTrigger
            value="sound"
            className="data-[state=active]:bg-white/10"
          >
            <Music className="h-4 w-4 mr-1" />
            {t("assets.tabs.sounds")}
          </TabsTrigger>
          <TabsTrigger
            value="tileset"
            className="data-[state=active]:bg-white/10"
          >
            <Grid3X3 className="h-4 w-4 mr-1" />
            {t("assets.tabs.tilesets")}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredAssets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
            <Layers className="h-6 w-6 text-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">
            {t("assets.empty.title")}
          </h3>
          <p className="mb-4 text-sm text-muted-foreground max-w-sm">
            {t("assets.empty.description")}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAssets.map((asset) => {
            const AssetIcon = getAssetIcon(asset.type);
            return (
              <Card
                key={asset.id}
                className="h-full hover:bg-white/5 transition-colors cursor-pointer border-white/10 overflow-hidden"
              >
                {/* Asset Preview */}
                <div className="aspect-square w-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center relative group">
                  {asset.url && asset.type?.toLowerCase() === "sprite" ? (
                    <img
                      src={asset.url}
                      alt="Asset preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <AssetIcon className="h-16 w-16 text-white/20" />
                  )}
                  {asset.isGenerated && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI
                      </Badge>
                    </div>
                  )}
                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(asset);
                    }}
                    disabled={deletingId === asset.id}
                    className="absolute top-2 left-2 p-1.5 rounded-md bg-red-500/80 hover:bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                    title="Delete asset"
                  >
                    {deletingId === asset.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <Badge className={getAssetTypeColor(asset.type)}>
                      {asset.type || "Unknown"}
                    </Badge>
                  </div>
                  <CardTitle className="line-clamp-1 text-sm">
                    {asset.type} Asset
                  </CardTitle>
                </CardHeader>

                <CardFooter className="p-4 pt-0 text-xs text-muted-foreground flex justify-between items-center">
                  {asset.isGenerated && asset.cost > 0 && (
                    <div className="flex items-center gap-1">
                      <Coins className="h-3 w-3 text-yellow-500" />
                      <span>{asset.cost}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 ml-auto">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {asset.createdAt?.toDate
                        ? new Date(
                            asset.createdAt.toDate()
                          ).toLocaleDateString()
                        : "Just now"}
                    </span>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
