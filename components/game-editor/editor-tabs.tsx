"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEditor } from "./editor-context";
import { BlocklyEditor } from "./blockly-editor";
import { CodeEditor } from "./code-editor";
import { GamePreview } from "./game-preview";
import { AssetsPanel } from "./assets-panel";
import { Blocks, Code, FolderOpen, ImageIcon, Play } from "lucide-react";

export function EditorTabs() {
  const { activeTab, setActiveTab, tabs } = useEditor();

  const getTabIcon = (type: string) => {
    switch (type) {
      case "preview":
        return <Play className="size-4" />;
      case "blocks":
        return <Blocks className="size-4" />;
      case "code":
        return <Code className="size-4" />;
      case "files":
        return <FolderOpen className="size-4" />;
      case "assets":
        return <ImageIcon className="size-4" />;
      default:
        return null;
    }
  };

  return (
    <Tabs
      defaultValue="preview"
      value={activeTab}
      onValueChange={setActiveTab}
      className="h-full flex flex-col"
    >
      <TabsList className="w-full justify-start rounded-none border-b border-white/10 bg-neutral-950 px-2 h-10">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="data-[state=active]:bg-neutral-800 gap-1.5 px-3"
          >
            {getTabIcon(tab.type)}
            {tab.title}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="preview" className="flex-1 m-0 overflow-hidden">
        <GamePreview />
      </TabsContent>

      <TabsContent value="blocks" className="flex-1 m-0 overflow-hidden">
        <BlocklyEditor />
      </TabsContent>

      <TabsContent value="code" className="flex-1 m-0 overflow-hidden">
        <CodeEditor />
      </TabsContent>

      <TabsContent value="files" className="flex-1 m-0 overflow-hidden">
        <div className="h-full flex items-center justify-center text-neutral-500">
          <div className="text-center">
            <FolderOpen className="size-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">File manager coming soon</p>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="assets" className="flex-1 m-0 overflow-hidden">
        <AssetsPanel />
      </TabsContent>
    </Tabs>
  );
}
