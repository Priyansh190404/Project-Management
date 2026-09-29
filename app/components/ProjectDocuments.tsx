"use client";

import { useEffect, useState } from "react";

type Document = {
  id: number;
  name: string;
  content: string;
  createdAt: string;
};

type ProjectDocumentsProps = {
  projectId: number;
};

export default function ProjectDocuments({
  projectId,
}: ProjectDocumentsProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingDocuments, setLoadingDocuments] =
    useState(true);
  const [error, setError] = useState("");

  async function loadDocuments() {
    try {
      setLoadingDocuments(true);
      setError("");

      const response = await fetch(
        `/api/projects/${projectId}/documents`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load documents."
        );
      }

      setDocuments(data.documents || []);
    } catch (error) {
      console.error(
        "Error loading project documents:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load documents."
      );
    } finally {
      setLoadingDocuments(false);
    }
  }

  useEffect(() => {
    loadDocuments();
  }, [projectId]);

  async function addDocument() {
    if (!name.trim() || !content.trim() || loading) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/projects/${projectId}/documents`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            content,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to add document."
        );
      }

      setDocuments((currentDocuments) => [
        data.document,
        ...currentDocuments,
      ]);

      setName("");
      setContent("");
    } catch (error) {
      console.error(
        "Error adding project document:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to add document."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-emerald-500/20 bg-slate-900/70 p-6 shadow-xl">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-xl">
          📄
        </div>

        <div>
          <h2 className="text-xl font-semibold">
            Project Documents
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Add project documentation that the AI
            assistant can use as project knowledge.
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="mt-6 space-y-4">
        <input
          type="text"
          value={name}
          onChange={(event) =>
            setName(event.target.value)
          }
          placeholder="Document name"
          disabled={loading}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500 disabled:opacity-50"
        />

        <textarea
          value={content}
          onChange={(event) =>
            setContent(event.target.value)
          }
          placeholder="Paste your project documentation here..."
          rows={7}
          disabled={loading}
          className="w-full resize-y rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-slate-500 focus:border-emerald-500 disabled:opacity-50"
        />

        <button
          type="button"
          onClick={addDocument}
          disabled={
            !name.trim() ||
            !content.trim() ||
            loading
          }
          className="rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Adding..." : "Add Document"}
        </button>
      </div>

      <div className="mt-8">
        <h3 className="font-semibold">
          Added Documents
        </h3>

        {loadingDocuments ? (
          <p className="mt-3 text-sm text-slate-500">
            Loading documents...
          </p>
        ) : documents.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            No documents added yet.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {documents.map((document) => (
              <div
                key={document.id}
                className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"
              >
                <p className="font-medium">
                  {document.name}
                </p>

                <p className="mt-1 line-clamp-2 text-sm text-slate-400">
                  {document.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}