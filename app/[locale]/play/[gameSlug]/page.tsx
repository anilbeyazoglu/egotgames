import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PlayPage({ params }: { params: { gameSlug: string } }) {
  return (
    <div className="h-screen flex flex-col bg-black text-white">
      <header className="h-14 flex items-center justify-between px-6 border-b border-white/10">
        <Link href="/" className="font-bold">
          EgotGames
        </Link>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="text-black border-white/20 hover:bg-white/10 hover:text-white"
          >
            Like
          </Button>
          <Button className="bg-white text-black hover:bg-white/90">
            Remix
          </Button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-8">
        <div className="aspect-video w-full max-w-5xl bg-neutral-900 rounded-lg shadow-2xl border border-white/10 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Game Container</h1>
            <p className="text-neutral-500">Loading game engine...</p>
          </div>
        </div>
      </main>
    </div>
  );
}
