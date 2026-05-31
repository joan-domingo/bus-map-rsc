import {
  buildOgImageAlt,
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  renderOgImage,
} from "../../lib/og/og-image";

export const runtime = "edge";
export const alt = buildOgImageAlt();
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export async function GET() {
  return renderOgImage();
}
