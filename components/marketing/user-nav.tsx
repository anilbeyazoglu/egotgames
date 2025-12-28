"use client";

import { useState, useEffect } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LogOut,
  User as UserIcon,
  Gamepad2,
  Layers,
  Settings,
} from "lucide-react";
import { useTranslations } from "next-intl";

export function UserNav() {
  const t = useTranslations("Marketing.nav");
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return (
      <div className="h-8 w-8 animate-pulse rounded-full bg-neutral-800" />
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <Link
          href="/create"
          className="text-sm font-medium bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-neutral-200 transition-colors"
        >
          {t("create")}
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={user.photoURL || ""}
                  alt={user.displayName || "User"}
                />
                <AvatarFallback className="bg-neutral-800 text-white border border-white/10">
                  {user.displayName
                    ? user.displayName.slice(0, 2).toUpperCase()
                    : "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 bg-neutral-900 border-white/10 text-white"
            align="end"
            forceMount
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user.displayName || "User"}
                </p>
                <p className="text-xs leading-none text-neutral-400">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem className="focus:bg-white/10 focus:text-white cursor-pointer">
              <UserIcon className="mr-2 h-4 w-4" />
              <span>{t("userMenu.profile")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="focus:bg-white/10 focus:text-white cursor-pointer">
              <Gamepad2 className="mr-2 h-4 w-4" />
              <span>{t("userMenu.games")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="focus:bg-white/10 focus:text-white cursor-pointer">
              <Layers className="mr-2 h-4 w-4" />
              <span>{t("userMenu.assets")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="focus:bg-white/10 focus:text-white cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>{t("userMenu.preferences")}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="focus:bg-white/10 focus:text-white cursor-pointer text-red-500 focus:text-red-500"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t("userMenu.signOut")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div className="flex gap-6 items-center border-l border-white/10 pl-8 ml-2">
      <Link
        href="/login"
        className="text-sm font-medium text-white/70 hover:text-white transition-colors"
      >
        {t("signIn")}
      </Link>
      <Link
        href="/signup"
        className="text-sm font-medium bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-neutral-200 transition-colors"
      >
        {t("create")}
      </Link>
    </div>
  );
}
