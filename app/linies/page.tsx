import type { Metadata } from "next";
import { getAllSeoLineEntries } from "../../lib/utils/seo";

export const metadata: Metadata = {
  title: "Totes les línies Moventis en temps real",
  description:
    "Index de línies Moventis en temps real. Accedeix ràpidament a cada línia per veure parades i properes arribades.",
  alternates: {
    canonical: "/linies",
  },
};

export default function LinesIndexPage() {
  const lines = getAllSeoLineEntries();

  return (
    <main className="h-screen overflow-y-auto bg-white text-black p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-2">
        Línies Moventis en temps real
      </h1>
      <p className="text-sm mb-4">
        Selecciona una línia per veure el mapa i les arribades en temps real.
      </p>
      <p className="text-sm mb-6">
        <a className="underline" href="/">
          Tornar al mapa general
        </a>
      </p>
      <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-sm pb-8">
        {lines.map((line) => (
          <li key={line.slug}>
            <a className="underline" href={`/linea/${line.slug}`}>
              {line.name}
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
