import { notFound, permanentRedirect } from "next/navigation";
import { buildLinePagePath, resolveLineSlug } from "../../../lib/utils/seo";

interface LegacyLinePageProps {
  params: Promise<{
    line: string;
  }>;
}

export default async function LegacyLinePage({ params }: LegacyLinePageProps) {
  const { line } = await params;
  const resolved = resolveLineSlug(line);

  if (!resolved) {
    notFound();
  }

  permanentRedirect(buildLinePagePath(resolved.canonicalSlug));
}
