"use client";

interface FeedbackButtonProps {
  href: string;
  onClick?: () => void;
}

export function FeedbackButton({ href, onClick }: FeedbackButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={onClick}
      title="Comentaris"
      className="absolute bottom-20 left-4 z-10 bg-white border-2 border-gray-400 cursor-pointer flex items-center justify-center p-3 rounded-full shadow-lg hover:bg-gray-50 transition-colors text-gray-800"
      aria-label="Comentaris"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        className="text-gray-700"
        aria-hidden="true"
      >
        <title>Comentaris</title>
        <path
          d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
          fill="currentColor"
        />
      </svg>
    </a>
  );
}
