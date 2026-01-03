"use client";

import { useEffect, useState } from "react";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Users,
  MessageCircle,
  Settings,
  Gamepad2,
  Layers,
  CreditCard,
  Palette,
  Camera,
  Moon,
  Sun,
} from "lucide-react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";

const themeStorageKey = "egot-theme";
const localeStorageKey = "egot-locale";

export function AppSidebar() {
  const t = useTranslations("Dashboard.sidebar");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const items = [
    {
      title: t("dashboard"),
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: t("explore"),
      url: "/explore",
      icon: Users,
    },
    {
      title: t("myFriends"),
      url: "/friends",
      icon: MessageCircle,
    },
    {
      title: t("myGames"),
      url: "/games",
      icon: Gamepad2,
    },
    {
      title: t("assets"),
      url: "/assets",
      icon: Layers,
    },
    {
      title: t("screenshots"),
      url: "/screenshots",
      icon: Camera,
    },
    {
      title: t("pixelEditor"),
      url: "/pixel-editor",
      icon: Palette,
    },
    {
      title: t("credits"),
      url: "/credits",
      icon: CreditCard,
    },
    {
      title: t("settings"),
      url: "/preferences",
      icon: Settings,
    },
  ];

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(themeStorageKey);
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      document.documentElement.classList.toggle("dark", stored === "dark");
      return;
    }
    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextTheme = prefersDark ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.classList.toggle("dark", prefersDark);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedLocale = window.localStorage.getItem(localeStorageKey);
    if (storedLocale === "en" || storedLocale === "tr") {
      if (storedLocale !== locale) {
        router.replace(pathname, { locale: storedLocale });
      }
    } else {
      window.localStorage.setItem(localeStorageKey, locale);
    }
  }, [locale, pathname, router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem(themeStorageKey, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  };

  const ThemeIcon = theme === "dark" ? Sun : Moon;
  const languageLabel = t("languageToggle");
  const localeLabel = locale === "tr" ? "TR" : "EN";

  const setLocale = (nextLocale: "en" | "tr") => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(localeStorageKey, nextLocale);
    }
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold tracking-tight"
        >
          <div className="w-8 h-8 relative">
            <Image
              src="/logo.png"
              alt="EgotGames Logo"
              fill
              className="object-contain"
            />
          </div>
          <span>Egot Console</span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.url}
                className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground transition-colors"
              >
                <Link href={item.url}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{t("version")}</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={toggleTheme}
              aria-label={t("themeToggle")}
              className="border-sidebar-border bg-sidebar-accent/40 hover:bg-sidebar-accent"
            >
              <ThemeIcon className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  aria-label={languageLabel}
                  className="border-sidebar-border bg-sidebar-accent/40 hover:bg-sidebar-accent px-2"
                >
                  {localeLabel}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-sidebar text-sidebar-foreground border-sidebar-border"
              >
                <DropdownMenuItem
                  onClick={() => setLocale("en")}
                  className="cursor-pointer focus:bg-sidebar-accent focus:text-sidebar-accent-foreground"
                >
                  English
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLocale("tr")}
                  className="cursor-pointer focus:bg-sidebar-accent focus:text-sidebar-accent-foreground"
                >
                  Turkish
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {/* We can put UserNav here or just keeping it simple for now as UserNav is header focused */}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
