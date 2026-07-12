export type SiteLocale = 'en' | 'rw'

export const SITE_LOCALES: { id: SiteLocale; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'rw', label: 'Kinyarwanda' },
]

const libraryMessages = {
  en: {
    title: 'Energy Library',
    subtitle: 'Browse our company gallery, engineering projects, books, and culture.',
    projectsTitle: 'Engineering projects',
    projectsSubtitle: 'Student and team builds showcased by Energy & Logics.',
    viewAllProjects: 'View all projects',
    photosEvents: 'Photos & events',
    engineeringProject: 'Engineering project',
    team: 'Team',
    year: 'Year',
    technologies: 'Technologies',
  },
  rw: {
    title: 'Isomero rya Energy',
    subtitle: 'Reba amafoto, imishinga yubatsi, ibitabo n\'umuco wa Energy & Logics.',
    projectsTitle: 'Imishinga yubatsi',
    projectsSubtitle: 'Imishinga y\'abanyeshuri n\'itsinda ryacu yerekanywe na Energy & Logics.',
    viewAllProjects: 'Reba imishinga yose',
    photosEvents: 'Amafoto n\'ibikorwa',
    engineeringProject: 'Umushinga w\'ubuhanzi',
    team: 'Itsinda',
    year: 'Umwaka',
    technologies: 'Ikoranabuhanga',
  },
} as const

export function getLibraryMessages(locale: SiteLocale = 'en') {
  return libraryMessages[locale] ?? libraryMessages.en
}

export function parseSiteLocale(value?: string | null): SiteLocale {
  return value === 'rw' ? 'rw' : 'en'
}
