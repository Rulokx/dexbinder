interface PaginationProps {
  page: number; // 0-based
  pages: number;
  onPrev: () => void;
  onNext: () => void;
}

export function Pagination({ page, pages, onPrev, onNext }: PaginationProps) {
  return (
    <nav className="pagination" aria-label="Pagination">
      <button className="btn" type="button" onClick={onPrev} disabled={page === 0}>
        ← Previous
      </button>
      <span className="counter" data-testid="page-label">
        Page {page + 1} of {pages}
      </span>
      <button className="btn" type="button" onClick={onNext} disabled={page >= pages - 1}>
        Next →
      </button>
    </nav>
  );
}
