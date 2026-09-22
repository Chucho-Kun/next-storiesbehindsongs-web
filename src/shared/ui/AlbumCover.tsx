"use client";

import Image from "next/image";
import { useState } from "react";

/** YouTube answers 404 for a deleted video but still sends a 120x90 grey
 * placeholder as the body, which the browser loads as a valid image. Real
 * `hqdefault` thumbnails are 480px wide. */
const PLACEHOLDER_MAX_WIDTH = 120;

/** Album covers are hotlinked YouTube thumbnails, and some of those videos no
 * longer exist, so a failed load falls back to a neutral box with the name. */
export function AlbumCover({ src, name }: { src: string; name: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        translate="no"
        className="notranslate flex h-full w-full items-center justify-center bg-neutral-800 p-3 text-center text-sm font-semibold text-neutral-300"
      >
        {name}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={`${name} cover`}
      fill
      sizes="224px"
      unoptimized
      onError={() => setFailed(true)}
      onLoad={(event) => {
        if (event.currentTarget.naturalWidth <= PLACEHOLDER_MAX_WIDTH) setFailed(true);
      }}
      translate="no"
      className="notranslate object-cover"
    />
  );
}
