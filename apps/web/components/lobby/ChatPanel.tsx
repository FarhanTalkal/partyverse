"use client";

import {
  CHAT_EMOJIS,
  CHAT_EMOJI_SUGGESTIONS,
  type ChatMessage,
} from "@partyverse/shared";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function ChatPanel({
  messages,
  onSend,
}: {
  messages: ChatMessage[];
  onSend: (text: string) => void;
}) {
  const [text, setText] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pickerOpen) return;
    function onDocClick(e: MouseEvent) {
      if (!pickerRef.current?.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [pickerOpen]);

  function insertEmoji(emoji: string) {
    setText((prev) => `${prev}${emoji}`);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    onSend(value);
    setText("");
    setPickerOpen(false);
  }

  return (
    <div className="flex h-full min-h-[240px] flex-col rounded-[1.5rem] pv-card">
      <div className="border-b border-[var(--border)] px-4 py-3 text-sm font-semibold text-ink">
        Party chat
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <p className="text-sm text-slate">Say hello while everyone gets ready. 👋</p>
        )}
        {messages.map((m) => {
          const isSystem = m.playerId === "system";
          return (
            <div
              key={m.id}
              className={
                isSystem
                  ? "rounded-xl bg-coral/10 px-3 py-2 text-sm font-medium text-coral"
                  : "text-sm text-ink"
              }
            >
              {!isSystem && (
                <>
                  <span className="font-semibold text-teal">{m.nickname}</span>
                  <span className="text-slate"> · </span>
                </>
              )}
              <span className="break-words">{m.text}</span>
            </div>
          );
        })}
      </div>

      <div className="border-t border-[var(--border)] px-3 pt-2">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate">
          Suggestions
        </p>
        <div className="flex flex-wrap gap-1">
          {CHAT_EMOJI_SUGGESTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="rounded-lg px-1.5 py-1 text-lg leading-none transition hover:scale-110 hover:bg-[var(--surface-strong)]"
              onClick={() => insertEmoji(emoji)}
              aria-label={`Insert ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={submit} className="relative flex gap-2 p-3" ref={pickerRef}>
        <div className="relative min-w-0 flex-1">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message"
            maxLength={200}
            className="pr-12"
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-xl transition hover:bg-ink/5"
            aria-label="Open emoji picker"
            aria-expanded={pickerOpen}
            onClick={() => setPickerOpen((v) => !v)}
          >
            😊
          </button>
          {pickerOpen && (
            <div className="absolute bottom-[calc(100%+8px)] left-0 right-0 z-20 max-h-48 overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-2 shadow-soft">
              <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate">
                All emojis
              </p>
              <div className="grid grid-cols-8 gap-1">
                {CHAT_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="rounded-lg p-1.5 text-lg leading-none transition hover:scale-110 hover:bg-ink/5"
                    onClick={() => insertEmoji(emoji)}
                    aria-label={`Insert ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <Button type="submit" size="sm" className="shrink-0 whitespace-nowrap">
          Send
        </Button>
      </form>
    </div>
  );
}
