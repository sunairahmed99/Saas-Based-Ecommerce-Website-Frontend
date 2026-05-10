import React from 'react';
import { motion } from 'framer-motion';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const ReusablePagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pageNumbers = [];
  const maxVisiblePages = 5;

  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="reusable-pagination-container">
      <div className="pagination-controls">
        <button
          className="pagination-arrow"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          title="Previous Page"
        >
          <FaChevronLeft />
        </button>

        <div className="pagination-numbers">
          {startPage > 1 && (
            <>
              <button className="page-number" onClick={() => onPageChange(1)}>1</button>
              {startPage > 2 && <span className="pagination-dots">...</span>}
            </>
          )}

          {pageNumbers.map((number) => (
            <button
              key={number}
              className={`page-number ${currentPage === number ? 'active' : ''}`}
              onClick={() => onPageChange(number)}
            >
              {number}
            </button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="pagination-dots">...</span>}
              <button className="page-number" onClick={() => onPageChange(totalPages)}>{totalPages}</button>
            </>
          )}
        </div>

        <button
          className="pagination-arrow"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          title="Next Page"
        >
          <FaChevronRight />
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .reusable-pagination-container {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 1.5rem 0;
          width: 100%;
        }

        .pagination-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          padding: 0.5rem;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .pagination-arrow {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border: none;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .pagination-arrow:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }

        .pagination-arrow:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .pagination-numbers {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .page-number {
          width: 40px;
          height: 40px;
          border: none;
          background: transparent;
          color: rgba(255, 255, 255, 0.7);
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .page-number:hover:not(.active) {
          background: rgba(255, 255, 255, 0.05);
          color: white;
        }

        .page-number.active {
          background: #3b82f6;
          color: white;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }

        .pagination-dots {
          color: rgba(255, 255, 255, 0.4);
          padding: 0 0.5rem;
        }

        @media (max-width: 600px) {
          .page-number:not(.active) {
            display: none;
          }
          .pagination-dots {
            display: none;
          }
        }
      `}} />
    </div>
  );
};

export default ReusablePagination;
