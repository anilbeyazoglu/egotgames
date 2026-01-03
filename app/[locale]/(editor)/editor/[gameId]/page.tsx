import { GameEditor } from "@/components/game-editor";

interface EditorPageProps {
  params: Promise<{ gameId: string }>;
}

export default async function EditorPage({ params }: EditorPageProps) {
  const { gameId } = await params;

  return <GameEditor gameId={gameId} />;
}
