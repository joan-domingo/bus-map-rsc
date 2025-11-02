"use client";

interface LocationButtonProps {
  onClick: () => void;
  isDragging: boolean;
}

export function LocationButton({ onClick, isDragging }: LocationButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute bottom-20 right-4 bg-white border-2 border-gray-400 cursor-pointer flex items-center justify-center p-3 rounded-full shadow-lg hover:bg-gray-50 transition-colors disabled:opacity-50 ${
        isDragging ? "opacity-50" : ""
      }`}
      aria-label="Get location"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        className="text-blue-600"
      >
        <title>Get current location</title>
        <path
          d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
          fill="currentColor"
        />
      </svg>
    </button>
  );
}
