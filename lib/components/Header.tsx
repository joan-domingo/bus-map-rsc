"use client";

import Image from "next/image";
import { buildLinePagePath, getPriorityLineSlugs } from "../utils/seo";

interface HeaderProps {
  showOnlyStarred: boolean;
  onToggleStarred: () => void;
  highlightedLineName?: string;
}

export function Header({
  showOnlyStarred,
  onToggleStarred,
  highlightedLineName,
}: HeaderProps) {
  const priorityLines = getPriorityLineSlugs().slice(0, 3);

  return (
    <header
      className="flex flex-row items-center absolute top-0 right-0 left-0 p-1 z-10"
      style={{ backgroundColor: "rgba(8, 139, 159, 0.8)" }}
    >
      <div className="flex flex-col items-center flex-1">
        <a href="/" className="flex items-center">
          <Image
            src="/busIcon.svg"
            alt=""
            width={32}
            height={32}
            className="mr-2"
            aria-hidden
          />
          <h1 className="text-white text-center text-sm font-semibold mt-1 m-0">
          {highlightedLineName
            ? `QuanTriga.com | Bus ${highlightedLineName.toUpperCase()} temps real · Moventis`
            : "QuanTriga.com | Moventis temps real"}
        </h1>
        </a>
        <p className="text-white/90 text-center text-[11px] mt-0.5 m-0">
          {highlightedLineName
            ? `Properes arribades i parades de la línia ${highlightedLineName.toUpperCase()} al mapa.`
            : "Mapa interactiu amb parades i horaris actualitzats de Moventis."}
        </p>
        <nav className="mt-1 text-[11px] text-white/90" aria-label="Línies destacades">
          {priorityLines.map((line, index) => (
            <span key={line}>
              {index > 0 ? " · " : null}
              <a className="hover:underline" href={buildLinePagePath(line)}>
                {line.toUpperCase()} temps real
              </a>
            </span>
          ))}
          {" · "}
          <a className="hover:underline" href="/linies">
            Totes les línies
          </a>
        </nav>
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
