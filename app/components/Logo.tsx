export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-3 ${className}`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 12.5l4.2 4.2L19 7" />
        </svg>
      </span>
      <span className="font-display text-xl font-bold tracking-tight text-white">
        TaskFlow
      </span>
    </span>
  );
}
