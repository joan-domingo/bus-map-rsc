export default function Image({ src, alt, ...props }: any) {
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  return <img src={src} alt={alt} {...props} />;
}
