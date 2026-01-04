"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { auth, db, rtdb } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import {
  limitToLast,
  onValue,
  orderByChild,
  push,
  query as rtdbQuery,
  ref as rtdbRef,
  remove,
  get as rtdbGet,
  serverTimestamp as rtdbServerTimestamp,
  set,
  update,
} from "firebase/database";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, MessageCircle, Search, Users } from "lucide-react";

type ThreadPreview = {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  type?: string;
  recipientId?: string | null;
};

type FriendRequest = {
  fromUid: string;
  status: string;
  createdAt?: number | null;
  displayName: string;
  username?: string;
};

type ChatMessage = {
  id: string;
  senderId: string;
  text: string;
  createdAt?: number;
  deletedAt?: number | null;
  deletedBy?: string | null;
};

function makeDirectConversationId(uidA: string, uidB: string) {
  return uidA < uidB ? `direct_${uidA}_${uidB}` : `direct_${uidB}_${uidA}`;
}

function formatRequestTime(value?: number | null) {
  if (!value) return "just now";
  const delta = Date.now() - value;
  if (delta < 60_000) return "just now";
  if (delta < 3_600_000) return `${Math.floor(delta / 60_000)}m`;
  if (delta < 86_400_000) return `${Math.floor(delta / 3_600_000)}h`;
  return `${Math.floor(delta / 86_400_000)}d`;
}

function formatConversationTime(value?: number | null) {
  if (!value) return "";
  const delta = Date.now() - value;
  if (delta < 60_000) return "now";
  if (delta < 3_600_000) return `${Math.floor(delta / 60_000)}m`;
  if (delta < 86_400_000) return `${Math.floor(delta / 3_600_000)}h`;
  return `${Math.floor(delta / 86_400_000)}d`;
}

function extractDirectPartnerId(conversationId: string, currentUid: string) {
  if (!conversationId.startsWith("direct_")) return null;
  const parts = conversationId.replace("direct_", "").split("_");
  if (parts.length !== 2) return null;
  return parts[0] === currentUid ? parts[1] : parts[0];
}

function toTimestamp(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export default function FriendsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [searchResult, setSearchResult] = useState<{ uid: string; name: string; username?: string } | null>(null);
  const [searchStatus, setSearchStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [chatQuery, setChatQuery] = useState("");
  const [threads, setThreads] = useState<ThreadPreview[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [selectedThread, setSelectedThread] = useState<ThreadPreview | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [rightTab, setRightTab] = useState<"conversation" | "friends">("friends");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setIncomingRequests([]);
      setRequestsLoading(false);
      return;
    }

    setRequestsLoading(true);
    const requestsRef = rtdbRef(rtdb, `friendRequests/${currentUser.uid}`);
    const unsubscribe = onValue(
      requestsRef,
      async (snapshot) => {
        const data = snapshot.val() || {};
        const entries = Object.entries(data).filter(
          ([_, value]: any) => value?.status === "pending"
        );

        const requestItems = await Promise.all(
          entries.map(async ([fromUid, value]: [string, any]) => {
            let displayName = "Unknown user";
            let username = "";
            try {
              const profileSnap = await getDoc(doc(db, "users", fromUid));
              if (profileSnap.exists()) {
                const profile = profileSnap.data() as any;
                displayName =
                  profile.displayName ||
                  profile.username ||
                  profile.email ||
                  "Unknown user";
                username = profile.username || "";
              }
            } catch {
              // Ignore lookup errors for now.
            }
            return {
              fromUid,
              status: value?.status || "pending",
              createdAt: typeof value?.createdAt === "number" ? value.createdAt : null,
              displayName,
              username,
            } as FriendRequest;
          })
        );

        setIncomingRequests(requestItems);
        setRequestsLoading(false);
      },
      (error) => {
        console.error("Failed to load friend requests:", error);
        setIncomingRequests([]);
        setRequestsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      setThreads([]);
      setThreadsLoading(false);
      setSelectedThread(null);
      return;
    }

    setThreadsLoading(true);
    const conversationsRef = rtdbRef(rtdb, `userConversations/${currentUser.uid}`);
    const unsubscribe = onValue(
      conversationsRef,
      async (snapshot) => {
        const data = snapshot.val() || {};
        const entries = Object.entries(data) as [string, any][];

        const previews = await Promise.all(
          entries.map(async ([conversationId, value]) => {
            let name = value?.title || "Untitled chat";
            let recipientId: string | null = null;
            if (value?.type === "direct") {
              const partnerId = extractDirectPartnerId(conversationId, currentUser.uid);
              recipientId = partnerId;
              if (partnerId) {
                try {
                  const profileSnap = await getDoc(doc(db, "users", partnerId));
                  if (profileSnap.exists()) {
                    const profile = profileSnap.data() as any;
                    name =
                      profile.displayName ||
                      profile.username ||
                      profile.email ||
                      "Unknown user";
                  } else {
                    name = "Unknown user";
                  }
                } catch {
                  name = "Unknown user";
                }
              }
            }

            const lastMessageAt = toTimestamp(value?.lastMessageAt);
            const timeLabel = formatConversationTime(lastMessageAt);

            return {
              id: conversationId,
              name,
              lastMessage: value?.lastMessageText || "No messages yet.",
              time: timeLabel,
              type: value?.type || "direct",
              recipientId,
            } as ThreadPreview;
          })
        );

        previews.sort((a, b) => {
          const aTime = toTimestamp(data[a.id]?.lastMessageAt);
          const bTime = toTimestamp(data[b.id]?.lastMessageAt);
          return bTime - aTime;
        });

        setThreads(previews);
        setSelectedThread((current) => {
          if (!current) return null;
          return previews.find((thread) => thread.id === current.id) || null;
        });
        setThreadsLoading(false);
      },
      (error) => {
        console.error("Failed to load conversations:", error);
        setThreads([]);
        setThreadsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || !selectedThread) {
      setMessages([]);
      setMessagesLoading(false);
      return;
    }

    setMessagesLoading(true);
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    const ensureMembershipAndListen = async () => {
      const participantRef = rtdbRef(rtdb, `participants/${selectedThread.id}/${currentUser.uid}`);
      const now = rtdbServerTimestamp();

      try {
        const participantSnap = await rtdbGet(participantRef);
        if (!participantSnap.exists()) {
          await set(participantRef, {
            role: "member",
            joinedAt: now,
            lastReadAt: now,
            unreadCount: 0,
          });
        } else {
          // Keep lastReadAt fresh for rule checks and unread counts.
          await update(participantRef, {
            lastReadAt: now,
            unreadCount: 0,
          });
        }

        await update(rtdbRef(rtdb), {
          [`userConversations/${currentUser.uid}/${selectedThread.id}/type`]: selectedThread.type || "direct",
          [`userConversations/${currentUser.uid}/${selectedThread.id}/role`]: "member",
        });
      } catch (error) {
        console.error("Failed to ensure conversation membership:", error);
        if (!cancelled) {
          setMessages([]);
          setMessagesLoading(false);
        }
        return;
      }

      if (cancelled) return;

      const messagesRef = rtdbQuery(
        rtdbRef(rtdb, `messages/${selectedThread.id}`),
        orderByChild("createdAt"),
        limitToLast(60)
      );

      unsubscribe = onValue(
        messagesRef,
        (snapshot) => {
          const next: ChatMessage[] = [];
          snapshot.forEach((child) => {
            const value = child.val() || {};
            next.push({
              id: child.key || "",
              senderId: value.senderId || "unknown",
              text: value.text || "",
              createdAt: toTimestamp(value.createdAt),
              deletedAt: toTimestamp(value.deletedAt) || null,
              deletedBy: value.deletedBy || null,
            });
          });
          setMessages(next);
          setMessagesLoading(false);
        },
        (error) => {
          console.error("Failed to load messages:", error);
          setMessages([]);
          setMessagesLoading(false);
        }
      );
    };

    ensureMembershipAndListen();

    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser, selectedThread]);

  useEffect(() => {
    if (!messagesEndRef.current) return;
    messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSearch = async (event?: React.FormEvent) => {
    event?.preventDefault();
    setSearchMessage(null);
    setSearchResult(null);
    setSearchStatus("loading");

    const value = searchValue.trim();
    if (!value) {
      setSearchStatus("idle");
      return;
    }

    try {
      let foundUser: { uid: string; name: string; username?: string } | null = null;
      const usernameQuery = query(
        collection(db, "users"),
        where("username", "==", value),
        limit(1)
      );
      const usernameSnap = await getDocs(usernameQuery);
      if (!usernameSnap.empty) {
        const docSnap = usernameSnap.docs[0];
        const profile = docSnap.data() as any;
        foundUser = {
          uid: docSnap.id,
          name: profile.displayName || profile.username || profile.email || value,
          username: profile.username || "",
        };
      }

      if (!foundUser) {
        const emailQuery = query(
          collection(db, "users"),
          where("email", "==", value),
          limit(1)
        );
        const emailSnap = await getDocs(emailQuery);
        if (!emailSnap.empty) {
          const docSnap = emailSnap.docs[0];
          const profile = docSnap.data() as any;
          foundUser = {
            uid: docSnap.id,
            name: profile.displayName || profile.username || profile.email || value,
            username: profile.username || "",
          };
        }
      }

      if (!foundUser) {
        setSearchMessage("No user found.");
        setSearchStatus("ready");
        return;
      }

      if (currentUser && foundUser.uid === currentUser.uid) {
        setSearchMessage("You cannot add yourself.");
        setSearchStatus("ready");
        return;
      }

      setSearchResult(foundUser);
      setSearchStatus("ready");
    } catch (error) {
      console.error("Search failed:", error);
      setSearchMessage("Search failed. Try again.");
      setSearchStatus("error");
    }
  };

  const handleSendRequest = async () => {
    if (!currentUser || !searchResult) return;
    setSendingRequest(true);
    setSearchMessage(null);

    try {
      const requestRef = rtdbRef(
        rtdb,
        `friendRequests/${searchResult.uid}/${currentUser.uid}`
      );
      await set(requestRef, {
        status: "pending",
        createdAt: rtdbServerTimestamp(),
      });

      await addDoc(collection(db, "notifications"), {
        userId: searchResult.uid,
        senderId: currentUser.uid,
        type: "friend_request",
        title: "New friend request",
        body: `${currentUser.displayName || currentUser.email || "Someone"} sent you a friend request.`,
        createdAt: serverTimestamp(),
        readAt: null,
      });

      setSearchMessage("Request sent.");
    } catch (error) {
      console.error("Failed to send request:", error);
      setSearchMessage("Could not send request.");
    } finally {
      setSendingRequest(false);
    }
  };

  const handleAcceptRequest = async (fromUid: string) => {
    if (!currentUser) return;
    const convoId = makeDirectConversationId(currentUser.uid, fromUid);
    const now = rtdbServerTimestamp();

    const updates: Record<string, unknown> = {
      [`friends/${currentUser.uid}/${fromUid}`]: {
        since: now,
        conversationId: convoId,
      },
      [`friends/${fromUid}/${currentUser.uid}`]: {
        since: now,
        conversationId: convoId,
      },
      [`conversations/${convoId}`]: {
        type: "direct",
        createdAt: now,
        createdBy: currentUser.uid,
        memberCount: 2,
        lastMessageAt: 0,
      },
      [`participants/${convoId}/${currentUser.uid}`]: {
        role: "member",
        joinedAt: now,
        lastReadAt: now,
        unreadCount: 0,
      },
      [`participants/${convoId}/${fromUid}`]: {
        role: "member",
        joinedAt: now,
        lastReadAt: now,
        unreadCount: 0,
      },
      [`userConversations/${currentUser.uid}/${convoId}`]: {
        type: "direct",
        role: "member",
        unreadCount: 0,
        lastMessageAt: 0,
      },
      [`userConversations/${fromUid}/${convoId}`]: {
        type: "direct",
        role: "member",
        unreadCount: 0,
        lastMessageAt: 0,
      },
      [`friendRequests/${currentUser.uid}/${fromUid}`]: null,
    };

    try {
      await update(rtdbRef(rtdb), updates);
      await addDoc(collection(db, "notifications"), {
        userId: fromUid,
        senderId: currentUser.uid,
        type: "friend_request_accepted",
        title: "Friend request accepted",
        body: `${currentUser.displayName || currentUser.email || "Someone"} accepted your friend request.`,
        createdAt: serverTimestamp(),
        readAt: null,
      });
    } catch (error) {
      console.error("Failed to accept request:", error);
    }
  };

  const handleDeclineRequest = async (fromUid: string) => {
    if (!currentUser) return;
    try {
      await remove(rtdbRef(rtdb, `friendRequests/${currentUser.uid}/${fromUid}`));
    } catch (error) {
      console.error("Failed to decline request:", error);
    }
  };

  const filteredThreads = useMemo(() => {
    const value = chatQuery.trim().toLowerCase();
    if (!value) return threads;
    return threads.filter((thread) => thread.name.toLowerCase().includes(value));
  }, [chatQuery, threads]);

  const handleSelectThread = (thread: ThreadPreview) => {
    setSelectedThread(thread);
    setRightTab("conversation");
  };

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentUser || !selectedThread) return;

    const text = messageInput.trim();
    if (!text) return;
    if (selectedThread.type === "direct" && !selectedThread.recipientId) {
      console.error("Direct conversation missing recipient.");
      return;
    }

    setSendingMessage(true);
    try {
      const messagesRef = rtdbRef(rtdb, `messages/${selectedThread.id}`);
      const messageRef = push(messagesRef);

      const payload: Record<string, unknown> = {
        senderId: currentUser.uid,
        type: "text",
        text,
        createdAt: rtdbServerTimestamp(),
      };

      if (selectedThread.type === "direct" && selectedThread.recipientId) {
        payload.recipientId = selectedThread.recipientId;
      }

      await set(messageRef, payload);

      const updates: Record<string, unknown> = {
        [`conversations/${selectedThread.id}/lastMessageText`]: text,
        [`conversations/${selectedThread.id}/lastMessageAt`]: rtdbServerTimestamp(),
        [`conversations/${selectedThread.id}/lastMessageSenderId`]: currentUser.uid,
        [`userConversations/${currentUser.uid}/${selectedThread.id}/lastMessageText`]: text,
        [`userConversations/${currentUser.uid}/${selectedThread.id}/lastMessageAt`]: rtdbServerTimestamp(),
      };

      await update(rtdbRef(rtdb), updates);
      setMessageInput("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="grid flex-1 min-h-0 gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="flex h-full flex-col border-border bg-card text-card-foreground dark:bg-neutral-900 dark:text-white dark:border-white/10">
          <CardHeader className="gap-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Conversations</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Friends and groups.
                </CardDescription>
              </div>
              <Button size="icon" variant="outline" className="dark:border-white/10 dark:hover:bg-white/10">
                <MessageCircle className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search chats"
                value={chatQuery}
                onChange={(event) => setChatQuery(event.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="px-0 flex-1 overflow-auto">
            <div className="divide-y divide-border dark:divide-white/5">
              {threadsLoading ? (
                <div className="flex items-center gap-2 px-6 py-4 text-xs text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading conversations...
                </div>
              ) : filteredThreads.length === 0 ? (
                <div className="px-6 py-6 text-xs text-muted-foreground">
                  No conversations yet.
                </div>
              ) : (
                filteredThreads.map((thread) => {
                  const isActive = selectedThread?.id === thread.id;
                  return (
                    <button
                      key={thread.id}
                      type="button"
                      onClick={() => handleSelectThread(thread)}
                      className={`w-full text-left flex items-center justify-between px-6 py-4 transition-colors ${
                        isActive
                          ? "bg-muted dark:bg-white/10"
                          : "hover:bg-muted/60 dark:hover:bg-white/5"
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <p className="text-sm font-medium truncate">{thread.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{thread.lastMessage}</p>
                      </div>
                      {thread.time ? (
                        <span className="text-xs text-muted-foreground">{thread.time}</span>
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="flex h-full flex-col border-border bg-card text-card-foreground dark:bg-neutral-900 dark:text-white dark:border-white/10">
          <Tabs
            defaultValue="friends"
            value={rightTab}
            onValueChange={(value) => setRightTab(value as "conversation" | "friends")}
            className="flex h-full flex-col"
          >
            <CardHeader className="gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {rightTab === "conversation"
                      ? selectedThread?.name || "Conversation"
                      : "Search for Friends"}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {rightTab === "conversation"
                      ? "Messages and activity."
                      : "Send requests and manage invites."}
                  </CardDescription>
                </div>
                <TabsList className="border border-border bg-muted/50 dark:bg-white/5 dark:border-white/10">
                  <TabsTrigger
                    value="conversation"
                    className="data-[state=active]:bg-card data-[state=active]:text-foreground dark:data-[state=active]:bg-white/10 dark:data-[state=active]:text-white"
                  >
                    Conversation
                  </TabsTrigger>
                  <TabsTrigger
                    value="friends"
                    className="data-[state=active]:bg-card data-[state=active]:text-foreground dark:data-[state=active]:bg-white/10 dark:data-[state=active]:text-white"
                  >
                    Search Friends
                  </TabsTrigger>
                </TabsList>
              </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 overflow-hidden">
              <TabsContent value="conversation" className="mt-0 h-full">
                {selectedThread ? (
                  <div className="flex h-full flex-col gap-4">
                    <div className="flex-1 min-h-0 overflow-auto space-y-3 rounded-lg border border-border bg-muted/40 p-4 dark:border-white/10 dark:bg-white/5">
                      {messagesLoading ? (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading messages...
                        </div>
                      ) : messages.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No messages yet.</p>
                      ) : (
                        messages.map((message) => {
                          const isMine = message.senderId === currentUser?.uid;
                          const content = message.deletedAt ? "Message deleted" : message.text;
                          return (
                            <div
                              key={message.id}
                              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                                  isMine
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-foreground dark:bg-neutral-800 dark:text-white"
                                } ${message.deletedAt ? "italic text-muted-foreground" : ""}`}
                              >
                                {content}
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <Input
                        value={messageInput}
                        onChange={(event) => setMessageInput(event.target.value)}
                        placeholder="Type a message..."
                        className=""
                      />
                      <Button
                        type="submit"
                        disabled={sendingMessage || !messageInput.trim()}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        {sendingMessage ? "Sending..." : "Send"}
                      </Button>
                    </form>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted/50 dark:bg-white/5">
                        <Users className="h-6 w-6" />
                      </div>
                      <p className="mt-3 text-sm">Select a conversation to start chatting.</p>
                    </div>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="friends" className="mt-0 h-full overflow-auto">
                <div className="space-y-6">
                  <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3 dark:border-white/10 dark:bg-white/5">
                    <div>
                      <p className="text-sm font-semibold">Find friends</p>
                      <p className="text-xs text-muted-foreground">
                        Search by username or email.
                      </p>
                    </div>
                    <form onSubmit={handleSearch} className="flex gap-2">
                      <Input
                        value={searchValue}
                        onChange={(event) => setSearchValue(event.target.value)}
                        placeholder="username or email"
                        className=""
                      />
                      <Button type="submit" variant="outline" className="dark:border-white/10">
                        {searchStatus === "loading" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Search"
                        )}
                      </Button>
                    </form>

                    {searchResult ? (
                      <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2 dark:border-white/10">
                        <div>
                          <p className="text-sm font-medium">{searchResult.name}</p>
                          {searchResult.username ? (
                            <p className="text-xs text-muted-foreground">@{searchResult.username}</p>
                          ) : null}
                        </div>
                        <Button
                          size="sm"
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                          onClick={handleSendRequest}
                          disabled={sendingRequest}
                        >
                          {sendingRequest ? "Sending..." : "Send request"}
                        </Button>
                      </div>
                    ) : null}

                    {searchMessage ? (
                      <p className="text-xs text-muted-foreground">{searchMessage}</p>
                    ) : null}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">Incoming requests</p>
                      <Badge variant="outline" className="text-muted-foreground dark:border-white/10">
                        {incomingRequests.length}
                      </Badge>
                    </div>
                    {requestsLoading ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading requests...
                      </div>
                    ) : incomingRequests.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No pending requests.</p>
                    ) : (
                      <div className="space-y-2">
                        {incomingRequests.map((request) => (
                          <div
                            key={request.fromUid}
                            className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2 dark:border-white/10 dark:bg-white/5"
                          >
                            <div>
                              <p className="text-sm font-medium">{request.displayName}</p>
                              <p className="text-xs text-muted-foreground">
                                {request.username ? `@${request.username}` : "New request"} · {formatRequestTime(request.createdAt)}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="bg-primary text-primary-foreground hover:bg-primary/90"
                                onClick={() => handleAcceptRequest(request.fromUid)}
                              >
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="dark:border-white/10"
                                onClick={() => handleDeclineRequest(request.fromUid)}
                              >
                                Decline
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
