type PaginationProps = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
};

function pageWindow(page: number, totalPages: number): number[] {
  const pages = new Set<number>([1, totalPages]);
  for (let offset = -1; offset <= 1; offset += 1) {
    const candidate = page + offset;
    if (candidate >= 1 && candidate <= totalPages) pages.add(candidate);
  }
  return [...pages].sort((a, b) => a - b);
}

export default function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = pageWindow(page, totalPages);

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
      >
        Previous
      </button>

      {pages.map((value, index) => {
        const previous = pages[index - 1];
        const gap = previous !== undefined && value - previous > 1;
        return (
          <span key={value} className="flex items-center gap-2">
            {gap && <span className="px-1 text-neutral-400">…</span>}
            <button
              type="button"
              onClick={() => onChange(value)}
              aria-current={value === page ? 'page' : undefined}
              className={`h-9 w-9 rounded-lg text-sm font-medium transition ${
                value === page
                  ? 'bg-brand text-white'
                  : 'border border-neutral-300 text-neutral-700 hover:border-brand hover:text-brand'
              }`}
            >
              {value}
            </button>
          </span>
        );
      })}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
      </button>
    </nav>
  );
}
