"use client";

import { useState } from "react";

type Insights = {
  summary: string;
  health: "Healthy" | "Needs Attention" | "At Risk";
  bottlenecks: string[];
  priorityTasks: string[];
  recommendations: string[];
};

type AIProjectInsightsProps = {
  projectId: number;
};

export default function AIProjectInsights({
  projectId,
}: AIProjectInsightsProps) {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generateInsights() {
    if (loading) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/ai/project-insights",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            projectId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to generate project insights."
        );
      }

      setInsights(data.insights);
    } catch (error) {
      console.error(
        "Error generating project insights:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to generate project insights."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-purple-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-xl">
            ✨
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              AI Project Insights
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Let AI analyze this project's progress,
              priorities, and potential bottlenecks.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={generateInsights}
          disabled={loading}
          className="rounded-lg bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "✨ Analyze Project"}
        </button>
      </div>

      {error && (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {insights && (
        <div className="mt-6 space-y-5">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-semibold text-gray-900">
                Project Health
              </h3>

              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  insights.health === "Healthy"
                    ? "bg-green-100 text-green-700"
                    : insights.health === "Needs Attention"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {insights.health}
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-gray-700">
              {insights.summary}
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
              <h3 className="font-semibold text-gray-900">
                ⚠️ Bottlenecks
              </h3>

              {insights.bottlenecks.length > 0 ? (
                <ul className="mt-3 space-y-2 text-sm text-gray-700">
                  {insights.bottlenecks.map(
                    (item, index) => (
                      <li key={index}>• {item}</li>
                    )
                  )}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-gray-500">
                  No major bottlenecks identified.
                </p>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
              <h3 className="font-semibold text-gray-900">
                🔥 Priority Tasks
              </h3>

              {insights.priorityTasks.length > 0 ? (
                <ul className="mt-3 space-y-2 text-sm text-gray-700">
                  {insights.priorityTasks.map(
                    (item, index) => (
                      <li key={index}>• {item}</li>
                    )
                  )}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-gray-500">
                  No high-priority pending work identified.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
            <h3 className="font-semibold text-gray-900">
              🎯 Recommendations
            </h3>

            {insights.recommendations.length > 0 ? (
              <ul className="mt-3 space-y-2 text-sm text-gray-700">
                {insights.recommendations.map(
                  (item, index) => (
                    <li key={index}>• {item}</li>
                  )
                )}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-gray-500">
                No additional recommendations.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}