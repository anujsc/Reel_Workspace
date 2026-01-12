import { useState, useCallback, useEffect } from "react";
import { ChatMessage, ChatState } from "../types/chat";
import api from "../services/api";

/**
 * Custom hook for managing ephemeral chat state
 * Chat history persists in sessionStorage (survives refresh, dies on tab close)
 */
export function useEphemeralChat(reelId: string) {
  const storageKey = `chat_${reelId}`;

  // Initialize state from sessionStorage if available
  const [state, setState] = useState<ChatState>(() => {
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          isOpen: false,
          messages: parsed.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          })),
          isStreaming: false,
          error: null,
        };
      }
    } catch (error) {
      console.error(
        "[useEphemeralChat] Failed to load from sessionStorage:",
        error
      );
    }

    return {
      isOpen: false,
      messages: [],
      isStreaming: false,
      error: null,
    };
  });

  // Persist messages to sessionStorage whenever they change
  useEffect(() => {
    if (state.messages.length > 0) {
      try {
        sessionStorage.setItem(
          storageKey,
          JSON.stringify({
            messages: state.messages,
          })
        );
      } catch (error) {
        console.error(
          "[useEphemeralChat] Failed to save to sessionStorage:",
          error
        );
      }
    }
  }, [state.messages, storageKey]);

  const openChat = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: true }));
  }, []);

  const closeChat = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const clearChat = useCallback(() => {
    setState((prev) => ({ ...prev, messages: [], error: null }));
    sessionStorage.removeItem(storageKey);
  }, [storageKey]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || state.isStreaming) return;

      // Add user message optimistically
      const userMessage: ChatMessage = {
        id: `user_${Date.now()}`,
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage],
        isStreaming: true,
        error: null,
      }));

      // Prepare assistant message placeholder
      const assistantMessageId = `assistant_${Date.now()}`;
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
      }));

      try {
        // Send request to streaming endpoint
        const response = await fetch(
          `${api.defaults.baseURL}/api/chat/ephemeral`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
            body: JSON.stringify({
              reelId,
              messages: [...state.messages, userMessage].map((m) => ({
                role: m.role,
                content: m.content,
              })),
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to get response");
        }

        // Read stream
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error("No response body");
        }

        let accumulatedContent = "";

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulatedContent += chunk;

          // Update assistant message with accumulated content
          setState((prev) => ({
            ...prev,
            messages: prev.messages.map((m) =>
              m.id === assistantMessageId
                ? { ...m, content: accumulatedContent }
                : m
            ),
          }));
        }

        setState((prev) => ({ ...prev, isStreaming: false }));
      } catch (error: any) {
        console.error("[useEphemeralChat] Error sending message:", error);
        setState((prev) => ({
          ...prev,
          isStreaming: false,
          error: error.message || "Failed to send message",
          messages: prev.messages.filter((m) => m.id !== assistantMessageId),
        }));
      }
    },
    [reelId, state.isStreaming, state.messages]
  );

  return {
    state,
    openChat,
    closeChat,
    sendMessage,
    clearChat,
  };
}
