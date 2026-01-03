import { Timestamp } from "firebase/firestore";

// ============================================
// Game Types
// ============================================

export type GameCreationMode = "blockly" | "javascript";

export type GameVisibility = "public" | "private";

export type GameStatus = "draft" | "published";

export interface Game {
  id: string;
  ownerId: string;
  title: string;
  slug?: string;
  description?: string;
  gameCreationMode: GameCreationMode;
  typeId?: string;
  typeName?: string;
  categoryId?: string;
  categoryName?: string;
  visibility: GameVisibility;
  status: GameStatus;
  stats: {
    plays: number;
    likes: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// Public Asset Library Types
// ============================================

export type AssetType =
  | "sprite"
  | "tileset"
  | "background"
  | "ui"
  | "animation"
  | "sound"
  | "other";

export type AssetFormat = "png" | "gif" | "json" | "mp3";

export type ModerationStatus = "pending" | "approved" | "rejected";

export interface PublicAsset {
  // Identity
  id: string;

  // Content
  name: string;
  description: string;
  url: string;
  thumbnailUrl?: string;
  storagePath: string;

  // Metadata
  type: AssetType;
  tags: string[];
  width: number;
  height: number;
  fileSize: number;
  format: AssetFormat;

  // Creator
  creatorId: string;
  creatorName: string;
  isGenerated: boolean;
  generationPrompt?: string;

  // Stats (denormalized for fast queries)
  downloadCount: number;
  likeCount: number;
  useCount: number;

  // Discovery
  featured: boolean;
  trending: boolean;

  // Moderation
  status: ModerationStatus;
  moderatedAt?: Timestamp;
  moderatedBy?: string;

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AssetLike {
  userId: string;
  createdAt: Timestamp;
}

export interface AssetDownload {
  assetId: string;
  userId?: string;
  downloadedAt: Timestamp;
}

// ============================================
// Input types for creating/updating assets
// ============================================

export interface CreatePublicAssetInput {
  name: string;
  description: string;
  url: string;
  thumbnailUrl?: string;
  storagePath: string;
  type: AssetType;
  tags: string[];
  width: number;
  height: number;
  fileSize: number;
  format: AssetFormat;
  isGenerated: boolean;
  generationPrompt?: string;
}

export interface UpdatePublicAssetInput {
  name?: string;
  description?: string;
  tags?: string[];
  type?: AssetType;
}
