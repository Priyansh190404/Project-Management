"use client";

import { useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type AIProjectAssistantProps = {
  projectId: number;
};

export default function AIProjectAssistant({
  projectId,
}: AIProjectAssistantProps) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function askAssistant() {
    if (!question.trim() || loading) {
      return;
    }

    const userQuestion = question.trim();

    setQuestion("");
    setError("");

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        role: "user",
        content: userQuestion,
      },
    ]);

    setLoading(true);

    try {
      const response = await fetch(
        "/api/ai/project-assistant",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            projectId,
            question: userQuestion,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to get AI response."
        );
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          role: "assistant",
          content: data.answer,
        },
      ]);
    } catch (error) {
      console.error(
        "Error asking project assistant:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to get AI response."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-blue-500/20 bg-slate-900/70 p-6 shadow-xl">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-xl">
          ✨
        </div>

        <div>
          <h2 className="text-xl font-semibold">
            AI Project Assistant
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Ask questions about this project, its tasks,
            progress, and priorities.
          </p>
        </div>
      </div>

      {messages.length > 0 && (
        <div className="mt-6 max-h-[420px] space-y-4 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user"
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-6 ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-200"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-xl bg-slate-800 px-4 py-3 text-sm text-slate-400">
                Thinking...
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="mt-5 flex gap-3">
        <input
          type="text"
          value={question}
          onChange={(event) =>
            setQuestion(event.target.value)
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              askAssistant();
            }
          }}
          placeholder="Ask about this project..."
          disabled={loading}
          className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500 disabled:opacity-50"
        />

        <button
          type="button"
          onClick={askAssistant}
          disabled={!question.trim() || loading}
          className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "..." : "Ask AI"}
        </button>
      </div>
    </section>
  );
}