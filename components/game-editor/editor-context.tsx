"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import type { EditorTab, GameState, BlocklyWorkspace } from "./types";
import type { GameCreationMode } from "@/lib/types";

interface EditorContextType {
  // Game info
  gameId: string;
  gameName: string;

  // Game creation mode
  gameCreationMode: GameCreationMode;

  // Workspace state
  workspace: BlocklyWorkspace;
  setWorkspace: (workspace: BlocklyWorkspace) => void;
  updateGeneratedCode: (code: string) => void;

  // AI workspace loading (Blockly mode)
  pendingAIWorkspace: string | null;
  loadAIWorkspace: (workspaceJson: string) => void;
  clearPendingAIWorkspace: () => void;

  // AI code loading (JavaScript mode)
  loadAICode: (code: string) => void;

  // Tab management
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  tabs: EditorTab[];

  // Game state
  gameState: GameState;
  playGame: () => void;
  pauseGame: () => void;
  stopGame: () => void;
  addConsoleOutput: (message: string) => void;
  clearConsole: () => void;

  // Code sync
  code: string;
  setCode: (code: string) => void;

  // Chat integration
  pendingChatAsset: string | null;
  sendAssetToChat: (assetUrl: string, assetName: string) => void;
  clearPendingChatAsset: () => void;
}

const defaultWorkspace: BlocklyWorkspace = {
  blocks: "",
  generatedCode: "",
};

const allTabs: EditorTab[] = [
  { id: "preview", title: "Preview", type: "preview" as EditorTab["type"] },
  { id: "blocks", title: "Blocks", type: "blocks" },
  { id: "code", title: "Code", type: "code" },
  { id: "assets", title: "Assets", type: "assets" },
];

const defaultGameState: GameState = {
  isPlaying: false,
  isPaused: false,
  hasErrors: false,
  consoleOutput: [],
};

const EditorContext = createContext<EditorContextType | null>(null);

interface EditorProviderProps {
  children: ReactNode;
  gameId: string;
  gameName: string;
  initialWorkspace?: BlocklyWorkspace;
  gameCreationMode?: GameCreationMode;
}

export function EditorProvider({
  children,
  gameId,
  gameName,
  initialWorkspace,
  gameCreationMode = "blockly",
}: EditorProviderProps) {
  const [workspace, setWorkspace] =
    useState<BlocklyWorkspace>(initialWorkspace || defaultWorkspace);

  // Filter tabs based on creation mode (hide blocks tab in JavaScript/JavaScript3D modes)
  const tabs = useMemo(() => {
    if (gameCreationMode === "javascript" || gameCreationMode === "javascript3d") {
      return allTabs.filter(tab => tab.id !== "blocks");
    }
    return allTabs;
  }, [gameCreationMode]);

  // Default to code tab in JavaScript/JavaScript3D modes, preview in Blockly mode
  const [activeTab, setActiveTab] = useState(
    (gameCreationMode === "javascript" || gameCreationMode === "javascript3d") ? "code" : "preview"
  );
  const [gameState, setGameState] = useState<GameState>(defaultGameState);
  const [code, setCode] = useState(initialWorkspace?.generatedCode || "");
  const [pendingAIWorkspace, setPendingAIWorkspace] = useState<string | null>(null);
  const [pendingChatAsset, setPendingChatAsset] = useState<string | null>(null);

  const updateGeneratedCode = useCallback((generatedCode: string) => {
    setWorkspace((prev) => ({ ...prev, generatedCode }));
    setCode(generatedCode);
  }, []);

  const loadAIWorkspace = useCallback((workspaceJson: string) => {
    // Set pending workspace - Blockly editor will pick this up and load it
    setPendingAIWorkspace(workspaceJson);
    // Switch to blocks tab to show the user the new blocks
    setActiveTab("blocks");
  }, []);

  const clearPendingAIWorkspace = useCallback(() => {
    setPendingAIWorkspace(null);
  }, []);

  // Load AI-generated code directly (for JavaScript mode)
  const loadAICode = useCallback((newCode: string) => {
    setCode(newCode);
    // Switch to code tab to show the changes
    setActiveTab("code");
  }, []);

  const playGame = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      isPlaying: true,
      isPaused: false,
    }));
  }, []);

  const pauseGame = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      isPaused: true,
    }));
  }, []);

  const stopGame = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      isPlaying: false,
      isPaused: false,
    }));
  }, []);

  const addConsoleOutput = useCallback((message: string) => {
    setGameState((prev) => ({
      ...prev,
      consoleOutput: [...prev.consoleOutput, message],
    }));
  }, []);

  const clearConsole = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      consoleOutput: [],
    }));
  }, []);

  const sendAssetToChat = useCallback((assetUrl: string, assetName: string) => {
    setPendingChatAsset(`Use this asset "${assetName}": ${assetUrl}`);
  }, []);

  const clearPendingChatAsset = useCallback(() => {
    setPendingChatAsset(null);
  }, []);

  return (
    <EditorContext.Provider
      value={{
        gameId,
        gameName,
        gameCreationMode,
        workspace,
        setWorkspace,
        updateGeneratedCode,
        pendingAIWorkspace,
        loadAIWorkspace,
        clearPendingAIWorkspace,
        loadAICode,
        activeTab,
        setActiveTab,
        tabs,
        gameState,
        playGame,
        pauseGame,
        stopGame,
        addConsoleOutput,
        clearConsole,
        code,
        setCode,
        pendingChatAsset,
        sendAssetToChat,
        clearPendingChatAsset,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error("useEditor must be used within EditorProvider");
  }
  return context;
}
