# Database Structure Design

This document outlines the Firestore database structure for the EgotGames platform.

## Collections

### 1. `users`

Stores user profile, account information, and credit balance.

- **Document ID**: `uid` (from Firebase Auth)
- **Fields**:
  - `username` (string): Unique handle.
  - `displayName` (string): Public display name.
  - `email` (string): User email.
  - `photoURL` (string): Avatar URL.
  - `credits` (number): Current available AI credits.
  - `roles` (array<string>): `['user', 'admin']`.
  - `createdAt` (timestamp).
  - `updatedAt` (timestamp).

### 2. `games`

Stores game projects.

- **Document ID**: Auto-generated
- **Fields**:
  - `ownerId` (string): Creator `uid`.
  - `title` (string).
  - `slug` (string).
  - `description` (string).
  - `gameCreationMode` (string): 'blockly' | 'javascript'. Determines the editor experience.
  - `typeId` (string): Reference to `game_types` document.
  - `typeName` (string): Denormalized type name (e.g., "Retro 2D Pixel Art").
  - `categoryId` (string): Reference to `game_categories`.
  - `categoryName` (string): Denormalized category (e.g., "Action/Adventure").
  - `visibility` (string): 'public' | 'private'.
  - `status` (string): 'draft' | 'published'.
  - `stats` (map):
    - `plays` (number).
    - `likes` (number).
  - `createdAt` (timestamp).
  - `updatedAt` (timestamp).

### 3. `game_levels`

Stores level configurations for games.

- **Document ID**: Auto-generated
- **Fields**:
  - `gameId` (string): Parent game ID.
  - `order` (number): Level sequence (1, 2, 3...).
  - `name` (string): e.g., "Level 1 - The Beginning".
  - `data` (map/json): The actual level layout, entity positions, scripts, etc.
  - `config` (map): Specific overrides (time limit, difficulty).
  - `createdAt` (timestamp).

### 4. `game_rankings` (Leaderboards)

Stores high scores and user rankings per game.

- **Document ID**: Auto-generated
- **Fields**:
  - `gameId` (string): The game.
  - `userId` (string): The player.
  - `userDisplayName` (string): Cached for display.
  - `score` (number): The score achieved.
  - `levelId` (string, optional): If tracking per level.
  - `achievedAt` (timestamp).
  - _Indexes_: Complex index on `gameId` + `score` (desc).

### 5. `game_categories`

Broad classifications for games.

- **Document ID**: Auto-generated (or explicit slug)
- **Fields**:
  - `name` (string): e.g., "Action/Adventure".
  - `slug` (string): e.g., "action-adventure".
  - `description` (string).
  - `isActive` (boolean).

### 6. `game_types`

Specific templates or styles within categories.

- **Document ID**: Auto-generated
- **Fields**:
  - `categoryId` (string): References `game_categories`.
  - `name` (string): e.g., "Retro 2D Pixel Art".
  - `slug` (string): e.g., "retro-2d-pixel".
  - `baseConfig` (map): Default engine settings for this type.
  - `isActive` (boolean).

### 7. `assets`

Stores game assets (sprites, sounds, tilesets).

- **Document ID**: Auto-generated
- **Fields**:
  - `ownerId` (string).
  - `gameId` (string, optional).
  - `type` (string).
  - `url` (string).
  - `isGenerated` (boolean).
  - `cost` (number): Credits used to generate (audit).
  - `createdAt` (timestamp).

### 8. `publicAssets`

Free public asset library. Assets shared by users for the community.

- **Document ID**: Auto-generated
- **Fields**:
  - `name` (string): Asset display name.
  - `description` (string): Asset description.
  - `url` (string): Firebase Storage download URL.
  - `thumbnailUrl` (string, optional): Smaller preview image.
  - `storagePath` (string): Path in Firebase Storage.
  - `type` (string): 'sprite' | 'tileset' | 'background' | 'ui' | 'animation' | 'sound' | 'other'.
  - `tags` (array<string>): Searchable tags.
  - `width` (number): Image width in pixels.
  - `height` (number): Image height in pixels.
  - `fileSize` (number): File size in bytes.
  - `format` (string): 'png' | 'gif' | 'json' | 'mp3'.
  - `creatorId` (string): User ID of creator.
  - `creatorName` (string): Denormalized creator display name.
  - `isGenerated` (boolean): True if AI-generated.
  - `generationPrompt` (string, optional): Original AI prompt.
  - `downloadCount` (number): Total downloads.
  - `likeCount` (number): Total likes.
  - `useCount` (number): Games using this asset.
  - `featured` (boolean): Staff pick.
  - `trending` (boolean): Algorithm-set trending flag.
  - `status` (string): 'pending' | 'approved' | 'rejected'.
  - `moderatedAt` (timestamp, optional): When moderated.
  - `moderatedBy` (string, optional): Admin who moderated.
  - `createdAt` (timestamp).
  - `updatedAt` (timestamp).
- **Subcollections**:
  - `likes/{userId}`: Tracks which users liked the asset.

### 9. `publicAssetDownloads`

Analytics for public asset downloads.

- **Document ID**: Auto-generated
- **Fields**:
  - `assetId` (string): The downloaded asset.
  - `userId` (string, optional): User who downloaded (null if anonymous).
  - `downloadedAt` (timestamp).

## Credit System Tables

### 10. `credit_packages`

Catalog of purchasable credit bundles.

- **Document ID**: Auto-generated
- **Fields**:
  - `name` (string): e.g., "Starter Pack".
  - `credits` (number): 100.
  - `price` (number): 9.99.
  - `currency` (string): "USD".
  - `isActive` (boolean).

### 11. `payments`

Record of real-money transactions.

- **Document ID**: Auto-generated (or Stripe/Provider ID)
- **Fields**:
  - `userId` (string).
  - `packageId` (string).
  - `amount` (number).
  - `currency` (string).
  - `status` (string): 'succeeded' | 'pending' | 'failed'.
  - `provider` (string): 'stripe', 'paypal', etc.
  - `providerRef` (string): External transaction ID.
  - `createdAt` (timestamp).

### 12. `credit_transactions`

Ledger for all credit movements (purchases and usage).

- **Document ID**: Auto-generated
- **Fields**:
  - `userId` (string).
  - `amount` (number): Positive for purchase, negative for usage.
  - `type` (string): 'purchase' | 'generation' | 'bonus' | 'refund'.
  - `referenceId` (string): ID of `payments` (if purchase) or `generations` (if usage).
  - `description` (string): e.g., "Purchased Starter Pack", "Generated Dragon Sprite".
  - `balanceAfter` (number): Snapshot of balance for easy audit.
  - `createdAt` (timestamp).
