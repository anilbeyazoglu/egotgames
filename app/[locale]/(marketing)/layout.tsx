import { Link } from "@/i18n/routing";
import { UserNav } from "@/components/marketing/user-nav";
import Image from "next/image";
import { useTranslations } from "next-intl";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("Marketing.nav");

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/20">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-xl tracking-tighter"
          >
            <div className="w-8 h-8 relative">
              <Image
                src="/logo.png"
                alt="EgotGames Logo"
                fill
                className="object-contain"
              />
            </div>
            EgotGames
          </Link>

          <nav className="hidden md:flex gap-8 items-center">
            <Link
              href="/"
              className="text-sm font-medium text-neutral-400 hover:text-white transition-colors"
            >
              {t("home")}
            </Link>
            <Link
              href="/explore"
              className="text-sm font-medium text-neutral-400 hover:text-white transition-colors"
            >
              {t("explore")}
            </Link>
          </nav>

          <UserNav />
        </div>
      </header>

      <main className="pt-16">{children}</main>

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
