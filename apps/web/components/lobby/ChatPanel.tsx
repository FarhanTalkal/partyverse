"use client";

import {
  CHAT_EMOJIS,
  CHAT_EMOJI_SUGGESTIONS,
  type ChatMessage,
  type PublicPlayer,
} from "@partyverse/shared";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";

function renderMessageText(text: string, selfNickname: string | null) {
  const parts = text.split(/(@[A-Za-z0-9 _-]{1,16})/g);
  return parts.map((part, i) => {
    if (part.startsWith("@")) {
      const name = part.slice(1).trim();
      const isMe =
        selfNickname &&
        name.toLowerCase() === selfNickname.toLowerCase();
      return (
        <span
          key={`${part}-${i}`}
          className={cn(
            "rounded px-1 font-semibold",
            isMe
              ? "bg-amber/25 text-amber"
              : "bg-teal/15 text-teal"
          )}
        >
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function messageMentionsSelf(text: string, selfNickname: string | null) {
  if (!selfNickname) return false;
  const re = new RegExp(
    `@${selfNickname.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
    "i"
  );
  return re.test(text);
}

export function ChatPanel({
  messages,
  players,
  selfId,
  onSend,
}: {
  messages: ChatMessage[];
  players: PublicPlayer[];
  selfId: string | null;
  onSend: (text: string) => void;
}) {
  const [text, setText] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const self = useMemo(
    () => players.find((p) => p.id === selfId) ?? null,
    [players, selfId]
  );

  const mentionCandidates = useMemo(() => {
    if (!mentionOpen) return [];
    const q = mentionQuery.toLowerCase();
    return players
      .filter((p) => p.id !== selfId)
      .filter((p) => !q || p.nickname.toLowerCase().includes(q))
      .slice(0, 6);
  }, [mentionOpen, mentionQuery, players, selfId]);

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

  function onChangeText(value: string) {
    setText(value);
    const cursor = inputRef.current?.selectionStart ?? value.length;
    const before = value.slice(0, cursor);
    const match = before.match(/@([A-Za-z0-9 _-]*)$/);
    if (match) {
      setMentionOpen(true);
      setMentionQuery(match[1] ?? "");
    } else {
      setMentionOpen(false);
      setMentionQuery("");
    }
  }

  function insertMention(nickname: string) {
    const cursor = inputRef.current?.selectionStart ?? text.length;
    const before = text.slice(0, cursor);
    const after = text.slice(cursor);
    const replaced = before.replace(/@([A-Za-z0-9 _-]*)$/, `@${nickname} `);
    setText(`${replaced}${after}`);
    setMentionOpen(false);
    setMentionQuery("");
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    onSend(value);
    setText("");
    setPickerOpen(false);
    setMentionOpen(false);
  }

  return (
    <div className="flex h-full min-h-[240px] flex-col rounded-[1.5rem] pv-card">
      <div className="border-b border-[var(--border)] px-4 py-3 text-sm font-semibold text-ink">
        Party chat
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <p className="text-sm text-slate">
            Say hello while everyone gets ready. Use @ to tag someone.
          </p>
        )}
        {messages.map((m) => {
          const isSystem = m.playerId === "system";
          const mentioned = !isSystem && messageMentionsSelf(m.text, self?.nickname ?? null);
          return (
            <div
              key={m.id}
              className={cn(
                "rounded-xl px-3 py-2 text-sm",
                isSystem && "bg-coral/10 font-medium text-coral",
                !isSystem && mentioned && "border border-amber/40 bg-amber/15 text-ink",
                !isSystem && !mentioned && "text-ink"
              )}
            >
              {!isSystem && (
                <>
                  <span className="font-semibold text-teal">{m.nickname}</span>
                  <span className="text-slate"> · </span>
                </>
              )}
              <span className="break-words">
                {isSystem
                  ? m.text
                  : renderMessageText(m.text, self?.nickname ?? null)}
              </span>
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

      <div className="relative flex gap-2 p-3" ref={pickerRef}>
        <form onSubmit={submit} className="flex min-w-0 flex-1 gap-2">
          <div className="relative min-w-0 flex-1">
            <Input
              ref={inputRef}
              value={text}
              onChange={(e) => onChangeText(e.target.value)}
              placeholder="Type a message · @ to mention"
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
            {mentionOpen && mentionCandidates.length > 0 && (
              <ul className="absolute bottom-[calc(100%+6px)] left-0 right-0 z-30 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] shadow-soft">
                {mentionCandidates.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-ink/5"
                      onClick={() => insertMention(p.nickname)}
                    >
                      <span className="font-semibold text-ink">@{p.nickname}</span>
                      {p.isHost && (
                        <span className="text-[10px] font-bold uppercase text-amber">
                          Host
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Button type="submit" size="sm" className="shrink-0 whitespace-nowrap">
            Send
          </Button>
        </form>
        {pickerOpen && (
          <div className="absolute bottom-[calc(100%+8px)] left-3 right-3 z-20 max-h-48 overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-2 shadow-soft">
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
    </div>
  );
}
