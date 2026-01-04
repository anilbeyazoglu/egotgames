"use client";

import { Trash2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ChatSession } from "@/lib/types";
import { Timestamp } from "firebase/firestore";

interface ChatSessionItemProps {
  session: ChatSession;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

/**
 * Format a Firestore timestamp to a relative time string
 */
function formatRelativeTime(timestamp: Timestamp | null): string {
  if (!timestamp) return "";

  const date = timestamp.toDate();
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

export function ChatSessionItem({
  session,
  isActive,
  onSelect,
  onDelete,
}: ChatSessionItemProps) {
  return (
    <div
      className={`group flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors ${
        isActive
          ? "bg-purple-900/40 border border-purple-500/30"
          : "hover:bg-neutral-800/50"
      }`}
      onClick={onSelect}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <MessageSquare
            className={`size-3.5 shrink-0 ${
              isActive ? "text-purple-400" : "text-neutral-500"
            }`}
          />
          <span
            className={`text-sm truncate ${
              isActive ? "text-white font-medium" : "text-neutral-300"
            }`}
          >
            {session.title}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-neutral-500">
          <span>{session.messageCount} msgs</span>
          {session.lastMessageAt && (
            <>
              <span>·</span>
              <span>{formatRelativeTime(session.lastMessageAt)}</span>
            </>
          )}
        </div>
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 opacity-0 group-hover:opacity-100 transition-opacity text-neutral-500 hover:text-red-400 hover:bg-red-900/20"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Delete session</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
