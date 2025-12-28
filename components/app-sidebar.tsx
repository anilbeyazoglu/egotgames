"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { UserNav } from "@/components/marketing/user-nav";
import {
  LayoutDashboard,
  Users,
  Settings,
  Gamepad2,
  Layers,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

export function AppSidebar() {
  const t = useTranslations("Dashboard.sidebar");
  const pathname = usePathname();

  const items = [
    {
      title: t("dashboard"),
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: t("community"),
      url: "/community",
      icon: Users,
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
      title: t("settings"),
      url: "/settings",
      icon: Settings,
    },
  ];

  return (
    <Sidebar className="border-r border-white/10 bg-black text-white">
      <SidebarHeader className="border-b border-white/10 p-4">
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
                className="hover:bg-white/10 hover:text-white data-[active=true]:bg-white/10 data-[active=true]:text-white transition-colors"
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
      <SidebarFooter className="border-t border-white/10 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-neutral-500">{t("version")}</span>
          {/* We can put UserNav here or just keeping it simple for now as UserNav is header focused */}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
