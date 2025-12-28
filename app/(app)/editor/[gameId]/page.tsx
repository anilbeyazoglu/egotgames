import { Button } from "@/components/ui/button";

export default function EditorPage({ params }: { params: { gameId: string } }) {
  return (
    <div className="h-[calc(100vh-3.5rem)] flex">
      {/* Left Pane: Chat */}
      <div className="w-80 border-r flex flex-col bg-background">
        <div className="p-4 border-b font-medium">Egot Assistant</div>
        <div className="flex-1 p-4 overflow-y-auto text-sm space-y-4">
          <div className="bg-muted p-3 rounded-lg">
            👋 Hi! I'm Egot. What shall we build today?
          </div>
        </div>
        <div className="p-4 border-t">
          <input
            className="w-full bg-input rounded-md px-3 py-2 text-sm focus:outline-hidden focus:ring-1 ring-ring"
            placeholder="Type instruction..."
          />
        </div>
      </div>

      {/* Center Pane: Viewport */}
      <div className="flex-1 bg-neutral-900 relative flex items-center justify-center overflow-hidden">
        {/* Toolbar Overlay */}
        <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm p-1 rounded-md border shadow-2xl flex gap-1">
          <Button variant="ghost" size="sm">
            Select
          </Button>
          <Button variant="ghost" size="sm">
            Move
          </Button>
          <div className="w-px bg-border mx-1" />
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Play
          </Button>
        </div>

        <div className="text-neutral-500 font-mono text-sm">
          Game Canvas Viewport
        </div>
      </div>

      {/* Right Pane: Inspector/Assets */}
      <div className="w-72 border-l bg-background flex flex-col">
        <div className="p-2 border-b flex gap-1">
          <Button variant="ghost" size="sm" className="flex-1">
            Assets
          </Button>
          <Button variant="ghost" size="sm" className="flex-1">
            Properties
          </Button>
        </div>
        <div className="flex-1 p-4">
          <div className="text-sm text-muted-foreground text-center mt-10">
            Select an object to edit
          </div>
        </div>
      </div>
    </div>
  );
}
