import { formatDistanceToNow } from "date-fns";
import { Copy, ThumbsUp, ThumbsDown, Check } from "lucide-react";
import { ChatMessage as ChatMessageType } from "../../types/chat";
import { useState } from "react";
import { copyToClipboard } from "../../utils/clipboard";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
  message: ChatMessageType;
}

/**
 * Individual chat message bubble
 * User messages align right, AI messages align left with avatar
 */
export function ChatMessage({ message }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = async () => {
    const success = await copyToClipboard(message.content);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isUser) {
    return (
      <div className="flex justify-end mb-4 animate-slide-up">
        <div className="max-w-[70%]">
          <div className="px-3.5 py-2.5 rounded-xl bg-primary text-primary-foreground shadow-sm">
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-1 text-right opacity-60">
            {formatDistanceToNow(message.timestamp, { addSuffix: true })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-4 animate-slide-up">
      <div className="max-w-[85%]">
        <div className="flex gap-2.5">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-sm">🤖</span>
          </div>

          {/* Message Bubble */}
          <div className="flex-1">
            <div className="px-4 py-3 rounded-xl bg-secondary/50 border border-border/40">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => (
                      <p className="text-sm leading-relaxed text-foreground mb-2 last:mb-0">
                        {children}
                      </p>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold text-foreground">
                        {children}
                      </strong>
                    ),
                    em: ({ children }) => (
                      <em className="italic text-foreground">{children}</em>
                    ),
                    code: ({ children }) => (
                      <code className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-xs">
                        {children}
                      </code>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside space-y-1 text-sm text-foreground">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside space-y-1 text-sm text-foreground">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="text-foreground">{children}</li>
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 mt-2">
              <button
                onClick={handleCopy}
                className="h-7 w-7 rounded-md hover:bg-muted/80 flex items-center justify-center transition-colors"
                aria-label="Copy message"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-success" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </button>
              <button
                className="h-7 w-7 rounded-md hover:bg-muted/80 flex items-center justify-center transition-colors"
                aria-label="Helpful"
              >
                <ThumbsUp className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
              </button>
              <button
                className="h-7 w-7 rounded-md hover:bg-muted/80 flex items-center justify-center transition-colors"
                aria-label="Not helpful"
              >
                <ThumbsDown className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
              </button>
              <span className="text-xs text-muted-foreground ml-2 opacity-60">
                {formatDistanceToNow(message.timestamp, { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
