"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Share2,
  Copy,
  Check,
  Globe,
  Lock,
  Users,
  X,
  Loader2,
  UserPlus,
} from "lucide-react";
import { db, auth } from "@/lib/firebase";
import {
  doc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SharedUser {
  odbyUserId: string;
  username: string;
  avatarUrl?: string;
}

interface ShareDialogProps {
  gameId: string;
  gameTitle: string;
  visibility: "public" | "private";
  sharedWith?: SharedUser[];
  onVisibilityChange?: (visibility: "public" | "private") => void;
  trigger?: React.ReactNode;
}

export function ShareDialog({
  gameId,
  gameTitle,
  visibility,
  sharedWith = [],
  onVisibilityChange,
  trigger,
}: ShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(visibility === "public");
  const [copied, setCopied] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [friendSearch, setFriendSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SharedUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [currentSharedWith, setCurrentSharedWith] = useState<SharedUser[]>(sharedWith);

  // Generate public link
  const publicLink = typeof window !== "undefined"
    ? `${window.location.origin}/play/${gameId}`
    : "";

  // Sync state when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      // Sync state from props when opening
      setIsPublic(visibility === "public");
      setCurrentSharedWith(sharedWith);
    }
    setOpen(newOpen);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  const handleVisibilityToggle = async (checked: boolean) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    setUpdating(true);
    try {
      const newVisibility = checked ? "public" : "private";
      const gameDocRef = doc(db, "games", gameId);
      await updateDoc(gameDocRef, {
        visibility: newVisibility,
        updatedAt: serverTimestamp(),
      });
      setIsPublic(checked);
      onVisibilityChange?.(newVisibility);
    } catch (error) {
      console.error("Failed to update visibility:", error);
    } finally {
      setUpdating(false);
    }
  };

  const handleSearchFriends = async (searchTerm: string) => {
    setFriendSearch(searchTerm);

    if (searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) return;

    setSearching(true);
    try {
      // Search users by username (case-insensitive would require a different approach)
      const usersQuery = query(
        collection(db, "users"),
        where("username", ">=", searchTerm.toLowerCase()),
        where("username", "<=", searchTerm.toLowerCase() + "\uf8ff")
      );
      const snapshot = await getDocs(usersQuery);

      const results: SharedUser[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Don't include current user or already shared users
        if (
          doc.id !== currentUser.uid &&
          !currentSharedWith.some((u) => u.odbyUserId === doc.id)
        ) {
          results.push({
            odbyUserId: doc.id,
            username: data.username || data.email || "Unknown",
            avatarUrl: data.avatarUrl,
          });
        }
      });
      setSearchResults(results.slice(0, 5));
    } catch (error) {
      console.error("Failed to search users:", error);
    } finally {
      setSearching(false);
    }
  };

  const handleShareWithUser = async (user: SharedUser) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    setUpdating(true);
    try {
      const gameDocRef = doc(db, "games", gameId);
      await updateDoc(gameDocRef, {
        sharedWith: arrayUnion(user),
        sharedWithIds: arrayUnion(user.odbyUserId),
        updatedAt: serverTimestamp(),
      });
      setCurrentSharedWith([...currentSharedWith, user]);
      setFriendSearch("");
      setSearchResults([]);
    } catch (error) {
      console.error("Failed to share with user:", error);
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveShare = async (user: SharedUser) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    setUpdating(true);
    try {
      const gameDocRef = doc(db, "games", gameId);
      await updateDoc(gameDocRef, {
        sharedWith: arrayRemove(user),
        sharedWithIds: arrayRemove(user.odbyUserId),
        updatedAt: serverTimestamp(),
      });
      setCurrentSharedWith(currentSharedWith.filter((u) => u.odbyUserId !== user.odbyUserId));
    } catch (error) {
      console.error("Failed to remove share:", error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Share2 className="mr-2 h-4 w-4" /> Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] bg-neutral-950 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Game
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Share &quot;{gameTitle}&quot; with friends or make it public.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Public Access Toggle */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-center gap-3">
              {isPublic ? (
                <Globe className="h-5 w-5 text-green-500" />
              ) : (
                <Lock className="h-5 w-5 text-yellow-500" />
              )}
              <div>
                <p className="font-medium">
                  {isPublic ? "Public Access" : "Private"}
                </p>
                <p className="text-sm text-white/60">
                  {isPublic
                    ? "Anyone with the link can play"
                    : "Only you and shared users can access"}
                </p>
              </div>
            </div>
            <Switch
              checked={isPublic}
              onCheckedChange={handleVisibilityToggle}
              disabled={updating}
            />
          </div>

          {/* Public Link (shown when public) */}
          {isPublic && (
            <div className="space-y-2">
              <Label className="text-white/80">Public Link</Label>
              <div className="flex gap-2">
                <Input
                  value={publicLink}
                  readOnly
                  className="bg-neutral-900 border-white/10 text-white/80 flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Share with Friends */}
          <div className="space-y-3">
            <Label className="text-white/80 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Share with Friends
            </Label>

            {/* Search Input */}
            <div className="relative">
              <Input
                placeholder="Search by username..."
                value={friendSearch}
                onChange={(e) => handleSearchFriends(e.target.value)}
                className="bg-neutral-900 border-white/10"
              />
              {searching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-white/40" />
              )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="border border-white/10 rounded-lg overflow-hidden">
                {searchResults.map((user) => (
                  <button
                    key={user.odbyUserId}
                    onClick={() => handleShareWithUser(user)}
                    disabled={updating}
                    className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatarUrl} />
                      <AvatarFallback className="bg-white/10 text-white text-xs">
                        {user.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1">{user.username}</span>
                    <UserPlus className="h-4 w-4 text-white/40" />
                  </button>
                ))}
              </div>
            )}

            {/* Currently Shared With */}
            {currentSharedWith.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-white/40 uppercase tracking-wide">
                  Shared with {currentSharedWith.length} user{currentSharedWith.length > 1 ? "s" : ""}
                </p>
                <div className="space-y-1">
                  {currentSharedWith.map((user) => (
                    <div
                      key={user.odbyUserId}
                      className="flex items-center gap-3 p-2 bg-white/5 rounded-lg"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatarUrl} />
                        <AvatarFallback className="bg-white/10 text-white text-xs">
                          {user.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="flex-1 text-sm">{user.username}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-white/40 hover:text-red-400"
                        onClick={() => handleRemoveShare(user)}
                        disabled={updating}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
