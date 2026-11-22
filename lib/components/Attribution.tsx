interface Props {
  isStopSelected?: boolean;
}

export function Attribution({ isStopSelected = false }: Props) {
  return (
    <div
      className={`absolute bottom-0 right-0 left-0 flex items-center justify-center bg-white/80 pt-2 text-sm text-black ${isStopSelected ? "z-40" : "z-10"}`}
      style={{
        paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom, 0px))",
      }}
    >
      Dades proporcionades per{" "}
      <a
        href="https://www.moventis.es/ca/temps-real"
        target="_blank"
        rel="noreferrer"
        className="ml-1 text-blue-600 hover:text-blue-800 underline"
      >
        Moventis
      </a>
    </div>
  );
}
