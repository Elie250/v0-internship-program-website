/** Single source of truth for Energy & Logics public company details. */
export const COMPANY = {
  legalName: 'Energy and Logics Ltd',
  brandName: 'Energy & Logics',
  platformName: 'Engineering Hub',
  slogan: 'Engineering sustainable solutions',
  tagline: 'Hands-on engineering training and technical support in Rwanda.',
  email: 'admin@energyandlogics.com',
  phone: '+250783986252',
  phoneDisplay: '+250 783 986 252',
  whatsapp: '250783986252',
  address: 'Kigali, Rwanda',
  logoUrl: '/images/energy-logics-logo.png',
  region: 'East Africa',
  timezone: 'Central Africa Time (CAT, UTC+2)',
  /** Canonical public site URL used on certificates and QR codes */
  publicSiteUrl: 'https://www.energyandlogics.com',
} as const

export const FOUNDER = {
  name: 'Elie Bisamaza',
  title: 'Embedded Systems Engineer',
  role: 'Founder & Lead Trainer',
  photo: '/team/elie-bisamaza.png',
  headline: 'Engineering education that works in the real world',
  concept:
    'Energy & Logics exists to close the gap between classroom theory and what technicians, graduates, and professionals actually do on site—programming PLCs, wiring control panels, building embedded prototypes, and troubleshooting under pressure.',
  bio: `Elie Bisamaza founded ${COMPANY.brandName} after six years in electrical technology and two years delivering hands-on technical training across Rwanda. He has worked with industry partners including Easy Fab and collaborated with the Rwanda TVET Board (RTB) on practical skills programmes.

His training philosophy is simple: learn by building, test on real equipment, and leave every session with something you can demonstrate to an employer or apply on your next project.`,
  experienceHighlights: [
    '6+ years in electrical & embedded systems practice',
    '2+ years delivering industry-aligned technical training',
    'RTB (Rwanda TVET Board) training collaboration',
    'Field experience with companies including Easy Fab',
  ],
  quote:
    'Our goal is not certificates for their own sake—it is competent engineers who can walk onto a site or into a lab and deliver results.',
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

export const VISION_DEFAULT = `A region where every engineering graduate and technician can demonstrate real skills—programming controls, wiring panels, building embedded systems, and troubleshooting on site—with confidence and professional integrity.`

export const COMPANY_EXPERIENCE = {
  title: 'Professional Experience',
  subtitle:
    'A track record of hands-on engineering practice, industry-aligned training, and partnerships that keep our programmes grounded in real work.',
  stats: [
    { value: '6+', label: 'Years in electrical & embedded systems practice' },
    { value: '2+', label: 'Years delivering technical training' },
    { value: '3', label: 'Core engineering programme tracks' },
    { value: 'RTB', label: 'Rwanda TVET Board collaboration' },
  ],
  milestones: [
    {
      period: '2018–2024',
      title: 'Field & industrial practice',
      description:
        'Hands-on work in electrical technology, control systems, and embedded prototypes for employers and project sites across Rwanda.',
    },
    {
      period: '2022–present',
      title: 'Technical training delivery',
      description:
        'Structured programmes for students, graduates, and technicians—combining lab work, real equipment, and project-based assessment.',
    },
    {
      period: '2023',
      title: 'RTB training collaboration',
      description:
        'Partnered with the Rwanda TVET Board on practical skills programmes aligned with national vocational standards.',
    },
    {
      period: 'Today',
      title: 'Engineering Hub platform',
      description:
        'Online and in-person learning through our Engineering Hub—courses, Field Notes, shop, and mentor support in one place.',
    },
  ],
  capabilities: [
    {
      title: 'Industrial control',
      items: ['PLC & ladder logic', 'Control panel wiring', 'Factory & site troubleshooting'],
    },
    {
      title: 'Embedded systems',
      items: ['Microcontrollers & firmware', 'Sensors & IoT labs', 'Prototype development'],
    },
    {
      title: 'Electrical technology',
      items: ['Power & protection', 'Installation practice', 'Solar & applied power systems'],
    },
  ],
  partners: ['Rwanda TVET Board (RTB)', 'Easy Fab', 'Employers & technicians across Rwanda'],
} as const

export const GOALS_DEFAULT = [
  'Deliver practical, industry-aligned training in embedded systems, industrial control, and electrical technology.',
  'Connect students and graduates with mentors, field notes, and a community of practicing engineers.',
  'Support employers with job-ready talent and ongoing technical assistance through our Engineering Hub.',
  'Make quality engineering education accessible across Rwanda and East Africa through online and in-person programmes.',
  'Promote continuous learning through Field Notes, workshops, and open collaboration between lecturers and learners.',
] as const
