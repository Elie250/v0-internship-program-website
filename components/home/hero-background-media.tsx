import Image from 'next/image'
import { isVideoBackgroundUrl } from '@/lib/media/background-media'

export function HeroBackgroundMedia({
  src,
  alt,
}: {
  src: string
  alt: string
}) {
  if (isVideoBackgroundUrl(src)) {
    return (
      <video
        src={src}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover object-center scale-105"
      />
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover object-center scale-105"
      priority
    />
  )
}
