"use client";
type ProjectCardProps = {
  id: number;
  name: string;
  description: string;
  progress: number;
  status: "In Progress" | "Completed";
  onDelete: (id: number) => void;
};

export default function ProjectCard({
  id,
  name,
  description,
  progress,
  status,
  onDelete,
}: ProjectCardProps) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h4 className="text-xl font-semibold text-gray-900">
        {name}
      </h4>

      <p className="mt-2 text-gray-500">
        {description}
      </p>

      <div className="mt-5">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Progress</span>

          <span className="font-medium text-gray-700">
            {progress}%
          </span>
        </div>

        <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-blue-600"
            style={{ width: `${progress}%` }}
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

        <button
          onClick={() => onDelete(id)}
          className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}