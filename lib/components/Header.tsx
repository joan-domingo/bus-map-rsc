"use client";

import Image from "next/image";

interface HeaderProps {
  showOnlyStarred: boolean;
  onToggleStarred: () => void;
}

export function Header({ showOnlyStarred, onToggleStarred }: HeaderProps) {
  return (
    <header
      className="flex flex-row items-center absolute top-0 right-0 left-0 p-1 z-10"
      style={{ backgroundColor: "rgba(8, 139, 159, 0.8)" }}
    >
      <div className="flex flex-col items-center flex-1">
        <a href="https://quantriga.com" className="flex items-center">
          <Image
            src="/busIcon.svg"
            alt="Bus icon"
            width={32}
            height={32}
            className="mr-2"
          />
          <h1 className="text-white font-bold text-lg m-0">QuanTriga.com</h1>
        </a>
        <div className="text-white text-center text-xs mt-1">
          Consulta en temps real l'arribada dels propers busos.
        </div>
      </div>
      <button
        className="w-8 h-8 border-none text-white cursor-pointer flex items-center justify-center text-xl hover:bg-white/20 rounded transition-colors mr-2 flex-shrink-0"
        aria-label={
          showOnlyStarred
            ? "Mostrar totes les parades"
            : "Mostrar només parades preferides"
        }
        onClick={onToggleStarred}
        type="button"
        title={
          showOnlyStarred
            ? "Mostrar totes les parades"
            : "Mostrar només parades preferides"
        }
      >
        {showOnlyStarred ? "★" : "☆"}
      </button>
    </header>
  );
}
