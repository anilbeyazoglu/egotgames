"use client";

import { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
  where,
} from "firebase/firestore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  createdAt?: Date | null;
  readAt?: Date | null;
};

export function NotificationsMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }

    const notificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const nextItems = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as any;
        return {
          id: docSnap.id,
          title: data.title || "Notification",
          body: data.body || "",
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : null,
          readAt: data.readAt?.toDate ? data.readAt.toDate() : null,
        } as NotificationItem;
      });

      setItems(nextItems);
    });

    return () => unsubscribe();
  }, [user]);

  const unreadCount = useMemo(
    () => items.filter((item) => !item.readAt).length,
    [items]
  );

  const markUnreadAsRead = async () => {
    if (!user || unreadCount === 0) return;
    try {
      const batch = writeBatch(db);
      items.forEach((item) => {
        if (!item.readAt) {
          batch.update(doc(db, "notifications", item.id), {
            readAt: serverTimestamp(),
          });
        }
      });
      await batch.commit();
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          markUnreadAsRead();
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 ? (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 bg-neutral-900 border-white/10 text-white"
      >
        <DropdownMenuLabel className="text-xs uppercase tracking-wide text-neutral-400">
          Notifications
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />
        {items.length === 0 ? (
          <div className="px-3 py-4 text-xs text-neutral-500">
            No notifications yet.
          </div>
        ) : (
          <div className="max-h-80 overflow-auto">
            {items.map((item) => (
              <div key={item.id} className="px-3 py-3 border-b border-white/5 last:border-b-0">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-neutral-400">{item.body}</p>
              </div>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
