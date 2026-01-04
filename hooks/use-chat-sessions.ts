"use client";

import { useCallback, useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  getDocs,
  serverTimestamp,
  increment,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import type {
  ChatSession,
  ChatMessage,
  ChatMessagePart,
  GameCreationMode,
} from "@/lib/types";

/**
 * Hook to manage chat sessions for a game
 * Uses direct Firestore access with security rules for auth
 */
export function useChatSessions(gameId: string) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setSessions([]);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Real-time listener for sessions (depends on user)
  useEffect(() => {
    if (!user || !gameId) {
      if (!user) setLoading(false);
      return;
    }

    setLoading(true);

    const sessionsQuery = query(
      collection(db, "chat_sessions"),
      where("gameId", "==", gameId),
      where("ownerId", "==", user.uid),
      orderBy("lastMessageAt", "desc")
    );

    const unsubscribe = onSnapshot(
      sessionsQuery,
      (snapshot) => {
        const sessionList: ChatSession[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ChatSession[];
        setSessions(sessionList);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching sessions:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [gameId, user]);

  const createSession = useCallback(
    async (gameCreationMode: GameCreationMode): Promise<ChatSession | null> => {
      const user = auth.currentUser;
      if (!user) return null;

      try {
        const now = serverTimestamp();
        const sessionData = {
          gameId,
          ownerId: user.uid,
          title: "New Chat",
          gameCreationMode,
          messageCount: 0,
          lastMessageAt: now,
          workspaceSnapshot: null,
          codeSnapshot: null,
          createdAt: now,
          updatedAt: now,
        };

        const docRef = await addDoc(collection(db, "chat_sessions"), sessionData);

        // Return the session with the new ID
        return {
          id: docRef.id,
          ...sessionData,
          lastMessageAt: Timestamp.now(),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        } as ChatSession;
      } catch (err) {
        console.error("Error creating session:", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
        return null;
      }
    },
    [gameId]
  );

  const deleteSession = useCallback(
    async (sessionId: string): Promise<boolean> => {
      try {
        const sessionRef = doc(db, "chat_sessions", sessionId);

        // Delete all messages in subcollection first
        const messagesQuery = query(collection(db, "chat_sessions", sessionId, "messages"));
        const messagesSnapshot = await getDocs(messagesQuery);

        const batch = writeBatch(db);
        messagesSnapshot.docs.forEach((msgDoc) => {
          batch.delete(msgDoc.ref);
        });
        batch.delete(sessionRef);

        await batch.commit();
        return true;
      } catch (err) {
        console.error("Error deleting session:", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
        return false;
      }
    },
    []
  );

  return {
    sessions,
    loading,
    error,
    createSession,
    deleteSession,
  };
}

/**
 * Hook to manage a single chat session
 */
export function useChatSession(sessionId: string | null) {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch session and messages when sessionId changes
  useEffect(() => {
    if (!sessionId) {
      setSession(null);
      setMessages([]);
      return;
    }

    setLoading(true);

    // Fetch session document
    const sessionRef = doc(db, "chat_sessions", sessionId);
    getDoc(sessionRef)
      .then((docSnap) => {
        if (docSnap.exists()) {
          setSession({ id: docSnap.id, ...docSnap.data() } as ChatSession);
        }
      })
      .catch((err) => {
        console.error("Error fetching session:", err);
        setError(err);
      });

    // Subscribe to messages
    const messagesQuery = query(
      collection(db, "chat_sessions", sessionId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messageList: ChatMessage[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ChatMessage[];
        setMessages(messageList);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching messages:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [sessionId]);

  const addMessage = useCallback(
    async (
      role: "user" | "assistant",
      parts: ChatMessagePart[]
    ): Promise<ChatMessage | null> => {
      if (!sessionId) return null;

      try {
        const now = serverTimestamp();
        const messageData = {
          role,
          parts,
          createdAt: now,
        };

        const sessionRef = doc(db, "chat_sessions", sessionId);
        const messagesRef = collection(db, "chat_sessions", sessionId, "messages");

        // Add message
        const msgDocRef = await addDoc(messagesRef, messageData);

        // Update session metadata
        await updateDoc(sessionRef, {
          messageCount: increment(1),
          lastMessageAt: now,
          updatedAt: now,
        });

        // Update local session state
        setSession((prev) =>
          prev
            ? {
                ...prev,
                messageCount: prev.messageCount + 1,
                lastMessageAt: Timestamp.now(),
              }
            : prev
        );

        return {
          id: msgDocRef.id,
          role,
          parts,
          createdAt: Timestamp.now(),
        } as ChatMessage;
      } catch (err) {
        console.error("Error adding message:", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
        return null;
      }
    },
    [sessionId]
  );

  const updateSession = useCallback(
    async (updates: {
      title?: string;
      workspaceSnapshot?: string;
      codeSnapshot?: string;
    }): Promise<boolean> => {
      if (!sessionId) return false;

      try {
        const sessionRef = doc(db, "chat_sessions", sessionId);
        await updateDoc(sessionRef, {
          ...updates,
          updatedAt: serverTimestamp(),
        });

        // Update local state
        setSession((prev) => (prev ? { ...prev, ...updates } : prev));
        return true;
      } catch (err) {
        console.error("Error updating session:", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
        return false;
      }
    },
    [sessionId]
  );

  const generateTitle = useCallback(
    async (
      firstMessage: string,
      gameCreationMode: GameCreationMode
    ): Promise<string | null> => {
      if (!sessionId) return null;

      try {
        // Call API route for AI title generation
        const response = await fetch(
          `/api/chat-sessions/${sessionId}/generate-title`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ firstMessage, gameCreationMode }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to generate title");
        }

        const data = await response.json();

        // Update Firestore and local state
        const sessionRef = doc(db, "chat_sessions", sessionId);
        await updateDoc(sessionRef, {
          title: data.title,
          updatedAt: serverTimestamp(),
        });

        setSession((prev) => (prev ? { ...prev, title: data.title } : prev));

        return data.title;
      } catch (err) {
        console.error("Error generating title:", err);
        return null;
      }
    },
    [sessionId]
  );

  return {
    session,
    messages,
    loading,
    error,
    addMessage,
    updateSession,
    generateTitle,
    setMessages,
  };
}
