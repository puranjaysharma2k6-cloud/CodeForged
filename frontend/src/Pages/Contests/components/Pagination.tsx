import React from 'react';


function getPageRange(current: number, total: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | '...')[] = [1];

  if (current > 3) pages.push('...');

  const start = Math.max(2, current - 1);
  const end   = Math.min(total - 1, current + 1);
  for (let p = start; p <= end; p++) pages.push(p);

  if (current < total - 2) pages.push('...');
  pages.push(total);

  return pages;
}

function PageButton({
  label,
  active = false,
  disabled = false,
  onClick,
}: {
  label: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium
        transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22d3ee]
        ${active
          ? 'bg-[#22d3ee] text-[#001018]'
          : disabled
          ? 'text-[#9ca3af] cursor-not-allowed'
          : 'text-[#9ca3af] hover:bg-[#262b36] border border-[#363c4a]'
        }
      `}
    >
      {label}
    </button>
  );
}



interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const range = getPageRange(currentPage, totalPages);

  return (
    <nav
      role="navigation"
      aria-label="Contest pagination"
      className="flex items-center justify-center gap-1 mt-8"
    >
      
      <PageButton
        label={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        }
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      />

   
      {range.map((item, idx) =>
        item === '...'
          ? (
            <span key={`ellipsis-${idx}`} className="w-9 h-9 flex items-center justify-center text-[#9ca3af] text-sm select-none">
              …
            </span>
          )
          : (
            <PageButton
              key={item}
              label={item}
              active={item === currentPage}
              onClick={() => onPageChange(item as number)}
            />
          )
      )}

      {/* Next */}
      <PageButton
        label={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        }
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      />
    </nav>
  );
}