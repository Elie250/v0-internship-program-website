import { font } from '@/src/theme'

/** Official IBM Plex Sans files (OFL 1.1). Loaded before first branded paint. */
export const plexFontMap = {
  [font.regular]: require('../assets/fonts/IBMPlexSans-Regular.ttf'),
  [font.medium]: require('../assets/fonts/IBMPlexSans-Medium.ttf'),
  [font.semibold]: require('../assets/fonts/IBMPlexSans-SemiBold.ttf'),
  [font.bold]: require('../assets/fonts/IBMPlexSans-Bold.ttf'),
}
