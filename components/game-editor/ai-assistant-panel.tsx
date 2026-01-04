"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { ToolUIPart } from "ai";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  Tool,
  ToolHeader,
  ToolContent,
} from "@/components/ai-elements/tool";
import { Bot, Send, Sparkles, FileCode, Eye, Replace, PlusCircle, Code } from "lucide-react";
import { useEditor } from "./editor-context";
import { useRef, useEffect, FormEvent, KeyboardEvent, useState, useMemo, useCallback } from "react";
import { useChatSessions, useChatSession } from "@/hooks/use-chat-sessions";
import { ChatSessionPopover } from "./chat-session-popover";
import { CheckpointItem } from "./checkpoint-item";
import { db, storage } from "@/lib/firebase";
import { doc, updateDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { ref, uploadString } from "firebase/storage";
import type { ChatMessagePart, ChatMessageToolPart, ChatCheckpoint } from "@/lib/types";

interface AIAssistantPanelProps {
  gameId: string;
  initialPrompt?: string;
  autostart?: boolean;
}

// Type for message parts (AI SDK uses toolCallId in stream, toolInvocationId in parts)
interface MessagePart {
  type: string;
  text?: string;
  toolInvocationId?: string;
  toolCallId?: string;
  toolName?: string;
  input?: Record<string, unknown>;
  args?: Record<string, unknown>;
  output?: unknown;
  result?: unknown;
  state?: ToolUIPart["state"];
}

// Helper to extract newWorkspace from tool results in message parts
// Returns the LAST newWorkspace found (for agentic loops with multiple tool calls)
function extractNewWorkspaceFromParts(parts: MessagePart[]): string | null {
  let lastWorkspace: string | null = null;
  for (const part of parts) {
    // Check for tool type (AI SDK uses "tool-{toolName}" format)
    if (isToolInvocation(part)) {
      const toolOutput = (part.output || part.result) as { newWorkspace?: string } | undefined;
      if (toolOutput?.newWorkspace) {
        lastWorkspace = toolOutput.newWorkspace;
      }
    }
  }
  return lastWorkspace;
}

// Check if a part is any tool invocation
function isToolInvocation(part: MessagePart): boolean {
  // AI SDK uses "tool-{toolName}" format, stored format uses "tool-invocation"
  return part.type.startsWith("tool-") || part.type === "tool-invocation";
}

// Check if a part is a Blockly tool invocation
function isBlocklyToolInvocation(part: MessagePart): boolean {
  return part.type === "tool-str_replace_based_edit_tool" ||
         (part.type === "tool-invocation" && part.toolName === "str_replace_based_edit_tool") ||
         part.toolName === "str_replace_based_edit_tool";
}

// Check if a part is a JS code tool invocation
function isJSToolInvocation(part: MessagePart): boolean {
  return part.type === "tool-js_code_editor" ||
         (part.type === "tool-invocation" && part.toolName === "js_code_editor") ||
         part.toolName === "js_code_editor";
}

// Extract newCode from JS tool results
// Returns the LAST newCode found (for agentic loops with multiple tool calls)
function extractNewCodeFromParts(parts: MessagePart[]): string | null {
  let lastCode: string | null = null;
  for (const part of parts) {
    if (isJSToolInvocation(part)) {
      const toolOutput = (part.output || part.result) as { newCode?: string } | undefined;
      if (toolOutput?.newCode) {
        lastCode = toolOutput.newCode;
      }
    }
  }
  return lastCode;
}

// Get input from tool part (handles both input and args properties)
function getToolInput(part: MessagePart): Record<string, unknown> | undefined {
  return part.input || part.args;
}

// Get output from tool part (handles both output and result properties)
function getToolOutput(part: MessagePart): { success?: boolean; message?: string; error?: string; newWorkspace?: string; newCode?: string } | undefined {
  return (part.output || part.result) as { success?: boolean; message?: string; error?: string; newWorkspace?: string; newCode?: string } | undefined;
}

// Get friendly tool title based on command and tool type
function getToolTitle(part: MessagePart, input: Record<string, unknown> | undefined): string {
  const command = input?.command as string | undefined;

  // JavaScript mode tool (check by toolName OR by JS-specific commands)
  const isJSTool = isJSToolInvocation(part) || command === "replace" || command === "patch";
  if (isJSTool) {
    switch (command) {
      case "view":
        return "Viewing Code";
      case "replace":
        return "Writing Code";
      case "patch":
        return "Editing Code";
      default:
        return "Code Editor";
    }
  }

  // Blockly mode tool (check by toolName OR by Blockly-specific commands)
  const isBlocklyTool = isBlocklyToolInvocation(part) || command === "create" || command === "str_replace";
  if (isBlocklyTool) {
    switch (command) {
      case "view":
        return "Viewing Workspace";
      case "create":
        return "Creating Blocks";
      case "str_replace":
        return "Editing Blocks";
      default:
        return "Block Editor";
    }
  }

  // Fallback: infer from command if available
  if (command === "view") return "Viewing";
  if (command) return `Running ${command}`;

  return "Editor";
}

// Get tool icon based on command and tool type
function getToolIcon(part: MessagePart, input: Record<string, unknown> | undefined) {
  const command = input?.command as string | undefined;

  // JavaScript mode tool (check by toolName OR by JS-specific commands)
  const isJSTool = isJSToolInvocation(part) || command === "replace" || command === "patch";
  if (isJSTool) {
    switch (command) {
      case "view":
        return <Eye className="size-4 text-blue-400" />;
      case "replace":
        return <Code className="size-4 text-green-400" />;
      case "patch":
        return <Replace className="size-4 text-yellow-400" />;
      default:
        return <Code className="size-4" />;
    }
  }

  // Blockly mode tool (check by toolName OR by Blockly-specific commands)
  const isBlocklyTool = isBlocklyToolInvocation(part) || command === "create" || command === "str_replace";
  if (isBlocklyTool) {
    switch (command) {
      case "view":
        return <Eye className="size-4 text-blue-400" />;
      case "create":
        return <PlusCircle className="size-4 text-green-400" />;
      case "str_replace":
        return <Replace className="size-4 text-yellow-400" />;
      default:
        return <FileCode className="size-4" />;
    }
  }

  // Fallback based on command
  if (command === "view") return <Eye className="size-4 text-blue-400" />;

  return <FileCode className="size-4" />;
}

// Convert ChatMessagePart to MessagePart format for rendering
function convertToMessagePart(part: ChatMessagePart): MessagePart {
  if (part.type === "text") {
    return { type: "text", text: part.text };
  }
  return {
    type: "tool-invocation",
    toolInvocationId: part.toolInvocationId,
    toolName: part.toolName,
    state: part.state,
    input: part.input,
    output: part.output,
  };
}

export function AIAssistantPanel({ gameId, initialPrompt, autostart }: AIAssistantPanelProps) {
  const { loadAIWorkspace, loadAICode, workspace, code, gameCreationMode } = useEditor();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [gameContextSummary, setGameContextSummary] = useState<string | null>(null);
  const pendingUserMessageRef = useRef<string | null>(null);
  const autostartTriggeredRef = useRef(false);

  // Listen to game's context summary
  useEffect(() => {
    const gameRef = doc(db, "games", gameId);
    const unsubscribe = onSnapshot(gameRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setGameContextSummary(data.gameContextSummary || null);
      }
    });
    return () => unsubscribe();
  }, [gameId]);

  // Session management hooks
  const {
    sessions,
    loading: sessionsLoading,
    createSession,
    deleteSession,
  } = useChatSessions(gameId);

  const {
    session: currentSession,
    messages: sessionMessages,
    checkpoints,
    addMessage,
    updateSession,
    generateTitle,
    createCheckpoint,
    updateCheckpointSummary,
    deleteCheckpoint,
    archiveAfterCheckpoint,
  } = useChatSession(currentSessionId);

  // Select API endpoint based on creation mode
  const apiEndpoint = gameCreationMode === "javascript"
    ? "/api/ai/js-chat"
    : "/api/ai/chat";

  // Create transport with dynamic API endpoint
  const transport = useMemo(
    () => new DefaultChatTransport({ api: apiEndpoint }),
    [apiEndpoint]
  );

  // Stable chat ID - don't include sessionId to prevent reset when session is created
  const chatId = `game-editor-${gameId}-${gameCreationMode}`;

  const { messages: chatMessages, sendMessage, status, error } = useChat({
    id: chatId,
    transport,
    onFinish: async ({ message }) => {
      const parts = message.parts as MessagePart[];

      // Track if code was modified
      let codeWasModified = false;
      let newCodeSnapshot: string | null = null;
      let newWorkspaceSnapshot: string | null = null;

      if (gameCreationMode === "javascript") {
        // JavaScript mode: extract code from js_code_editor tool
        const newCode = extractNewCodeFromParts(parts);
        if (newCode) {
          loadAICode(newCode);
          codeWasModified = true;
          newCodeSnapshot = newCode;
        }
      } else {
        // Blockly mode: extract workspace from str_replace_based_edit_tool
        const newWorkspace = extractNewWorkspaceFromParts(parts);
        if (newWorkspace) {
          loadAIWorkspace(newWorkspace);
          codeWasModified = true;
          newWorkspaceSnapshot = newWorkspace;
        }
      }

      // Persist messages to session
      if (currentSessionId) {
        // Persist user message first (if we have it)
        if (pendingUserMessageRef.current) {
          await addMessage("user", [{ type: "text", text: pendingUserMessageRef.current }]);
        }

        // Persist assistant message
        const chatParts: ChatMessagePart[] = parts.map((p) => {
          if (p.type === "text" && p.text) {
            return { type: "text" as const, text: p.text };
          }
          if (isToolInvocation(p)) {
            return {
              type: "tool-invocation" as const,
              toolInvocationId: p.toolInvocationId || p.toolCallId || "",
              toolName: p.toolName || "",
              state: (p.state || "output-available") as ChatMessageToolPart["state"],
              input: getToolInput(p),
              output: getToolOutput(p),
            };
          }
          return { type: "text" as const, text: "" };
        }).filter((p) => p.type === "text" ? p.text : true);

        const savedMessage = await addMessage("assistant", chatParts);

        // Create checkpoint if code was modified
        if (codeWasModified && savedMessage) {
          const checkpoint = await createCheckpoint(
            savedMessage.id,
            message.id, // AI SDK message ID for matching current messages
            newCodeSnapshot,
            newWorkspaceSnapshot
          );

          // Auto-save game code when checkpoint is created
          try {
            const gameFolder = `games/${gameId}`;
            if (gameCreationMode === "javascript" && newCodeSnapshot) {
              const codeRef = ref(storage, `${gameFolder}/sketch.js`);
              await uploadString(codeRef, newCodeSnapshot, "raw", {
                contentType: "application/javascript",
              });
            } else if (gameCreationMode === "blockly" && newWorkspaceSnapshot) {
              const blocksRef = ref(storage, `${gameFolder}/workspace.json`);
              await uploadString(blocksRef, newWorkspaceSnapshot, "raw", {
                contentType: "application/json",
              });
            }
            // Update game timestamp
            const gameDocRef = doc(db, "games", gameId);
            await updateDoc(gameDocRef, { updatedAt: serverTimestamp() });
            console.log("[Checkpoint] Auto-saved game code");
          } catch (saveError) {
            console.error("[Checkpoint] Failed to auto-save game:", saveError);
          }

          // Generate context summary asynchronously (don't await to not block UI)
          if (checkpoint) {
            generateContextSummary(
              checkpoint.id,
              newCodeSnapshot,
              newWorkspaceSnapshot
            );
          }
        }

        // Update snapshot
        if (gameCreationMode === "javascript") {
          await updateSession({ codeSnapshot: code });
        } else {
          await updateSession({ workspaceSnapshot: JSON.stringify(workspace.blocks) });
        }

        // Generate title if this is the first exchange
        if (currentSession?.messageCount === 0 && pendingUserMessageRef.current) {
          await generateTitle(pendingUserMessageRef.current, gameCreationMode);
        }

        // Clear pending user message
        pendingUserMessageRef.current = null;
      }
    },
  });

  // Display messages: use chatMessages for current conversation, sessionMessages for history
  const allMessages = useMemo(() => {
    // If there are active chat messages, show those (current conversation)
    if (chatMessages.length > 0) {
      return chatMessages.map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        parts: msg.parts as MessagePart[],
        isHistorical: false,
      }));
    }

    // Otherwise show historical messages from Firestore
    return sessionMessages.map((msg) => ({
      id: msg.id,
      role: msg.role as "user" | "assistant",
      parts: msg.parts.map(convertToMessagePart),
      isHistorical: true,
    }));
  }, [sessionMessages, chatMessages]);

  // Handle new session creation
  const handleNewSession = useCallback(async () => {
    const newSession = await createSession(gameCreationMode);
    if (newSession) {
      setCurrentSessionId(newSession.id);
    }
  }, [createSession, gameCreationMode]);

  // Handle session selection
  const handleSelectSession = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId);
  }, []);

  // Handle session deletion
  const handleDeleteSession = useCallback(async (sessionId: string) => {
    const success = await deleteSession(sessionId);
    if (success && currentSessionId === sessionId) {
      setCurrentSessionId(null);
    }
  }, [deleteSession, currentSessionId]);

  // Handle checkpoint restoration
  const handleRestoreCheckpoint = useCallback(async (checkpoint: ChatCheckpoint) => {
    // Restore code/workspace
    if (gameCreationMode === "javascript" && checkpoint.codeSnapshot) {
      loadAICode(checkpoint.codeSnapshot);
    } else if (gameCreationMode === "blockly" && checkpoint.workspaceSnapshot) {
      loadAIWorkspace(checkpoint.workspaceSnapshot);
    }

    // Restore context summary to game
    if (checkpoint.contextSummary) {
      try {
        const gameRef = doc(db, "games", gameId);
        await updateDoc(gameRef, { gameContextSummary: checkpoint.contextSummary });
      } catch (err) {
        console.error("Error restoring context summary:", err);
      }
    }

    // Archive messages and checkpoints after this one
    await archiveAfterCheckpoint(checkpoint);
  }, [gameId, gameCreationMode, loadAICode, loadAIWorkspace, archiveAfterCheckpoint]);

  // Handle checkpoint deletion
  const handleDeleteCheckpoint = useCallback(async (checkpointId: string) => {
    await deleteCheckpoint(checkpointId);
  }, [deleteCheckpoint]);

  // Generate context summary for a checkpoint and update game
  const generateContextSummary = useCallback(async (
    checkpointId: string,
    codeSnapshot: string | null,
    workspaceSnapshot: string | null
  ) => {
    try {
      const response = await fetch(`/api/games/${gameId}/summarize-context`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: codeSnapshot,
          workspace: workspaceSnapshot,
          gameCreationMode,
        }),
      });

      if (!response.ok) {
        console.error("Failed to generate context summary");
        return;
      }

      const { summary } = await response.json();

      if (summary) {
        // Update checkpoint with summary
        await updateCheckpointSummary(checkpointId, summary);

        // Update game's context summary
        const gameRef = doc(db, "games", gameId);
        await updateDoc(gameRef, { gameContextSummary: summary });
      }
    } catch (err) {
      console.error("Error generating context summary:", err);
    }
  }, [gameId, gameCreationMode, updateCheckpointSummary]);

  // Create a map of messageId to checkpoint for display
  // Maps both Firestore ID and AI SDK chat message ID to the same checkpoint
  const checkpointsByMessageId = useMemo(() => {
    const map = new Map<string, ChatCheckpoint>();
    for (const checkpoint of checkpoints) {
      // Map by Firestore message ID (for historical messages)
      map.set(checkpoint.messageId, checkpoint);
      // Also map by AI SDK message ID (for current session messages)
      if (checkpoint.chatMessageId) {
        map.set(checkpoint.chatMessageId, checkpoint);
      }
    }
    return map;
  }, [checkpoints]);

  // Render a single message part
  const renderMessagePart = (part: MessagePart, index: number) => {
    // Text content
    if (part.type === "text" && part.text) {
      return (
        <MessageResponse key={index} className="text-sm whitespace-pre-wrap">
          {part.text}
        </MessageResponse>
      );
    }

    // Tool invocation
    if (isToolInvocation(part)) {
      const input = getToolInput(part);
      const output = getToolOutput(part);
      const partKey = part.toolInvocationId || part.toolCallId || index;

      return (
        <Tool key={partKey} className="my-2 border-white/10 bg-neutral-900/50">
          <ToolHeader
            title={getToolTitle(part, input)}
            type="tool-invocation"
            state={part.state || "input-available"}
          />
          <ToolContent className="border-t border-white/10">
            {input && (
              <div className="p-3 space-y-2">
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  {getToolIcon(part, input)}
                  <span className="font-medium">{input.command as string}</span>
                  <span className="text-neutral-500">→</span>
                  <span className="text-neutral-300">{input.path as string}</span>
                </div>
                {input.command === "create" && (
                  <div className="text-xs text-green-400">Creating new workspace with blocks...</div>
                )}
                {input.command === "str_replace" && (
                  <div className="text-xs text-yellow-400">Modifying existing blocks...</div>
                )}
                {input.command === "replace" && (
                  <div className="text-xs text-green-400">Writing new code...</div>
                )}
                {input.command === "patch" && (
                  <div className="text-xs text-yellow-400">Editing existing code...</div>
                )}
              </div>
            )}
            {output && (
              <div className={`p-3 border-t border-white/10 text-xs ${output.success ? 'text-green-400' : 'text-red-400'}`}>
                {output.success ? '✓ ' : '✗ '}
                {output.message || output.error || 'Operation completed'}
              </div>
            )}
          </ToolContent>
        </Tool>
      );
    }

    return null;
  };

  // Send current workspace/code with each message based on mode
  const handleSendMessage = useCallback(async (text: string) => {
    // Create session if none exists
    let sessionId = currentSessionId;
    if (!sessionId) {
      const newSession = await createSession(gameCreationMode);
      if (newSession) {
        sessionId = newSession.id;
        setCurrentSessionId(sessionId);
      } else {
        console.error("Failed to create session!");
        return;
      }
    }

    // Store user message text for persistence in onFinish
    pendingUserMessageRef.current = text;

    const body = gameCreationMode === "javascript"
      ? { currentCode: code, gameContextSummary }
      : { currentWorkspace: workspace.blocks, gameContextSummary };

    sendMessage(
      { parts: [{ type: "text", text }] },
      { body }
    );
  }, [currentSessionId, createSession, gameCreationMode, code, gameContextSummary, workspace.blocks, sendMessage]);

  // Auto-load newest session on mount (if sessions exist)
  const sessionLoadedRef = useRef(false);

  useEffect(() => {
    if (!sessionsLoading && !sessionLoadedRef.current && sessions.length > 0) {
      sessionLoadedRef.current = true;
      // Load the newest session (sessions are sorted by createdAt desc)
      const newestSession = sessions[0];
      setCurrentSessionId(newestSession.id);
      console.log("[Session] Loaded existing session:", newestSession.id);
    }
  }, [sessionsLoading, sessions]);

  // Auto-start: set input and trigger submit when autostart flag is true
  // Only if there are no existing sessions (first time creating the game)
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    // Only trigger once, when all conditions are met AND no existing sessions
    if (
      autostart &&
      initialPrompt &&
      !autostartTriggeredRef.current &&
      !sessionsLoading &&
      sessions.length === 0 && // Only auto-start if no sessions exist
      (status === "ready" || status === undefined)
    ) {
      console.log("[AutoStart] No existing sessions, setting input and triggering submit");
      autostartTriggeredRef.current = true;

      // Set the input value and trigger form submit
      setInput(initialPrompt);

      // Small delay to ensure input state is set before submitting
      setTimeout(() => {
        formRef.current?.requestSubmit();
      }, 100);
    }
  }, [autostart, initialPrompt, sessionsLoading, sessions.length, status]);

  const isLoading = status === "streaming" || status === "submitted";

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      handleSendMessage(input);
      setInput("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        handleSendMessage(input);
        setInput("");
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        150
      )}px`;
    }
  }, [input]);

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col bg-neutral-950 border-r border-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
          <Bot className="size-5 text-purple-400" />
          <span className="font-semibold text-sm">Egot AI Assistant</span>
          <Sparkles className="size-3 text-yellow-400" />
          <div className="flex-1" />
          <ChatSessionPopover
            sessions={sessions}
            currentSessionId={currentSessionId}
            loading={sessionsLoading}
            onSelectSession={handleSelectSession}
            onNewSession={handleNewSession}
            onDeleteSession={handleDeleteSession}
          />
        </div>

        {/* Messages */}
        <Conversation className="flex-1 min-h-0">
          {allMessages.length === 0 ? (
            <ConversationEmptyState
              icon={<Bot className="size-12 text-purple-400/50" />}
              title="Start building your game!"
              description={gameCreationMode === "javascript"
                ? "Describe what you want to create and I'll generate p5.js code for you."
                : "Describe what you want to create and I'll generate Blockly blocks for you."
              }
            />
          ) : (
            <ConversationContent>
              {allMessages.map((message, index) => {
                const checkpoint = checkpointsByMessageId.get(message.id);
                return (
                  <div key={message.id || index}>
                    <Message
                      from={message.role}
                      className={
                        message.role === "assistant"
                          ? "bg-neutral-900/50"
                          : "bg-purple-900/20"
                      }
                    >
                      <MessageContent>
                        {message.parts.map((part, partIndex) =>
                          renderMessagePart(part, partIndex)
                        )}
                      </MessageContent>
                    </Message>
                    {checkpoint && (
                      <CheckpointItem
                        checkpoint={checkpoint}
                        onRestore={handleRestoreCheckpoint}
                        onDelete={handleDeleteCheckpoint}
                      />
                    )}
                  </div>
                );
              })}
              {isLoading && allMessages[allMessages.length - 1]?.role === "user" && (
                <Message from="assistant" className="bg-neutral-900/50">
                  <MessageContent>
                    <div className="flex items-center gap-2 text-sm text-neutral-400">
                      <div className="animate-pulse">
                        {gameCreationMode === "javascript" ? "Generating code..." : "Generating blocks..."}
                      </div>
                    </div>
                  </MessageContent>
                </Message>
              )}
            </ConversationContent>
          )}
          <ConversationScrollButton />
        </Conversation>

        {/* Error display */}
        {error && (
          <div className="px-4 py-2 bg-red-900/20 border-t border-red-500/30 text-red-400 text-xs">
            Error: {error.message}
          </div>
        )}

        {/* Input */}
        <form ref={formRef} onSubmit={onSubmit} className="p-3 border-t border-white/10">
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Describe what you want to build..."
              className="flex-1 min-h-[40px] max-h-[150px] resize-none bg-neutral-900 border-white/10 text-sm"
              disabled={isLoading}
              rows={1}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading}
              className="shrink-0 bg-purple-600 hover:bg-purple-700"
            >
              <Send className="size-4" />
            </Button>
          </div>
          <p className="text-[10px] text-neutral-500 mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </form>
      </div>
    </TooltipProvider>
  );
}
