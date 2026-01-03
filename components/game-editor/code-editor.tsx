"use client";

import { useEditor } from "./editor-context";
import { useMemo } from "react";
import Editor from "@monaco-editor/react";
import { Loader2 } from "lucide-react";

export function CodeEditor() {
  const { code, setCode } = useEditor();

  const editorOptions = useMemo(
    () => ({
      minimap: { enabled: false },
      fontSize: 13,
      wordWrap: "on" as const,
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      renderWhitespace: "selection" as const,
      bracketPairColorization: { enabled: true },
      fixedOverflowWidgets: true,
    }),
    []
  );

  return (
    <div className="h-full flex flex-col bg-neutral-950">
      <div className="flex-1 overflow-hidden border-b border-white/10">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          theme="vs-dark"
          value={code}
          onChange={(value) => setCode(value || "")}
          options={editorOptions}
          loading={
            <div className="flex h-full items-center justify-center text-neutral-400">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading editor...
            </div>
          }
        />
      </div>
      <div className="px-4 py-2 border-t border-white/10 text-xs text-neutral-500">
        JavaScript (p5.js)
      </div>
    </div>
  );
}
