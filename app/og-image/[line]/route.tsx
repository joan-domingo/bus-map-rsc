import {
  buildOgImageAlt,
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  renderOgImage,
} from "../../../lib/og/og-image";
import { resolveLineSlug } from "../../../lib/utils/seo";

export const runtime = "edge";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

interface LineOgRouteProps {
  params: Promise<{
    line: string;
  }>;
}

export async function GET(_request: Request, { params }: LineOgRouteProps) {
  const { line } = await params;
  const resolved = resolveLineSlug(line);

  if (!resolved || resolved.canonicalSlug !== line.toLowerCase()) {
    return new Response("Not found", { status: 404 });
  }

  return renderOgImage(resolved.lineName);
}
