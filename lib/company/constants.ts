/** Single source of truth for Energy & Logics public company details. */
export const COMPANY = {
  legalName: 'Energy and Logics Ltd',
  brandName: 'Energy & Logics',
  platformName: 'Engineering Hub',
  tagline: 'Hands-on engineering training and technical support in Rwanda.',
  email: 'admin@energyandlogics.com',
  phone: '+2507783986252',
  phoneDisplay: '+250 778 398 252',
  whatsapp: '2507783986252',
  address: 'Nyanza, Rwanda',
  logoUrl: '/images/energy-logics-logo.png',
  region: 'East Africa',
  timezone: 'Central Africa Time (CAT, UTC+2)',
} as const

export const FOUNDER = {
  name: 'Elie Bisamaza',
  title: 'Embedded Systems Engineer',
  role: 'Founder & Lead Trainer',
  photo: '/team/elie-bisamaza.png',
  bio: `Elie Bisamaza is an Embedded Systems Engineer and the founder and lead trainer at Energy & Logics Ltd. He brings six years of experience in electrical technology and more than two years of delivering practical technical training.

Elie has collaborated on training projects with the Rwanda TVET Board (RTB) and has worked with technology companies such as Easy Fab. His approach combines real industry experience with structured workshops—helping students, technicians, and graduates build skills they can apply immediately in the field.`,
  experienceHighlights: [
    '6+ years in electrical technology',
    '2+ years in technical training delivery',
    'Training collaboration with RTB (Rwanda TVET Board)',
    'Industry experience with companies including Easy Fab',
  ],
} as const

export const TRAINING_PROGRAMS = [
  {
    id: 'embedded-systems',
    title: 'Embedded Systems',
    summary:
      'Microcontrollers, firmware basics, sensors, and practical IoT projects for students and technicians.',
    topics: ['Arduino & microcontrollers', 'Sensors & actuators', 'Firmware fundamentals', 'Project-based labs'],
    href: '/learning',
  },
  {
    id: 'industrial-control',
    title: 'Industrial Control Systems',
    summary:
      'PLC programming, industrial automation, control panels, and troubleshooting for factory and site work.',
    topics: ['PLC & ladder logic', 'Industrial automation', 'Control panel wiring', 'Fault finding on site'],
    href: '/learning',
  },
  {
    id: 'advanced-electrical',
    title: 'Advanced Electrical Technology',
    summary:
      'Power systems, protection, installation practice, and applied electrical engineering for career advancement.',
    topics: ['Power & protection', 'Electrical installation', 'Solar & power applications', 'Safety & standards'],
    href: '/learning',
  },
] as const

export const PAYMENT = {
  method: 'MTN Mobile Money (MoMo Pay)',
  momoPayCode: '4402091',
  accountName: 'Energy and Logics Ltd',
  workflow:
    'Pay via MTN MoMo using the Pay Code below, then upload your payment receipt so our team can verify and confirm your enrollment.',
  steps: [
    'Dial MTN MoMo or use the MoMo app and select Pay Code / Merchant payment.',
    'Enter Pay Code 4402091 — account name: Energy and Logics Ltd.',
    'Pay the amount shown on your program or invoice.',
    'Save your MoMo confirmation SMS or screenshot as your receipt.',
    'Submit the receipt through your application or the Payment Receipt page for admin verification.',
  ],
} as const

export const ABOUT_DEFAULT = `${COMPANY.brandName} Ltd is a Rwanda-based engineering company focused on practical training, technical support, and career pathways for students, graduates, and technicians across East Africa.

Through our ${COMPANY.platformName} platform, we deliver structured programmes in embedded systems, industrial control, and advanced electrical technology—combining classroom instruction, lab work, and real project experience.`

export const MISSION_DEFAULT = `We bridge the gap between classroom theory and industry practice by delivering hands-on engineering training, mentorship, and technical support—so our learners are ready to work, build, and solve real problems in Rwanda and the wider region.`
