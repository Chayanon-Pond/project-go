import React from "react";

interface Props {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}

const Pagination: React.FC<Props> = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="max-w-4xl mx-auto mt-6 flex items-center justify-center gap-2">
      <button className="btn btn-sm" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1}>
        Prev
      </button>
      <div className="text-sm px-3 py-1">Page {page} / {totalPages}</div>
      <button className="btn btn-sm" onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}>
        Next
      </button>
    </div>
  );
};

export default Pagination;
