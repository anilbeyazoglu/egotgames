"use client";

import { useEffect, useState, useRef } from "react";
import { db, auth, storage } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Upload, Loader2, Download, Save, X, Sparkles } from "lucide-react";

interface GeneratedAsset {
  id: string;
  url: string;
  createdAt: any;
}

const DIRECTIONS = [
  { value: "south", label: "South (facing camera)" },
  { value: "north", label: "North (facing away)" },
  { value: "east", label: "East" },
  { value: "west", label: "West" },
  { value: "south-east", label: "South-East" },
  { value: "south-west", label: "South-West" },
  { value: "north-east", label: "North-East" },
  { value: "north-west", label: "North-West" },
];

const TOOLS = [
  { value: "create-image-pixflux", label: "Create M-XL Image (PixFlux)" },
  { value: "create-image-bitforge", label: "Create S-M Image (BitForge)" },
];

const SIZE_PRESETS = [64, 128, 256];

export default function PixelEditorPage() {
  // Auth state
  const [user, setUser] = useState<any>(null);

  // Form state
  const [tool, setTool] = useState("create-image-pixflux");
  const [description, setDescription] = useState("");
  const [direction, setDirection] = useState("south");
  const [width, setWidth] = useState(128);
  const [height, setHeight] = useState(128);
  const [transparentBg, setTransparentBg] = useState(false);
  const [initImage, setInitImage] = useState<string | null>(null);
  const [initImagePreview, setInitImagePreview] = useState<string | null>(null);

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Gallery state
  const [gallery, setGallery] = useState<GeneratedAsset[]>([]);
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auth listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Load user's AI-generated assets for gallery
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "assets"),
      where("ownerId", "==", user.uid),
      where("isGenerated", "==", true),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const assets: GeneratedAsset[] = [];
      snapshot.forEach((doc) => {
        assets.push({ id: doc.id, ...doc.data() } as GeneratedAsset);
      });
      setGallery(assets);
    });

    return () => unsubscribe();
  }, [user]);

  // Handle init image upload
  const handleInitImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setInitImagePreview(base64);
      // Remove data URL prefix for API
      setInitImage(base64.split(",")[1]);
    };
    reader.readAsDataURL(file);
  };

  const clearInitImage = () => {
    setInitImage(null);
    setInitImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Generate image
  const handleGenerate = async () => {
    if (!user || !description.trim()) return;

    setGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const response = await fetch("/api/pixellab/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          tool,
          description: description.trim(),
          width,
          height,
          direction,
          noBackground: transparentBg,
          initImage: initImage || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Generation failed");
      }

      if (data.image) {
        setGeneratedImage(`data:image/png;base64,${data.image}`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate image");
    } finally {
      setGenerating(false);
    }
  };

  // Save generated image to assets
  const handleSaveToAssets = async () => {
    if (!user || !generatedImage) return;

    setSaving(true);
    try {
      const timestamp = Date.now();
      const fileName = `generated_${timestamp}.png`;
      const storagePath = `assets/${user.uid}/${fileName}`;

      // Upload to Firebase Storage
      const storageRef = ref(storage, storagePath);
      await uploadString(storageRef, generatedImage, "data_url");
      const downloadURL = await getDownloadURL(storageRef);

      // Create asset document
      await addDoc(collection(db, "assets"), {
        ownerId: user.uid,
        type: "sprite",
        url: downloadURL,
        fileName,
        storagePath,
        isGenerated: true,
        generationPrompt: description,
        cost: 1,
        createdAt: serverTimestamp(),
      });

      // Clear generated image after saving
      setGeneratedImage(null);
    } catch (err: any) {
      setError(err.message || "Failed to save asset");
    } finally {
      setSaving(false);
    }
  };

  // Download generated image
  const handleDownload = () => {
    if (!generatedImage) return;

    const link = document.createElement("a");
    link.href = generatedImage;
    link.download = `pixel-art-${Date.now()}.png`;
    link.click();
  };

  // Get max size based on tool
  const maxSize = tool === "create-image-bitforge" ? 200 : 400;

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please sign in to use the Pixel Editor</p>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-6">
      {/* Left Panel - Controls */}
      <div className="w-80 flex-shrink-0 space-y-6 overflow-y-auto pb-6">
        {/* Tool Selection */}
        <div className="space-y-2">
          <Label>Tool</Label>
          <Select value={tool} onValueChange={setTool}>
            <SelectTrigger className="bg-white/5 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TOOLS.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Many more options and tools are available in the editors.
          </p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A stunning female adventurer casting a spell. Cool fantasy dungeon scene. Award winning masterpiece, trending on artstation"
            className="min-h-[100px] bg-white/5 border-white/10 resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Describe the image you want to create, e.g. &quot;Full-body view of a wizard&quot;
          </p>
        </div>

        {/* Direction */}
        <div className="space-y-2">
          <Label>Direction</Label>
          <Select value={direction} onValueChange={setDirection}>
            <SelectTrigger className="bg-white/5 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DIRECTIONS.map((d) => (
                <SelectItem key={d.value} value={d.value}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Only lightly guides character facing direction. Use &quot;None&quot; for objects, scenes, or non-character images.
          </p>
        </div>

        {/* Init Image */}
        <div className="space-y-2">
          <Label>Init Image</Label>
          <div
            className="border border-dashed border-white/20 rounded-lg p-4 text-center cursor-pointer hover:bg-white/5 transition-colors relative"
            onClick={() => fileInputRef.current?.click()}
          >
            {initImagePreview ? (
              <div className="relative">
                <img
                  src={initImagePreview}
                  alt="Init image"
                  className="max-h-32 mx-auto rounded"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearInitImage();
                  }}
                  className="absolute top-0 right-0 p-1 bg-red-500 rounded-full hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG, GIF up to 10MB
                </p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleInitImageUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Width */}
        <div className="space-y-2">
          <Label>Width</Label>
          <div className="flex gap-2">
            {SIZE_PRESETS.filter((s) => s <= maxSize).map((size) => (
              <Button
                key={size}
                variant={width === size ? "default" : "outline"}
                size="sm"
                onClick={() => setWidth(size)}
                className="flex-1"
              >
                {size}
              </Button>
            ))}
          </div>
          <Slider
            value={[width]}
            onValueChange={([v]) => setWidth(v)}
            min={16}
            max={maxSize}
            step={1}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground text-center">{width}px</p>
        </div>

        {/* Height */}
        <div className="space-y-2">
          <Label>Height</Label>
          <div className="flex gap-2">
            {SIZE_PRESETS.filter((s) => s <= maxSize).map((size) => (
              <Button
                key={size}
                variant={height === size ? "default" : "outline"}
                size="sm"
                onClick={() => setHeight(size)}
                className="flex-1"
              >
                {size}
              </Button>
            ))}
          </div>
          <Slider
            value={[height]}
            onValueChange={([v]) => setHeight(v)}
            min={16}
            max={maxSize}
            step={1}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground text-center">{height}px</p>
        </div>

        <p className="text-xs text-muted-foreground">
          The PixFlux model works best for 64x64 and larger. Try BitForge if you want to create smaller images.
        </p>
        <p className="text-xs text-muted-foreground">
          Maximum size for your tier: {maxSize}x{maxSize}
        </p>

        {/* Transparent Background */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="transparent"
            checked={transparentBg}
            onCheckedChange={(checked) => setTransparentBg(checked as boolean)}
          />
          <Label htmlFor="transparent" className="cursor-pointer">
            Transparent background
          </Label>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={generating || !description.trim()}
          className="w-full bg-teal-600 hover:bg-teal-700"
          size="lg"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate
            </>
          )}
        </Button>

        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}
      </div>

      {/* Center - Preview Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 flex items-center justify-center bg-black/20 rounded-lg border border-white/10">
          {generatedImage ? (
            <div className="relative">
              <img
                src={generatedImage}
                alt="Generated pixel art"
                className="max-w-full max-h-[500px] pixelated"
                style={{ imageRendering: "pixelated" }}
              />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveToAssets}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-1" />
                  )}
                  Save to Assets
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">
              {generating ? "Generating..." : "Generated image will appear here"}
            </p>
          )}
        </div>
      </div>

      {/* Right - Gallery */}
      <div className="w-48 flex-shrink-0">
        <h3 className="text-sm font-medium mb-3">Gallery ({gallery.length})</h3>
        <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-200px)]">
          {gallery.map((asset) => (
            <Card
              key={asset.id}
              className="p-1 cursor-pointer hover:bg-white/5 transition-colors border-white/10"
              onClick={() => setGeneratedImage(asset.url)}
            >
              <img
                src={asset.url}
                alt="Asset"
                className="w-full aspect-square object-cover rounded"
                style={{ imageRendering: "pixelated" }}
              />
            </Card>
          ))}
          {gallery.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Your generated assets will appear here
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
