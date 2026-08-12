/**
 * Central image registry — swap final brand photography here only.
 * Prefer Unsplash (stock) until brand assets land.
 */
import logoAlmaali from '../assets/images/logo_almaali.png';
import masarLogo from '../assets/images/masarlogo.png';
import lobbyLocal from '../assets/images/luxury_clinic_lobby_1782557901585.jpg';
import suiteLocal from '../assets/images/luxury_treatment_room_1782557916125.jpg';

const u = (id: string, w = 1600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const STOCK = {
  clinicLobby: lobbyLocal,
  treatmentSuite: suiteLocal,
  clinicModern: u('photo-1629909613654-28e377c37b09'),
  clinicChair: u('photo-1606811841689-23dfddce3e95'),
  dentalTools: u('photo-1609840114035-3c981b782dfe'),
  smileClose: u('photo-1606811971618-4486d14f3f99'),
  veneers: u('photo-1588776814546-1ffcf47267a5'),
  microscope: u('photo-1579684389782-64d84b5e901a'),
  whitening: u('photo-1598256989800-fe5f95da9787'),
  aligners: u('photo-1600170311833-c2cf5280ce49'),
  implant: u('photo-1606265752439-1f18756aa5fc'),
  spaDental: u('photo-1519494026892-80bbd2d6fd0d'),
  luxuryInterior: u('photo-1631217868269-e07c9f417d0e'),
  consultation: u('photo-1559839734-2b71ea197ec2'),
  surgeon: u('photo-1622253692010-333f2da6031d'),
  orthodontist: u('photo-1551836022-d5d88e9218df', 800),
  patientSmile: u('photo-1524504388940-b1c1722653e1', 800),
  portraitMan: u('photo-1507003211169-0a1dd7228f2d', 800),
  portraitWoman: u('photo-1494790108377-be9c29b29330', 800),
  portraitDoctor: u('photo-1551836022-d5d88e9218df', 800),
  heroOverlay: u('photo-1629909615184-74f495363b45'),
  detailMacro: u('photo-1598256989800-fe5f95da9787', 1200),
  galleryCase2: u('photo-1606811841689-23dfddce3e95'),
  galleryCase3: u('photo-1593022356769-11ef838df8f5'),
  blogTech: u('photo-1629909613654-28e377c37b09'),
  blogAesthetic: u('photo-1588776814546-1ffcf47267a5'),
  blogCare: u('photo-1579684389782-64d84b5e901a'),
} as const;

export const IMAGES = {
  logo: logoAlmaali,
  masarLogo,
  hero: STOCK.clinicLobby,
  heroSecondary: STOCK.heroOverlay,
  heroAlt: STOCK.treatmentSuite,
  about: STOCK.clinicModern,
  aboutStack: [STOCK.clinicModern, STOCK.smileClose, STOCK.treatmentSuite, STOCK.microscope] as string[],
  cta: STOCK.treatmentSuite,
  vision: STOCK.clinicChair,
  services: {
    'smile-design': STOCK.veneers,
    'micro-implants': STOCK.implant,
    'laser-whitening': STOCK.whitening,
    aligners: STOCK.aligners,
  } as Record<string, string>,
  testimonials: {
    t1: STOCK.portraitMan,
    t2: STOCK.portraitDoctor,
    t3: STOCK.portraitWoman,
  } as Record<string, string>,
  placeholders: {
    doctor: STOCK.consultation,
    clinic: STOCK.clinicLobby,
    case: STOCK.smileClose,
    blog: STOCK.blogTech,
    any: STOCK.clinicModern,
  },
} as const;

/** Resolve a usable image URL with stock fallback. */
export function resolveImage(src?: string | null, fallback: string = IMAGES.placeholders.any): string {
  if (!src || src.trim() === '' || src === 'null' || src === 'undefined') return fallback;
  return src;
}

export const WHATSAPP = {
  number: '966114889000',
  href: 'https://wa.me/966114889000',
  phoneDisplay: '+966 11 488 9000',
  tel: 'tel:+966114889000',
} as const;

export function whatsappDoctorMessage(doctorName: string, lang: 'ar' | 'en') {
  const text =
    lang === 'ar'
      ? `مرحباً، أود حجز استشارة فاخرة مع ${doctorName} في عيادات المعالي.`
      : `Hello, I would like to book a luxury consultation with ${doctorName} at Al Maali Clinics.`;
  return `${WHATSAPP.href}?text=${encodeURIComponent(text)}`;
}
