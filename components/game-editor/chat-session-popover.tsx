"use client";

import { useState, useMemo } from "react";
import { History, Plus, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChatSessionItem } from "./chat-session-item";
import type { ChatSession } from "@/lib/types";

interface ChatSessionPopoverProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  loading: boolean;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
  onDeleteSession: (sessionId: string) => void;
}

export function ChatSessionPopover({
  sessions,
  currentSessionId,
  loading,
  onSelectSession,
  onNewSession,
  onDeleteSession,
}: ChatSessionPopoverProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter sessions by search query
  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const query = searchQuery.toLowerCase();
    return sessions.filter((session) =>
      session.title.toLowerCase().includes(query)
    );
  }, [sessions, searchQuery]);

  const handleSelectSession = (sessionId: string) => {
    onSelectSession(sessionId);
    setOpen(false);
  };

  const handleNewSession = () => {
    onNewSession();
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-neutral-400 hover:text-white hover:bg-white/10"
            >
              <History className="size-4" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Chat history</p>
        </TooltipContent>
      </Tooltip>

      <DropdownMenuContent
        align="end"
        className="w-72 bg-neutral-900 border-white/10"
      >
        {/* Search */}
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-neutral-500" />
            <Input
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-sm bg-neutral-800 border-white/10"
            />
          </div>
        </div>

        <DropdownMenuSeparator className="bg-white/10" />

        {/* New Chat Button */}
        <div className="p-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 border-dashed border-white/20 text-neutral-300 hover:text-white hover:bg-white/5"
            onClick={handleNewSession}
          >
            <Plus className="size-4" />
            New Chat
          </Button>
        </div>

        <DropdownMenuSeparator className="bg-white/10" />

        {/* Session List */}
        <ScrollArea className="max-h-64">
          <div className="p-2 space-y-1">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-5 animate-spin text-neutral-500" />
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="text-center py-6 text-sm text-neutral-500">
                {searchQuery ? "No sessions found" : "No chat history yet"}
              </div>
            ) : (
              filteredSessions.map((session) => (
                <ChatSessionItem
                  key={session.id}
                  session={session}
                  isActive={session.id === currentSessionId}
                  onSelect={() => handleSelectSession(session.id)}
                  onDelete={() => onDeleteSession(session.id)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
