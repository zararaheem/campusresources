'use client';

// Triggers the browser's print dialog, from which the handbook can be saved as
// a PDF. Uses the print stylesheet in globals.css.
export default function PrintButton({ className = 'tb-btn', label = 'Download PDF' }) {
  return (
    <button className={className} onClick={() => window.print()} aria-label="Download as PDF">
      <span aria-hidden>⭳</span> {label}
    </button>
  );
}
