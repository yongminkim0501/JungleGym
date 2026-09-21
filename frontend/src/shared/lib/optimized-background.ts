import { getImageProps } from "next/image";

type BackgroundImageOptions = {
  src: string;
  width: number;
  height: number;
};

export function optimizedBackgroundImage(options: BackgroundImageOptions): string {
  const {
    props: { src, srcSet },
  } = getImageProps({ ...options, alt: "" });

  if (!srcSet) return `url(${JSON.stringify(src)})`;

  const candidates = srcSet.split(", ").map((candidate) => {
    const separator = candidate.lastIndexOf(" ");
    const url = candidate.slice(0, separator);
    const density = candidate.slice(separator + 1);
    return `url(${JSON.stringify(url)}) ${density}`;
  });

  return `image-set(${candidates.join(", ")})`;
}
