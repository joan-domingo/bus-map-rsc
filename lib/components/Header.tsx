import Image from "next/image";

export function Header() {
  return (
    <header
      className="flex flex-col items-center justify-center absolute top-0 right-0 left-0 p-1 z-10"
      style={{ backgroundColor: "rgba(8, 139, 159, 0.8)" }}
    >
      <div className="flex items-center">
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
      </div>
      <div className="text-white text-center text-xs mt-1">
        Consulta en temps real l'arribada dels propers busos.
      </div>
    </header>
  );
}
