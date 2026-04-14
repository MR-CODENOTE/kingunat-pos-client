import React from 'react';

const PaginationControls = ({ totalItems, itemsPerPage, currentPage, onPageChange }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mt-4 pt-4 border-t border-gray-100 text-sm gap-2">
      <span className="text-gray-500">Showing {startItem} to {endItem} of {totalItems}</span>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-30"
          disabled={currentPage <= 1}
        >
          Prev
        </button>
        <span className="px-3 py-1 bg-gray-100 rounded text-gray-700 font-medium">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-30"
          disabled={currentPage >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default PaginationControls;
