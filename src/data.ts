/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Service, Doctor, Testimonial, GalleryItem, BlogPost } from './types';
import { STOCK } from './lib/images';

export const TRANSLATIONS = {
  ar: {
    brandName: "عيادات المعالي",
    brandSubtitle: "فن نحت الابتسامة الفاخرة",
    tagline: "حيث تجتمع الدقة متناهية الصغر مع الرفاهية المطلقة",
    seoTitle: "عيادات المعالي | طب أسنان فاخر في الإمارات",
    seoDescription:
      "عيادات المعالي — حيث تجتمع الدقة متناهية الصغر مع الرفاهية المطلقة. تجميل وزراعة وتقويم بخبرة استثنائية.",

    // Navigation
    navHome: "الرئيسية",
    navAbout: "رؤيتنا",
    navServices: "التخصصات",
    navTeam: "الفريق الطبي",
    navGallery: "المعرض",
    navTestimonials: "آراء النخبة",
    navBook: "حجز موعد",
    navContact: "تواصل معنا",
    navBlog: "المدونة",

    // Blog
    blogSectionTitle: "مدونة المعالي",
    blogSectionSubtitle: "نصائح وإضاءات علمية لابتسامة صحية وساحرة من خبراء النخبة",
    blogReadMore: "اقرأ المقال الكامل",
    blogBack: "العودة إلى المقالات",
    blogShare: "مشاركة المقال",

    // Hero
    heroTitle: "ابتسامتك هي توقيعك الفريد",
    heroSubtitle: "في عيادات المعالي، لا نكتفي بتقديم علاجات نمطية؛ بل ننحت ابتسامة متناسقة تعزز ملامحك وتعبر عن ذاتك في ملاذٍ طبي مريحٍ يبتعد تمامًا عن أجواء العيادات التقليدية الباردة.",
    heroCTA: "تواصل معنا للاستشارة الفاخرة",
    heroExperience: "تجربة استثنائية",
    heroPrecise: "دقة متناهية",
    heroRelax: "ملاذ دافئ",

    // About
    aboutSectionTitle: "الفلسفة والقصة",
    aboutSectionSubtitle: "إعادة تعريف طب الأسنان الفاخر",
    aboutStoryTitle: "مفهوم البوتيك الطبي",
    aboutStoryParagraph1: "تأسست عيادتنا لتكون ملاذًا مريحًا يجمع بين الفن الراقي والعلم المتقدم. نحن نؤمن بأن علاج الأسنان يجب أن يكون تجربة ممتعة وهادئة، خالية من التوتر والترقب.",
    aboutStoryParagraph2: "نعتمد على التقنيات الرقمية ثلاثية الأبعاد والمجهرية لضمان أقصى درجات الدقة والراحة. هنا، نحرص على رعاية كل مريض كضيف شرف، مع باقة متكاملة من سبل الرفاهية الهادئة لراحة حواسك.",
    aboutPhilosophy1Title: "دقة مجهرية",
    aboutPhilosophy1Desc: "نستخدم مجاهر تكبير فائقة تسمح بتشخيص وعلاج التفاصيل غير المرئية بالعين المجردة لضمان استدامة العلاج.",
    aboutPhilosophy2Title: "مفهوم ملاذ الابتسامة",
    aboutPhilosophy2Desc: "تصميم داخلي بألوان ترابية ودافئة، وروائح عطرية مهدئة وموسيقى خافتة تأخذك في رحلة استرخاء حقيقية.",
    aboutPhilosophy3Title: "تصميم مخصص",
    aboutPhilosophy3Desc: "لا يوجد قالب موحد للابتسامة لدينا. نقوم بتصميم الابتسامة رقميًا بما يتوافق مع قياسات وجهك ولون بشرتك.",

    // Services
    servicesSectionTitle: "تخصصاتنا الاستثنائية",
    servicesSectionSubtitle: "علاجات مصممة بدقة لتلبي تطلعاتك",
    servicesCTA: "اكتشف الخدمة",
    servicesBack: "العودة للتخصصات",
    servicesDurationLabel: "المدة التقريبية للحالة:",

    // Team
    teamSectionTitle: "النخبة الطبية",
    teamSectionSubtitle: "أطباء يجمعون بين المعرفة الأكاديمية واللمسة الفنية",
    teamDegree: "الدرجة العلمية:",
    teamSpecialty: "الاهتمامات الخاصة:",
    teamTrustTitle: "لماذا تثق بفريقنا؟",
    teamTrustDesc: "أطباؤنا حاصلون على زمالات دولية ومحاضرون في مؤتمرات طب الأسنان التجميلي العالمي، يجمعهم شغف مشترك بالتفاصيل الدقيقة والنتائج الطبيعية تمامًا.",

    // Gallery
    gallerySectionTitle: "أبعاد الجمال",
    gallerySectionSubtitle: "جولة بصرية في عوالم الفخامة والدقة",
    galleryFilterAll: "الكل",
    galleryFilterClinic: "مساحة العيادة",
    galleryFilterCases: "حالات تجميلية",
    galleryBefore: "قبل العلاج",
    galleryAfter: "بعد العلاج",

    // Testimonials
    testimonialsSectionTitle: "آراء النخبة",
    testimonialsSectionSubtitle: "قصص نجاح من زوارنا الذين اختبروا الفارق",
    testimonialsVerified: "ضيف موثق",

    // Booking
    bookingSectionTitle: "تأكيد الحجز والاستشارة",
    bookingSectionSubtitle: "ابدأ رحلتك نحو ابتكار ابتسامتك المثالية",
    bookingFormTitle: "طلب موعد خاص",
    bookingFieldName: "الاسم الكامل",
    bookingFieldPhone: "رقم الهاتف",
    bookingFieldEmail: "البريد الإلكتروني",
    bookingFieldService: "الخدمة المطلوبة",
    bookingFieldDoctor: "الطبيب المفضل",
    bookingFieldDate: "التاريخ المناسب",
    bookingFieldTime: "الوقت المفضل",
    bookingFieldNotes: "ملاحظات إضافية أو مخاوف تود مشاركتها",
    bookingFieldPlaceholderName: "الرجاء إدخال اسمك الثنائي",
    bookingFieldPlaceholderPhone: "+966 50 000 0000",
    bookingFieldPlaceholderEmail: "name@example.com",
    bookingFieldPlaceholderNotes: "أخبرنا عن تفاصيل موعدك المفضلة أو أي استفسار طبي...",
    bookingSelectService: "اختر التخصص المطلوب",
    bookingSelectDoctor: "اختر الطبيب المعالج (اختياري)",
    bookingSubmit: "إرسال طلب الحجز الفاخر",
    bookingSuccessTitle: "تم استلام طلبكم بفخامة",
    bookingSuccessDesc: "نشكر اختياركم لعيادات المعالي. سيقوم منسق المواعيد الخاص بنا بالتواصل معكم هاتفيًا خلال الساعات القادمة لتأكيد موعدكم بدقة وتنسيق تفاصيل استقبالكم الحصري.",
    bookingSuccessButton: "حجز موعد آخر",
    bookingInfoTitle: "معلومات التواصل والاستقبال",
    bookingInfoDesc: "نحن هنا لاستقبالك كضيف استثنائي. يُرجى التكرم بتنسيق موعدك مسبقًا لضمان توفير كامل الخصوصية والراحة.",
    bookingAddress: "العنوان:",
    bookingAddressValue: "العين ، المعترض ، شارع العناجيج",
    bookingPhone: "هاتف الاستقبال:",
    bookingPhoneValue: "+971 52 164 5368",
    bookingEmail: "البريد الإلكتروني:",
    bookingEmailValue: "info@alamaali.ae",
    bookingHours: "أوقات الاستقبال:",
    bookingHoursValue: "السبت - الخميس: 10:00 صباحًا - 9:00 مساءً",

    // General UI
    langSwitch: "English",
    rightsReserved: "جميع الحقوق محفوظة لعيادات المعالي © 2026.",
    designedWithLove: "تم التطوير بواسطة وكالة مسار",
    interactive: "تفاعلي"
  },
  en: {
    brandName: "Al Maali Clinics",
    brandSubtitle: "The Art of Luxurious Smiles",
    tagline: "Where Microscopic Precision Meets Absolute Luxury",
    seoTitle: "Al Maali Clinics | Luxury Dentistry in the UAE",
    seoDescription:
      "Al Maali Clinics — where microscopic precision meets absolute luxury. Cosmetic dentistry, implants, and clear aligners in a boutique medical sanctuary.",

    // Navigation
    navHome: "Home",
    navAbout: "Our vision",
    navServices: "Specialties",
    navTeam: "Medical Team",
    navGallery: "Gallery",
    navTestimonials: "Elite Reviews",
    navBook: "Book Appointment",
    navContact: "Contact Us",
    navBlog: "Blog",

    // Blog
    blogSectionTitle: "Al Maali Blog",
    blogSectionSubtitle: "Scientific insights & tips for a healthy, vibrant smile from our elite experts",
    blogReadMore: "Read Full Article",
    blogBack: "Back to Articles",
    blogShare: "Share Article",

    // Hero
    heroTitle: "Your Smile is Your Unique Signature",
    heroSubtitle: "At Al Maali Clinics, we don't just perform routine dentistry; we sculpt bespoke smiles that harmonize with your features and express who you are, within a serene medical sanctuary designed to transcend traditional cold clinical atmospheres.",
    heroCTA: "Contact Us for Luxury Consultation",
    heroExperience: "Exquisite Care",
    heroPrecise: "Micro Precision",
    heroRelax: "Warm Sanctuary",

    // About
    aboutSectionTitle: "Philosophy & Story",
    aboutSectionSubtitle: "Redefining Luxury Dental Care",
    aboutStoryTitle: "The Concept of Medical Boutique",
    aboutStoryParagraph1: "Our clinic was established to be a tranquil haven where sophisticated artistry and advanced dental science unite. We believe dental treatments should be a peaceful, meditative experience, completely free from traditional clinic anxieties.",
    aboutStoryParagraph2: "We utilize advanced 3D digital imaging and magnification microscopes to ensure absolute precision and comfort. Here, we care for every patient as an esteemed guest, offering a selected range of sensory details to keep you relaxed.",
    aboutPhilosophy1Title: "Microscopic Precision",
    aboutPhilosophy1Desc: "Using ultra-high magnification microscopes allows us to diagnose and address sub-millimeter details for highly durable and pristine results.",
    aboutPhilosophy2Title: "Sanctuary Concept",
    aboutPhilosophy2Desc: "Warmed earth tones, soothing aromatic essences, and delicate acoustic compositions guide your senses into complete relaxation.",
    aboutPhilosophy3Title: "Bespoke Sculpting",
    aboutPhilosophy3Desc: "No generic solutions. Every smile design is custom planned digitally to complement your facial structures, alignment, and natural skin undertones.",

    // Services
    servicesSectionTitle: "Our Curated Specialties",
    servicesSectionSubtitle: "Custom treatments tailored to your aesthetic aspirations",
    servicesCTA: "Explore Specialty",
    servicesBack: "Back to Specialties",
    servicesDurationLabel: "Approximate Duration:",

    // Team
    teamSectionTitle: "The Medical Elite",
    teamSectionSubtitle: "Clinicians combining academic excellence and artistic touch",
    teamDegree: "Credentials:",
    teamSpecialty: "Bespoke Focus:",
    teamTrustTitle: "Why Trust Our Elite Team?",
    teamTrustDesc: "Our dental specialists hold international fellowships and serve as lecturers in global cosmetic dentistry conferences. They share a profound passion for invisible margins and completely natural-looking results.",

    // Gallery
    gallerySectionTitle: "Aesthetic Dimensions",
    gallerySectionSubtitle: "A visual journey into our space and pristine case designs",
    galleryFilterAll: "All",
    galleryFilterClinic: "Boutique Space",
    galleryFilterCases: "Smile Designs",
    galleryBefore: "Before",
    galleryAfter: "After",

    // Testimonials
    testimonialsSectionTitle: "Elite Reviews",
    testimonialsSectionSubtitle: "Real stories from guests who experienced the Al Maali difference",
    testimonialsVerified: "Verified Guest",

    // Booking
    bookingSectionTitle: "Exquisite Scheduling",
    bookingSectionSubtitle: "Begin your personal smile transformation journey",
    bookingFormTitle: "Request Private Appointment",
    bookingFieldName: "Full Name",
    bookingFieldPhone: "Phone Number",
    bookingFieldEmail: "Email Address",
    bookingFieldService: "Desired Specialty",
    bookingFieldDoctor: "Preferred Specialist",
    bookingFieldDate: "Preferred Date",
    bookingFieldTime: "Preferred Time Window",
    bookingFieldNotes: "Special Notes or Comfort Requests",
    bookingFieldPlaceholderName: "Please enter your full name",
    bookingFieldPlaceholderPhone: "+1 (555) 000-0000",
    bookingFieldPlaceholderEmail: "name@example.com",
    bookingFieldPlaceholderNotes: "Tell us how we can personalize your arrival, or detail your oral health aspirations...",
    bookingSelectService: "Select Desired Treatment",
    bookingSelectDoctor: "Select Preferred Specialist (Optional)",
    bookingSubmit: "Submit Luxury Booking Request",
    bookingSuccessTitle: "Request Received Elegantly",
    bookingSuccessDesc: "Thank you for choosing Al Maali. Our dedicated guest coordinator will contact you by phone shortly to coordinate your arrival details and finalize your exclusive reservation.",
    bookingSuccessButton: "Book Another Appointment",
    bookingInfoTitle: "Boutique Location & Reception",
    bookingInfoDesc: "We look forward to hosting you as our guest. Appointments are meticulously arranged to ensure ultimate privacy and customized attention.",
    bookingAddress: "Address:",
    bookingAddressValue: "King Abdulaziz Road, Al-Rawdah Luxury District, Riyadh, Kingdom of Saudi Arabia",
    bookingPhone: "Reception Line:",
    bookingPhoneValue: "+971 52 164 5368",
    bookingEmail: "Concierge Email:",
    bookingEmailValue: "info@alamaali.ae",
    bookingHours: "reception Hours:",
    bookingHoursValue: "Saturday - Thursday: 10:00 AM - 9:00 PM",

    // General UI
    langSwitch: "العربية",
    rightsReserved: "All rights reserved to Al Maali Clinics © 2026.",
    designedWithLove: "Developed by Masar Agency",
    interactive: "Interactive"
  }
};

export const SERVICES: Service[] = [
  {
    id: "smile-design",
    iconName: "Gem",
    title: {
      ar: "تصميم الابتسامة ثلاثي الأبعاد والعدسات الفاخرة",
      en: "Bespoke 3D Smile Design & Ultra-Thin Veneers"
    },
    description: {
      ar: "ابتكار قشرة تجميلية فائقة الرقة (Veneers) تعزز بريق ابتسامتك الطبيعي بأقل تدخل ممكن وتناسق حيوي مذهل.",
      en: "Sculpting microscopic, ultra-thin porcelain veneers that blend seamlessly with your facial anatomy to reflect natural brilliance."
    },
    details: {
      ar: [
        "جلسة تصوير احترافية وتحليل رقمي لخطوط الابتسامة والوجه",
        "محاكاة بصرية ثلاثية الأبعاد لرؤية النتيجة ومناقشتها قبل البدء",
        "عدسات تلامسية فائقة الرقة مصنوعة يدويًا من البورسلين السويسري",
        "تنسيق لون مخصص يحاكي شفافية وحيوية السن الطبيعي تمامًا"
      ],
      en: [
        "Professional photographic session & digital mapping of facial landmarks",
        "3D mock-up visual simulations to review your design before any preparation",
        "Bespoke, hand-layered Swiss porcelain restorations meticulously bonded",
        "Custom shade grading that replicates natural light transmission and tooth opacity"
      ]
    },
    duration: {
      ar: "جلستان إلى ٣ جلسات عمل",
      en: "2 to 3 sessions"
    },
    image: STOCK.veneers
  },
  {
    id: "micro-implants",
    iconName: "ShieldCheck",
    title: {
      ar: "زراعة الأسنان المجهرية الفورية",
      en: "Microscopic Immediate Dental Implants"
    },
    description: {
      ar: "استعادة الأسنان المفقودة بجراحة رقمية موجهة بالغة الدقة وتثبيت تيجان مؤقتة فورية فائقة الأناقة في نفس اليوم.",
      en: "Replacing teeth using guided microscopic surgery, delivering stunning immediate luxury temporary crowns in a single day."
    },
    details: {
      ar: [
        "تخطيط حاسوبي ثلاثي الأبعاد لتحديد زوايا الغرس بدقة ميكرومترية",
        "استخدام مجهر جراحي متطور لتقليل الجروح وضمان التئام فائق السرعة",
        "زرعات مصنوعة من تيتانيوم وزركونيا نقي متوافق حيويًا بالكامل",
        "تحميل فوري لتيجان مؤقتة عالية الجودة للحفاظ على جمال مظهرك منذ اليوم الأول"
      ],
      en: [
        "3D computer-guided surgical templates guaranteeing micrometer accuracy",
        "High-definition surgical microscopy to minimize tissue trauma and speed recovery",
        "Pure biocompatible titanium and zirconia premium materials for longevity",
        "Immediate temporary high-aesthetic restoration fitted on the same day"
      ]
    },
    duration: {
      ar: "جلسة واحدة للزراعة والاستلام المؤقت",
      en: "Single-day surgery & immediate provisional"
    },
    image: STOCK.implant
  },
  {
    id: "laser-whitening",
    iconName: "Sun",
    title: {
      ar: "تبييض الأسنان بالليزر وجلسات المنتجع التجميلي",
      en: "Laser Teeth Whitening & Dental Spa Therapy"
    },
    description: {
      ar: "إشراقة آمنة ومدروسة تحت مجهر التبييض الطبي مع نظام حماية اللثة وعلاج حساسية الأسنان المبتكر.",
      en: "Advanced gentle laser activation to safely lift deep discoloration paired with rich enamel-soothing mineralization treatments."
    },
    details: {
      ar: [
        "تقييم دقيق لنوع التصبغات وملاءمة درجات التبييض لبياض طبيعي",
        "عزل كامل للثة باستخدام واقي اللاتكس السائل وحماية الحواف التجميلية",
        "تحفيز الليزر الدقيق لتسريع التبييض دون التسبب في حساسية الأسنان",
        "جلسة تدليك للفكين مع روائح مهدئة لتستمتع بالاسترخاء التام"
      ],
      en: [
        "Precise enamel density analysis ensuring optimal shade outcome",
        "Complete gingival liquid dam barrier protection with margin sealing",
        "Laser-activated technology that lifts up to 8 shades with zero pain",
        "Complimentary luxury facial lymphatic and jaw relaxation therapy"
      ]
    },
    duration: {
      ar: "جلسة واحدة (ساعة ونصف)",
      en: "1 session (90 minutes)"
    },
    image: STOCK.whitening
  },
  {
    id: "aligners",
    iconName: "RotateCw",
    title: {
      ar: "تقويم الأسنان الشفاف ثلاثي الأبعاد",
      en: "Interactive 3D Clear Aligners"
    },
    description: {
      ar: "تقويم غير مرئي تمامًا مصمم رقميًا لتعديل مصفوفة أسنانك بنعومة فائقة ودون الحاجة لأسلاك معدنية تخدش رقتك.",
      en: "Invisible, comfortable custom orthodontic aligners designed with smart predictive technology to realign your teeth."
    },
    details: {
      ar: [
        "مسح رقمي ثلاثي الأبعاد باستخدام ماسح iTero الرقمي الفاخر",
        "رؤية حركة أسنانك وتغيرها خطوة بخطوة من خلال فيديو محاكاة مخصص",
        "قوالب رقيقة وشفافة مصنوعة من خامات طبية فاخرة ومريحة للنطق",
        "متابعة دورية عن بُعد أو في العيادة بتنسيق يناسب جدول أعمالك المزدحم"
      ],
      en: [
        "High-definition digital impression scanning via iTero luxury technology",
        "Advanced simulation video tracking your tooth migration milestones",
        "Sleek, transparent medical-grade polyurethane comfortable for elocution",
        "Connoisseur virtual check-ins tailored around your busy global travel schedule"
      ]
    },
    duration: {
      ar: "٦ أشهر إلى ١٢ شهرًا حسب الحالة",
      en: "6 to 12 months on average"
    },
    image: STOCK.aligners
  }
];

export const DOCTORS: Doctor[] = [
  {
    id: "dr-sarah",
    name: {
      ar: "د. سارة الهاشمي",
      en: "Dr. Sarah Al-Hashimi"
    },
    role: {
      ar: "كبير استشاريي تجميل ونحت الأسنان ورئيسة العيادة",
      en: "Chief of Aesthetic Dentistry & Aesthetic Director"
    },
    bio: {
      ar: "متخصصة في الفينير المجهري فائق الدقة وتصميم الابتسامة المدمج. تؤمن بأن الابتسامة الناجحة هي التي لا يمكن تمييز تجميلها عن طبيعتها البكر.",
      en: "Specialist in microscopic veneers and cosmetic alignment. She firmly believes that a masterfully designed smile should be completely indistinguishable from nature."
    },
    specialties: {
      ar: [
        "تصميم الابتسامة الرقمي المجهري (Micro-Veneers)",
        "تعديل وتجميل اللثة بالليزر والمايكرو",
        "إعادة التأهيل التجميلي الكامل للفكين"
      ],
      en: [
        "Micro-invasive Porcelain Restoration (Micro-Veneers)",
        "Cosmetic Periodontal Laser Sculpting",
        "Full Mouth Aesthetic Rehabilitation"
      ]
    },
    education: {
      ar: "زمالة الأكاديمية الأمريكية لتجميل الأسنان (AACD) - ماجستير طب الأسنان التجميلي من جامعة ساوثهامبتون.",
      en: "Fellow of the American Academy of Cosmetic Dentistry (AACD). MSc in Aesthetic Dentistry, University of Southampton."
    },
    image: STOCK.consultation
  },
  {
    id: "dr-alexander",
    name: {
      ar: "د. ألكسندر شتاين",
      en: "Dr. Alexander Stein"
    },
    role: {
      ar: "استشاري زراعة الأسنان المجهرية وجراحة الفكين",
      en: "Senior Consultant in Micro-Implantology & Oral Surgery"
    },
    bio: {
      ar: "يمتلك خبرة تفوق ١٥ عامًا في زراعة الأسنان الفورية وتطعيم العظام المتقدم تحت المجهر الألماني بدقة متناهية.",
      en: "Bringing over 15 years of exceptional clinical precision in same-day implant loading and complex microscopic bone grafting."
    },
    specialties: {
      ar: [
        "الزراعة الفورية مع التحميل التجميلي المباشر",
        "جراحات الجيوب الأنفية والترميم العظمي ثلاثي الأبعاد",
        "زراعة الأسنان الرقمية الموجهة بالكامل"
      ],
      en: [
        "Immediate Implant Placement with cosmetic loading",
        "Microscopic Sinus Lift & 3D Bone Reconstruction",
        "Fully Digitally Guided Computerized Implantology"
      ]
    },
    education: {
      ar: "البورد الألماني في زراعة الأسنان - دكتوراه في جراحة الفم والأسنان من جامعة هايدلبرغ العريقة.",
      en: "German Board in Implantology. PhD in Oral Maxillofacial Surgery, Heidelberg University."
    },
    image: STOCK.surgeon
  },
  {
    id: "dr-layla",
    name: {
      ar: "د. ليلى الشريف",
      en: "Dr. Layla Al-Sharif"
    },
    role: {
      ar: "أخصائية تقويم الأسنان الشفاف وتعديل موازنة الفك",
      en: "Specialist in Clear Aligners & Neuromuscular Orthodontics"
    },
    bio: {
      ar: "رائدة في تطبيق الحلول التقويمية غير المرئية لتنسيق الأسنان مع تحسين تماثل ملامح الوجه وتخفيف آلام مفصل الفك.",
      en: "Pioneer in utilizing modern digital orthodontic aligners to establish perfect dental arch alignment while enhancing overall facial symmetry."
    },
    specialties: {
      ar: [
        "تقويم الأسنان الشفاف ثلاثي الأبعاد للبالغين",
        "علاج اضطرابات المفصل الفكي الصدغي وتماثل الوجه",
        "تصميم الابتسامات الوقائي والمحافظ"
      ],
      en: [
        "3D Clear Aligner Digital Orthodontics for Adults",
        "Temporomandibular Joint (TMJ) Therapy & Symmetry Planning",
        "Preservative & Minimally Invasive Arch Expansion"
      ]
    },
    education: {
      ar: "ماجستير تقويم الأسنان وعلاقات الفكين من جامعة باريس السادسة - مقوِّم معتمد دوليًا من Invisalign Diamond.",
      en: "MSc in Orthodontics and Dentofacial Orthopedics, Sorbonne University (Paris VI). Elite Invisalign Diamond Provider."
    },
    image: STOCK.orthodontist
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "t1",
    name: {
      ar: "ياسمين محمد",
      en: "Jasmeen Mohammed"
    },
    rating: 5,
    comment: {
      ar: "الدكتورة بيان هي الأفضل! من النادر أن تجد موهبة ولطفاً بهذا المستوى في أطباء الأسنان ❤️ أحبها جداً وهي محترفة للغاية. 🫶 شكراً دكتورة بيان!!",
      en: "Dr Bayan is the best! Its rare to find such talent and kind dentists nowadays ❤️ absolutely love her and shes extremely professional. 🫶 Thank u dr bayan!!"
    },
    treatment: {
      ar: "",
      en: ""
    },
    date: "2026-06-12",
    image: ""
  },
  {
    id: "t2",
    name: {
      ar: "نورهان لاب",
      en: "Nourhan Lab"
    },
    rating: 5,
    comment: {
      ar: "تعامل راقي .. اطباء مميزون .. اهتمام واضح براحة المراجع من لحظة دخوله العيادة وحتى انتهاء العلاج .. اوصي بهالعيادة بشدة.",
      en: "Elegant service… outstanding doctors… clear care for patient comfort from the moment you enter until treatment is complete… I highly recommend this clinic."
    },
    treatment: {
      ar: "",
      en: ""
    },
    date: "2026-07-15",
    image: ""
  },
  {
    id: "t3",
    name: {
      ar: "هديل الكتبي",
      en: "Hadeel Al Ketbi"
    },
    rating: 5,
    comment: {
      ar: "عيادة خمس نجوم\nقمة في الرقي والتعامل من الاستقبال إلى كامل الفريق",
      en: "A five-star clinic — excellence in elegance and service from reception through the entire team."
    },
    treatment: {
      ar: "",
      en: ""
    },
    date: "2026-05-12",
    image: ""
  }
];

export const GALLERY: GalleryItem[] = [
  {
    id: "g1",
    title: {
      ar: "بهو الاستقبال الفاخر",
      en: "Our Luxury Guest Lounge"
    },
    category: "clinic",
    image: STOCK.clinicLobby,
    description: {
      ar: "مصمم بمواد دافئة وخامات مريحة وحرص شديد على سلامة وهدوء الحواس.",
      en: "Crafted with warm natural textures and calming acoustic layouts to keep your senses tranquil."
    }
  },
  {
    id: "g2",
    title: {
      ar: "جناح العلاج الاستشاري المطور",
      en: "Consultation & Treatment Suite"
    },
    category: "clinic",
    image: STOCK.treatmentSuite,
    description: {
      ar: "إطلالة مريحة مع دمج كامل للتقنيات ثلاثية الأبعاد والمجهرية دون إزعاج بصري.",
      en: "A beautiful, serene treatment view featuring integrated 3D micro-dental technology with zero visual clutter."
    }
  },
  {
    id: "g3",
    title: {
      ar: "تصميم ابتسامة فينير كامل - حالة تجميلية",
      en: "Bespoke Full-Arch Smile Design Case"
    },
    category: "cases",
    image: STOCK.smileClose,
    description: {
      ar: "تصميم عدسات مجهرية بلون طبيعي متناسق يتكامل مع خطوط الوجه الطبيعية وعظم الفك.",
      en: "Micro-veneers configured in standard warm ivory tones matching natural tooth transparency."
    }
  },
  {
    id: "g4",
    title: {
      ar: "جلسة نحت وتشكيل تجميلي مباشر للأسنان",
      en: "Precision Aesthetic Restorative Session"
    },
    category: "cases",
    image: STOCK.veneers,
    description: {
      ar: "علاج تجميلي مجهري دقيق بأقل تدخل لترميم الحواف واستعادة بريق طبقة المينا الطبيعية.",
      en: "Microscopic dental carving aiming to restore absolute anatomical symmetry with minimalist tooth preparation."
    }
  },
  {
    id: "g5",
    title: {
      ar: "جناح الاسترخاء والرفاهية",
      en: "Wellness Lounge Suite"
    },
    category: "clinic",
    image: STOCK.spaDental,
    description: {
      ar: "مساحة هادئة صُممت لتهدئة الحواس قبل وبعد الجلسة العلاجية.",
      en: "A calm lounge designed to soothe the senses before and after treatment."
    }
  },
  {
    id: "g6",
    title: {
      ar: "تفاصيل المجهر والقدرة الرقمية",
      en: "Microscopy & Digital Precision"
    },
    category: "cases",
    image: STOCK.microscope,
    description: {
      ar: "رؤية مجهرية فائقة تضمن حواف غير مرئية ونتائج تدوم.",
      en: "Ultra-high magnification ensuring invisible margins and lasting results."
    }
  }
];

export const BLOG_POSTS: BlogPost[] = [
  {
    id: "b1",
    title: {
      ar: "طب الأسنان المجهري: الدقة التي تصنع الفارق في العلاج",
      en: "Microscope-Assisted Dentistry: The Precision Behind Lasting Results"
    },
    excerpt: {
      ar: "تعرّف على أهمية استخدام المجاهر المتطورة في عيادات المعالي لضمان تشخيص فائق وعلاجات مجهرية تدوم لسنوات.",
      en: "Discover how advanced operating microscopes allow our team to detect microscopic dental details and offer exceptionally durable treatments."
    },
    content: {
      ar: "في عيادات المعالي، نؤمن بأن التفاصيل الصغيرة هي التي تصنع الفارق الأكبر. استخدام المجهر المطور في علاج الأسنان لا يعد مجرد رفاهية، بل هو معيار علمي متقدم يضمن الحفاظ على الأنسجة الطبيعية السليمة للأسنان بأقصى قدر ممكن. بفضل التكبير الفائق الذي يصل إلى 20 ضعفاً، يتمكن أطباؤنا من رؤية التشققات المجهرية الدقيقة، وتنظيف القنوات الجذرية المعقدة بمنتهى المثالية، ونحت حواف التركيبات التجميلية بدقة خالية من الفراغات، مما يمنع حدوث التسوس الثانوي ويضمن استدامة ابتسامتك الفاخرة لسنوات طويلة.",
      en: "At Al Maali Clinics, we believe that the smallest details make the biggest difference. The use of advanced dental operating microscopes is not a mere luxury; it is a clinical standard that ensures maximum preservation of healthy tooth structure. With magnification up to 20x, our specialists can identify micro-fractures, clean intricate root canal networks flawlessly, and contour veneer margins with seamless accuracy, preventing secondary decay and securing the long-term success of your premium dental restorations."
    },
    date: {
      ar: "٢٠ يونيو ٢٠٢٦",
      en: "June 20, 2026"
    },
    readTime: {
      ar: "٤ دقائق قراءة",
      en: "4 min read"
    },
    category: {
      ar: "تكنولوجيا طبية",
      en: "Technology"
    },
    image: STOCK.blogTech,
    author: {
      ar: "د. هبة المعالي",
      en: "Dr. Hiba Al Maali"
    }
  },
  {
    id: "b2",
    title: {
      ar: "الفينير المصمم خصيصاً مقابل الفينير التقليدي: فن مواءمة الملامح",
      en: "Bespoke Veneers vs Traditional Veneers: The Art of Personalized Smiles"
    },
    excerpt: {
      ar: "لماذا نقوم بتصميم الابتسامة بشكل فردي يتطابق مع تعابير الوجه ولون البشرة بدلاً من استخدام القوالب الجاهزة؟",
      en: "Explore why custom smile designing tailored to your facial geometry and skin tone outperforms mass-produced templates."
    },
    content: {
      ar: "الابتسامة الجميلة ليست مجرد أسنان مصفوفة ناصعة البياض؛ بل هي توازن فني يتكامل مع تفاصيل وجهك الفريدة وتعبيراتك التلقائية. الفينير التقليدي غالباً ما يعتمد على قوالب جاهزة وموحدة قد تبدو مصطنعة أو غير متناسقة. أما في عيادات المعالي، فإننا نقوم بتصميم عدسات الفينير المجهرية بدقة مخصصة بالكامل (Bespoke Veneers)، آخذين بعين الاعتبار أبعاد الوجه، حركة الشفاه عند الحديث والضحك، وتدرج شفافية ولون الأسنان الطبيعية. النتيجة هي ابتسامة حيوية، مشرقة، تعزز شخصيتك ولا تبدو مصطنعة على الإطلاق.",
      en: "A beautiful smile is more than just perfectly aligned, ultra-white teeth; it is an artistic balance that harmonizes with your unique facial geometry and spontaneous expressions. Conventional veneers often rely on mass-produced, uniform templates that can look artificial. At Al Maali Clinics, we sculpt each porcelain veneer micro-dentally (Bespoke Veneers) by carefully assessing your facial dimensions, lip dynamics during talking and smiling, and the natural translucency of your teeth. The result is a vibrant, organic smile that emphasizes your persona without looking artificial."
    },
    date: {
      ar: "١٥ يونيو ٢٠٢٦",
      en: "June 15, 2026"
    },
    readTime: {
      ar: "٥ دقائق قراءة",
      en: "5 min read"
    },
    category: {
      ar: "طب الأسنان التجميلي",
      en: "Aesthetic Dentistry"
    },
    image: STOCK.blogAesthetic,
    author: {
      ar: "د. فيصل الشهري",
      en: "Dr. Faisal Al-Shehri"
    }
  },
  {
    id: "b3",
    title: {
      ar: "كيف تحافظ على بريق عدسات الفينير؟ دليل الرعاية الوقائية الفاخرة",
      en: "Maintaining the Luster of Your Veneers: The Luxury Prevention Guide"
    },
    excerpt: {
      ar: "نصائح وإرشادات وقائية مبسطة من أطبائنا للحفاظ على جودة ولمعان ابتسامتك الجديدة لسنوات طويلة.",
      en: "Expert advice and straightforward preventive routines from our doctors to protect the brilliance of your smile."
    },
    content: {
      ar: "الحصول على ابتسامة أحلامك هو البداية فقط، والحفاظ على رونقها يتطلب وعياً بأساليب الرعاية اليومية الفاخرة. يوصي أطباؤنا في عيادات المعالي باستخدام فراشي أسنان ذات شعيرات ناعمة جداً مع معاجين أسنان خالية من المواد الكاشطة لمنع خدش أسطح السيراميك الحساسة. كما يُنصح بشدة بارتداء واقي الأسنان الليلي (Night Guard) في حال وجود صرير أسنان غير واعي لحماية العدسات التجميلية من قوى الضغط الزائد. وأخيراً، فإن الزيارة الدورية المريحة لخدمة التنظيف المجهري التخصصي كل 6 أشهر تضمن إبقاء اللثة في حالة صحية فائقة تدعم جمال أسنانك.",
      en: "Acquiring your dream smile is just the beginning; protecting its brilliance requires mindful, upscale daily care. Our team at Al Maali Clinics recommends ultra-soft bristled toothbrushes paired with non-abrasive toothpastes to prevent microscopic scratches on delicate porcelain surfaces. We also highly advocate using a custom-made Night Guard if you unconsciously clench your teeth during sleep. Finally, attending your regular professional microscopic hygiene appointments every 6 months ensures your gum tissue remains in pristine condition to elegantly frame your smile."
    },
    date: {
      ar: "١٠ يونيو ٢٠٢٦",
      en: "June 10, 2026"
    },
    readTime: {
      ar: "٣ دقائق قراءة",
      en: "3 min read"
    },
    category: {
      ar: "العناية والصحة",
      en: "Hygiene & Care"
    },
    image: STOCK.blogCare,
    author: {
      ar: "د. هبة المعالي",
      en: "Dr. Hiba Al Maali"
    }
  }
];
