"use client";

import { useRouter } from "next/navigation";

type ProjectCardProps = {
  id: number;
  name: string;
  description: string;
  progress: number;
  status: "In Progress" | "Completed";
  onDelete: (id: number) => void;
  onEdit: (id: number) => void;
};

export default function ProjectCard({
  id,
  name,
  description,
  progress,
  status,
  onDelete,
  onEdit,
}: ProjectCardProps) {
  const router = useRouter();

  function openProject() {
    router.push(`/projects/${id}`);
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <button
            onClick={openProject}
            className="text-left text-xl font-semibold text-gray-900 transition hover:text-blue-600"
          >
            {name}
          </button>

          <p className="mt-2 text-gray-500">
            {description}
          </p>
        </div>

        <button
          onClick={openProject}
          className="shrink-0 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
        >
          View
        </button>
      </div>

      <div className="mt-5">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Progress</span>

          <span className="font-medium text-gray-700">
            {progress}%
          </span>
        </div>

        <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-blue-600 transition-all"
            style={{
              width: `${Math.min(Math.max(progress, 0), 100)}%`,
            }}
          />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <span
          className={`rounded-full px-3 py-1 text-sm ${
            status === "Completed"
              ? "bg-green-100 text-green-700"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {status}
        </span>

        <div className="flex gap-2">
          <button
            onClick={() => onEdit(id)}
            className="rounded-lg px-3 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
          >
            Edit
          </button>

          <button
            onClick={() => onDelete(id)}
            className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}