"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { ToolUIPart } from "ai";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { Bot, Send, Sparkles, FileCode, Eye, Replace, PlusCircle, Code } from "lucide-react";
import { useEditor } from "./editor-context";
import { useRef, useEffect, FormEvent, KeyboardEvent, useState, useMemo } from "react";

interface AIAssistantPanelProps {
  gameId: string;
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
function extractNewWorkspaceFromParts(parts: MessagePart[]): string | null {
  for (const part of parts) {
    // Check for tool type (AI SDK uses "tool-{toolName}" format)
    if (isToolInvocation(part)) {
      const toolOutput = (part.output || part.result) as { newWorkspace?: string } | undefined;
      if (toolOutput?.newWorkspace) {
        return toolOutput.newWorkspace;
      }
    }
  }
  return null;
}

// Check if a part is a Blockly tool invocation
function isBlocklyToolInvocation(part: MessagePart): boolean {
  return part.type === "tool-str_replace_based_edit_tool" ||
         (part.type === "tool-invocation" && part.toolName === "str_replace_based_edit_tool");
}

// Check if a part is a JS code tool invocation
function isJSToolInvocation(part: MessagePart): boolean {
  return part.type === "tool-js_code_editor" ||
         (part.type === "tool-invocation" && part.toolName === "js_code_editor");
}

// Check if a part is any tool invocation
function isToolInvocation(part: MessagePart): boolean {
  return isBlocklyToolInvocation(part) || isJSToolInvocation(part);
}

// Extract newCode from JS tool results
function extractNewCodeFromParts(parts: MessagePart[]): string | null {
  for (const part of parts) {
    if (isJSToolInvocation(part)) {
      const toolOutput = (part.output || part.result) as { newCode?: string } | undefined;
      if (toolOutput?.newCode) {
        return toolOutput.newCode;
      }
    }
  }
  return null;
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
  if (!input) return "Editor";
  const command = input.command as string;

  // JavaScript mode tool
  if (isJSToolInvocation(part)) {
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

  // Blockly mode tool
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

// Get tool icon based on command and tool type
function getToolIcon(part: MessagePart, input: Record<string, unknown> | undefined) {
  if (!input) return <FileCode className="size-4" />;
  const command = input.command as string;

  // JavaScript mode tool
  if (isJSToolInvocation(part)) {
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

  // Blockly mode tool
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

export function AIAssistantPanel({ gameId }: AIAssistantPanelProps) {
  const { loadAIWorkspace, loadAICode, workspace, code, gameCreationMode } = useEditor();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState("");

  // Select API endpoint based on creation mode
  const apiEndpoint = gameCreationMode === "javascript"
    ? "/api/ai/js-chat"
    : "/api/ai/chat";

  // Create transport with dynamic API endpoint
  const transport = useMemo(
    () => new DefaultChatTransport({ api: apiEndpoint }),
    [apiEndpoint]
  );

  const { messages, sendMessage, status, error } = useChat({
    id: `game-editor-${gameId}-${gameCreationMode}`,
    transport,
    onFinish: ({ message }) => {
      const parts = message.parts as MessagePart[];

      if (gameCreationMode === "javascript") {
        // JavaScript mode: extract code from js_code_editor tool
        const newCode = extractNewCodeFromParts(parts);
        if (newCode) {
          loadAICode(newCode);
        }
      } else {
        // Blockly mode: extract workspace from str_replace_based_edit_tool
        const newWorkspace = extractNewWorkspaceFromParts(parts);
        if (newWorkspace) {
          loadAIWorkspace(newWorkspace);
        }
      }
    },
  });

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
  const handleSendMessage = (text: string) => {
    const body = gameCreationMode === "javascript"
      ? { currentCode: code }
      : { currentWorkspace: workspace.blocks };

    sendMessage(
      { parts: [{ type: "text", text }] },
      { body }
    );
  };

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
    <div className="h-full flex flex-col bg-neutral-950 border-r border-white/10">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
        <Bot className="size-5 text-purple-400" />
        <span className="font-semibold text-sm">Egot AI Assistant</span>
        <Sparkles className="size-3 text-yellow-400" />
      </div>

      {/* Messages */}
      <Conversation className="flex-1">
        {messages.length === 0 ? (
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
            {messages.map((message, index) => (
              <Message
                key={message.id || index}
                from={message.role}
                className={
                  message.role === "assistant"
                    ? "bg-neutral-900/50"
                    : "bg-purple-900/20"
                }
              >
                <MessageContent>
                  {(message.parts as MessagePart[]).map((part, partIndex) =>
                    renderMessagePart(part, partIndex)
                  )}
                </MessageContent>
              </Message>
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
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
      <form onSubmit={onSubmit} className="p-3 border-t border-white/10">
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
  );
}
