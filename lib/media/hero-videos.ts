/** Homepage hero background videos (played in order; each runs to natural end). */
export const HERO_VIDEO_PLAYLIST = [
  {
    src: '/videos/e-learning.mp4',
    type: 'video/mp4',
    label: 'E-learning',
  },
  {
    src: '/videos/transmission-line.mp4',
    type: 'video/mp4',
    label: 'Transmission line',
  },
  {
    src: '/videos/embedded-programming.mp4',
    type: 'video/mp4',
    label: 'Embedded programming',
  },
  {
    src: '/videos/electronics.mov',
    type: 'video/quicktime',
    label: 'Electronics',
  },
] as const

export type HeroVideoSlide = (typeof HERO_VIDEO_PLAYLIST)[number]
