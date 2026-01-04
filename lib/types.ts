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
  initialPrompt?: string; // User's initial game idea prompt (used for auto-start)
  gameContextSummary?: string; // AI-generated summary of current game features
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

// ============================================
// Chat Session Types
// ============================================

export interface ChatSession {
  id: string;
  gameId: string;
  ownerId: string;
  title: string;
  gameCreationMode: GameCreationMode;
  messageCount: number;
  lastMessageAt: Timestamp | null;
  workspaceSnapshot: string | null;
  codeSnapshot: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type ChatMessagePartType = "text" | "tool-invocation";

export interface ChatMessageTextPart {
  type: "text";
  text: string;
}

export interface ChatMessageToolPart {
  type: "tool-invocation";
  toolInvocationId: string;
  toolName: string;
  state: "input-available" | "output-available" | "input-streaming" | "approval-requested" | "approval-responded" | "output-error" | "output-denied";
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
}

export type ChatMessagePart = ChatMessageTextPart | ChatMessageToolPart;

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  parts: ChatMessagePart[];
  createdAt: Timestamp;
}

export interface CreateChatSessionInput {
  gameId: string;
  gameCreationMode: GameCreationMode;
}

export interface UpdateChatSessionInput {
  title?: string;
  workspaceSnapshot?: string;
  codeSnapshot?: string;
}

export interface AddChatMessageInput {
  role: "user" | "assistant";
  parts: ChatMessagePart[];
}

// Checkpoint for restoring code/workspace state
export interface ChatCheckpoint {
  id: string;
  sessionId: string;
  messageId: string; // The Firestore message ID (for historical messages)
  chatMessageId?: string; // The AI SDK message ID (for current session messages)
  label: string; // Auto-generated label like "Checkpoint 1" or from AI summary
  codeSnapshot: string | null; // For JS mode
  workspaceSnapshot: string | null; // For Blockly mode
  contextSummary: string | null; // AI-generated summary of game features at this checkpoint
  createdAt: Timestamp;
}
