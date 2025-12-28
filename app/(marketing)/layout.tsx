import Link from "next/link";
import Image from "next/image";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-white relative font-sans selection:bg-purple-500/30">
      {/* Floating Pill Header */}
      <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
        <header className="bg-neutral-900/80 backdrop-blur-md border border-white/10 rounded-full px-6 py-3 flex items-center justify-between w-full max-w-5xl shadow-2xl">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-8 h-8 overflow-hidden rounded-lg">
              <Image
                src="/logo.png"
                alt="EgotGames Logo"
                fill
                className="object-contain transition-transform group-hover:scale-110"
              />
            </div>
            <span className="font-bold tracking-tight text-lg">EgotGames</span>
          </Link>
          <nav className="hidden md:flex gap-8 items-center">
            <Link
              href="/"
              className="text-sm font-medium text-neutral-400 hover:text-white transition-colors"
            >
              Home
            </Link>
            <Link
              href="/docs"
              className="text-sm font-medium text-neutral-400 hover:text-white transition-colors"
            >
              Docs
            </Link>
          </nav>
          <div className="flex gap-4 items-center">
            <Link
              href="/login"
              className="text-sm font-medium text-white/70 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-neutral-200 transition-colors"
            >
              Start
            </Link>
          </div>
        </header>
      </div>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-white/10 py-12 text-center text-sm text-neutral-500 bg-black">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center px-6 gap-6">
          <p>&copy; 2025 EgotGames. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-white transition-colors">
              Discord
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Twitter
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
