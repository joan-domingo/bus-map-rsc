export function Attribution() {
  return (
    <div
      className="flex justify-center items-center absolute bottom-0 right-0 left-0 bg-white bg-opacity-80 text-black text-sm pt-2 z-10"
      style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom, 0px))" }}
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
