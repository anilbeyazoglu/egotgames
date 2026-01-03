export interface GameProject {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface BlocklyWorkspace {
  blocks: string; // XML or JSON representation
  generatedCode: string;
}

export interface EditorTab {
  id: string;
  title: string;
  type: "preview" | "blocks" | "code" | "files" | "assets";
  icon?: string;
}

export interface GameState {
  isPlaying: boolean;
  isPaused: boolean;
  hasErrors: boolean;
  consoleOutput: string[];
}

export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
  blocklyBlocks?: string; // Generated Blockly blocks if any
}
