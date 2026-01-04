import { Suspense } from "react";
import { GameEditor } from "@/components/game-editor";
import { Loader2 } from "lucide-react";

interface EditorPageProps {
  params: Promise<{ gameId: string }>;
}

function EditorLoading() {
  return (
    <div className="h-screen flex items-center justify-center bg-black text-white">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="size-8 animate-spin" />
        <p className="text-white/60">Loading editor...</p>
      </div>
    </div>
  );
}

export default async function EditorPage({ params }: EditorPageProps) {
  const { gameId } = await params;

  return (
    <Suspense fallback={<EditorLoading />}>
      <GameEditor gameId={gameId} />
    </Suspense>
  );
}
