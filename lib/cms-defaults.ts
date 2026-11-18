import type {
  FooterConfig,
  HomepageConfig,
  NavigationConfig,
  PageContent,
  SEOPageSetting,
  WebsiteSettings,
} from './types';
import { DEFAULT_THEME_CONFIG } from './theme-defaults';

export const DEFAULT_NAVIGATION_CONFIG: NavigationConfig = {
  headerStyle: 'blur',
  stickyHeader: true,
  links: [
    { id: 'nav_shop', label: 'Shop', href: '/shop', isVisible: true, sortOrder: 1 },
    { id: 'nav_systems', label: 'Systems', href: '/shop?category=floorstanding-towers', isVisible: true, sortOrder: 2 },
    { id: 'nav_tech', label: 'Technology', href: '/#technology', isVisible: true, sortOrder: 3 },
    { id: 'nav_about', label: 'About', href: '/about', isVisible: true, sortOrder: 4 },
    { id: 'nav_contact', label: 'Contact', href: '/contact', isVisible: true, sortOrder: 5 },
  ],
};

export const DEFAULT_FOOTER_CONFIG: FooterConfig = {
  copyrightText: '© {year} {siteName}. All rights reserved.',
  newsletterEyebrow: 'Acoustic Dispatches',
  newsletterTitle: 'Receive limited-edition speaker releases and calibration notes.',
  newsletterSubtitle: 'Private invitations to listening room showcases and firmware engineering bulletins.',
  newsletterButtonText: 'Subscribe',
  columns: [
    {
      id: 'col_collection',
      title: 'Collection',
      links: [
        { label: 'All Loudspeakers', href: '/shop' },
        { label: 'Floorstanding Towers', href: '/shop?category=floorstanding-towers' },
        { label: 'Studio Monitors', href: '/shop?category=studio-monitors' },
        { label: 'Cinema Soundbars', href: '/shop?category=cinema-soundbars' },
        { label: 'Subwoofers', href: '/shop?category=subwoofers' },
        { label: 'Portable Wireless', href: '/shop?category=portable-wireless' },
      ],
    },
    {
      id: 'col_company',
      title: 'Company & Support',
      links: [
        { label: 'About SONIQ', href: '/about' },
        { label: 'Acoustic Concierge', href: '/contact' },
        { label: 'Technical FAQ', href: '/faq' },
        { label: 'Customer Account', href: '/account' },
        { label: 'Shopping Bag', href: '/cart' },
      ],
    },
    {
      id: 'col_legal',
      title: 'Policies & Legal',
      links: [
        { label: 'Shipping & Calibration', href: '/shipping-policy' },
        { label: 'Returns & 30-Day Audition', href: '/return-policy' },
        { label: 'Privacy Policy', href: '/privacy-policy' },
        { label: 'Terms & Conditions', href: '/terms' },
      ],
    },
  ],
};

export const DEFAULT_HOMEPAGE_CONFIG: HomepageConfig = {
  heroBackgroundImageUrl: '',
  heroPrimaryCtaText: 'Explore Collection',
  heroPrimaryCtaUrl: '/shop',
  heroSecondaryCtaText: 'Discover Our Technology',
  heroSecondaryCtaUrl: '#technology',
  featuredProductIds: [],
  bestSellerProductIds: [],
  newArrivalProductIds: [],
  sections: [
    {
      key: 'collections',
      eyebrow: 'Acoustic Lineup',
      title: 'Engineered for Reference Listening',
      description: 'Precision loudspeakers calibrated for mastering studios and architectural living rooms.',
      isVisible: true,
      sortOrder: 1,
    },
    {
      key: 'categories',
      eyebrow: 'Architectures',
      title: 'Shop by Speaker Category',
      description: 'Explore bespoke transducer architectures matched to your room acoustics.',
      isVisible: true,
      sortOrder: 2,
    },
    {
      key: 'promoBanner',
      eyebrow: 'Featured System Spotlight',
      title: 'Flagship Acoustic Innovation',
      description: 'Curated pairings engineered for spatial depth and dynamic headroom.',
      isVisible: true,
      sortOrder: 3,
    },
    {
      key: 'whySoniq',
      eyebrow: 'Acoustic Engineering',
      title: 'Why Studios & Collectors Choose SONIQ',
      description: 'Every enclosure is CNC-milled from aerospace aluminum and calibrated in our anechoic chamber for phase-coherent playback.',
      isVisible: true,
      sortOrder: 4,
    },
    {
      key: 'brands',
      eyebrow: 'Partner Acoustic Divisions',
      title: 'Partner Acoustic Divisions',
      description: 'Independent acoustic laboratories united under SONIQ reference standards.',
      isVisible: true,
      sortOrder: 5,
    },
    {
      key: 'reviews',
      eyebrow: 'Verified Listeners',
      title: 'Studio & Collector Perspectives',
      description: 'Verified evaluations from mastering engineers and residential collectors.',
      isVisible: true,
      sortOrder: 6,
    },
    {
      key: 'newsletter',
      eyebrow: 'Acoustic Dispatches',
      title: 'Receive limited-edition speaker releases and calibration notes.',
      description: 'Quarterly acoustics monographs and early hardware allocations.',
      isVisible: true,
      sortOrder: 7,
    },
  ],
};

export const DEFAULT_PAGES: PageContent[] = [
  {
    slug: 'about',
    eyebrow: 'Our Heritage',
    title: 'Acoustic Architecture Without Compromise.',
    subtitle:
      'Founded by electro-acoustic physicists and industrial sculptors in San Francisco and Munich, SONIQ designs active loudspeakers that unite mastering-studio phase linearity with monolithic architectural form.',
    heroImageUrl: '/images/studio-monitor.jpg',
    sections: [
      {
        heading: 'Anechoic Precision',
        body: 'Every transducer pair is individually measured and DSP-matched within ±0.3 dB prior to crating.',
      },
      {
        heading: 'CNC 6061 Enclosures',
        body: 'Solid anodized aluminum baffles eliminate sympathetic wood resonances and thermal compression.',
      },
      {
        heading: 'Longevity by Design',
        body: 'Modular amplification plates and serviceable drivers ensure decades of reference performance.',
      },
    ],
    faqItems: [],
    updatedAt: '',
  },
  {
    slug: 'contact',
    eyebrow: 'Concierge & Acoustic Advisory',
    title: 'Contact SONIQ',
    subtitle:
      'Consult with our acoustic engineers on room placement, multi-channel cinema architecture, or order assistance.',
    heroImageUrl: '',
    sections: [],
    faqItems: [],
    updatedAt: '',
  },
  {
    slug: 'faq',
    eyebrow: 'Support',
    title: 'Frequently Asked Questions',
    subtitle: 'Technical guidance on SONIQ active amplification, wireless protocols, delivery, and warranty.',
    heroImageUrl: '',
    sections: [],
    faqItems: [
      {
        question: 'Do SONIQ active loudspeakers require an external power amplifier?',
        answer:
          'All SONIQ flagship towers, studio monitors, bookshelf pairs, and soundbars integrate bespoke Class-D amplification and DSP crossovers internally, eliminating external amplifier matching.',
      },
      {
        question: 'How does the 30-day in-room audition work?',
        answer:
          'Every loudspeaker purchased directly from SONIQ includes a 30-day listening trial in your own acoustic space. Retain the original flight crating if you wish to initiate a complimentary return pickup.',
      },
      {
        question: 'Which lossless wireless protocols are supported?',
        answer:
          'Our wireless systems support 24-bit/192kHz WiSA, AirPlay 2, Tidal Connect, Roon Ready streaming, and Bluetooth 5.4 AptX Lossless alongside balanced XLR and HDMI eARC inputs.',
      },
      {
        question: 'What warranty covers SONIQ equipment?',
        answer:
          'All amplifiers, DSP modules, and custom transducers are covered by a 5-year comprehensive SONIQ manufacturer warranty.',
      },
    ],
    updatedAt: '',
  },
  {
    slug: 'privacy-policy',
    eyebrow: 'Legal & Security',
    title: 'Privacy Policy',
    subtitle: 'How SONIQ handles customer records, order history, and encrypted session cookies.',
    heroImageUrl: '',
    sections: [
      {
        heading: '1. Information We Collect',
        body: 'We collect only the contact, shipping address, and order details necessary to fulfill hardware deliveries, warranty registrations, and concierge inquiries.',
      },
      {
        heading: '2. Data Protection & Retention',
        body: 'Passwords are hashed using bcrypt. We never sell customer records to third parties or expose payment credentials in browser state.',
      },
    ],
    faqItems: [],
    updatedAt: '',
  },
  {
    slug: 'terms',
    eyebrow: 'Legal',
    title: 'Terms & Conditions',
    subtitle: 'Standard fulfillment, calibration, and 5-year acoustic hardware warranty terms.',
    heroImageUrl: '',
    sections: [
      {
        heading: 'Pricing & Availability',
        body: 'All order totals, coupon discounts, and inventory availability are validated server-side at checkout prior to order confirmation.',
      },
      {
        heading: 'Warranty Coverage',
        body: 'Every SONIQ loudspeaker includes a 5-year warranty covering drivers, internal Class-D amplification, and factory DSP calibration.',
      },
    ],
    faqItems: [],
    updatedAt: '',
  },
  {
    slug: 'shipping-policy',
    eyebrow: 'Logistics',
    title: 'Shipping & Calibration Policy',
    subtitle: 'Insured white-glove courier logistics for architectural towers and studio monitors.',
    heroImageUrl: '',
    sections: [
      {
        heading: 'Insured Freight & Delivery Thresholds',
        body: 'Orders qualifying above the complimentary shipping threshold ship via insured courier at zero delivery cost. Floorstanding towers travel in custom shock-isolated crates with scheduled appointment delivery.',
      },
      {
        heading: 'Dispatch Windows',
        body: 'In-stock studio monitors, bookshelf systems, and portable speakers dispatch within 24–48 business hours with live courier tracking.',
      },
    ],
    faqItems: [],
    updatedAt: '',
  },
  {
    slug: 'return-policy',
    eyebrow: 'Customer Assurance',
    title: 'Return & Refund Policy',
    subtitle: 'Audition any SONIQ system in your own listening environment for 30 days.',
    heroImageUrl: '',
    sections: [
      {
        heading: '30-Day In-Room Audition',
        body: 'Every SONIQ loudspeaker includes a 30-day in-home listening trial. If the acoustic signature does not harmonize with your room, contact our concierge for an insured return authorization.',
      },
      {
        heading: 'Inspection & Refunds',
        body: 'Returned units must arrive in original protective packaging with all accessories. Refunds are processed within 5 business days of warehouse inspection.',
      },
    ],
    faqItems: [],
    updatedAt: '',
  },
];

export const DEFAULT_SEO_SETTINGS: SEOPageSetting[] = [
  {
    pageKey: 'global',
    label: 'Global Default SEO',
    metaTitle: 'SONIQ — Reference Audio Speakers & Acoustic Engineering',
    metaDescription:
      'Discover precision-engineered loudspeakers, studio monitors, architectural soundbars, and force-canceling subwoofers crafted by SONIQ.',
    keywords: 'SONIQ, luxury speakers, studio monitors, floorstanding speakers, soundbars, subwoofers',
    ogImageUrl: '/images/hero-flagship.jpg',
    updatedAt: '',
  },
  {
    pageKey: 'home',
    label: 'Homepage',
    metaTitle: 'SONIQ — Experience Sound Beyond Limits',
    metaDescription:
      'Discover powerful audio technology designed to transform every moment into an unforgettable experience.',
    keywords: 'SONIQ flagship speakers, Monolith X1, reference audio',
    ogImageUrl: '/images/hero-flagship.jpg',
    updatedAt: '',
  },
  {
    pageKey: 'shop',
    label: 'Shop Catalog',
    metaTitle: 'Shop Reference Audio Speakers | SONIQ',
    metaDescription:
      'Browse SONIQ floorstanding towers, studio monitors, bookshelf pairs, cinema soundbars, and subwoofers.',
    keywords: 'buy audiophile speakers, active studio monitors, Dolby Atmos soundbar',
    ogImageUrl: '/images/studio-monitor.jpg',
    updatedAt: '',
  },
  {
    pageKey: 'about',
    label: 'About Us',
    metaTitle: 'About SONIQ | Acoustic Heritage & Craftsmanship',
    metaDescription: 'Learn about SONIQ acoustic research, CNC aluminum cabinetry, and anechoic engineering.',
    keywords: 'SONIQ engineering, acoustic research, CNC speaker design',
    ogImageUrl: '/images/studio-monitor.jpg',
    updatedAt: '',
  },
  {
    pageKey: 'contact',
    label: 'Contact Us',
    metaTitle: 'Acoustic Concierge & Contact | SONIQ',
    metaDescription: 'Speak directly with SONIQ acoustic engineers for room setup and order support.',
    keywords: 'SONIQ concierge, acoustic support, speaker consultation',
    ogImageUrl: '/images/hero-flagship.jpg',
    updatedAt: '',
  },
  {
    pageKey: 'faq',
    label: 'FAQ',
    metaTitle: 'Technical FAQ | SONIQ',
    metaDescription: 'Answers on active amplification, wireless audio, 30-day audition, and 5-year warranty.',
    keywords: 'SONIQ FAQ, speaker warranty, WiSA wireless audio',
    ogImageUrl: '/images/hero-flagship.jpg',
    updatedAt: '',
  },
  {
    pageKey: 'privacy-policy',
    label: 'Privacy Policy',
    metaTitle: 'Privacy Policy | SONIQ',
    metaDescription: 'How SONIQ protects your personal account and order information.',
    keywords: 'SONIQ privacy policy',
    ogImageUrl: '/images/hero-flagship.jpg',
    updatedAt: '',
  },
  {
    pageKey: 'terms',
    label: 'Terms & Conditions',
    metaTitle: 'Terms & Conditions | SONIQ',
    metaDescription: 'Terms of sale, warranty, and service for SONIQ audio equipment.',
    keywords: 'SONIQ terms and conditions',
    ogImageUrl: '/images/hero-flagship.jpg',
    updatedAt: '',
  },
  {
    pageKey: 'shipping-policy',
    label: 'Shipping Policy',
    metaTitle: 'Shipping & Calibration Policy | SONIQ',
    metaDescription: 'Insured white-glove shipping and dispatch timelines for SONIQ speakers.',
    keywords: 'SONIQ shipping policy, insured speaker freight',
    ogImageUrl: '/images/hero-flagship.jpg',
    updatedAt: '',
  },
  {
    pageKey: 'return-policy',
    label: 'Return Policy',
    metaTitle: '30-Day Audition & Return Policy | SONIQ',
    metaDescription: '30-day in-room speaker audition and return instructions.',
    keywords: 'SONIQ return policy, 30-day audition',
    ogImageUrl: '/images/hero-flagship.jpg',
    updatedAt: '',
  },
];

export const DEFAULT_WEBSITE_SETTINGS: WebsiteSettings = {
  id: 'default',
  siteName: 'SONIQ',
  tagline: 'Precision Acoustic Engineering',
  logoUrl: '',
  faviconUrl: '',
  contactEmail: 'concierge@soniq-audio.com',
  contactPhone: '+1 (415) 890-4420',
  address: '740 Harrison Acoustic Way, San Francisco, CA 94107',
  currency: 'USD',
  currencySymbol: '$',
  shippingCharge: 35,
  freeShippingThreshold: 500,
  announcementText:
    'Complimentary express calibration & insured delivery on orders over $500 · Use code SONIQ10 for 10% off your first system.',
  announcementActive: true,
  heroTitle: 'Experience Sound Beyond Limits.',
  heroSubtitle:
    'Discover powerful audio technology designed to transform every moment into an unforgettable experience.',
  heroImageUrl: '/images/hero-flagship.jpg',
  footerAbout:
    'Engineered in San Francisco and Munich, SONIQ crafts reference-grade loudspeaker architecture for discerning studios and private listening sanctuaries.',
  socialLinks: {
    instagram: 'https://instagram.com',
    youtube: 'https://youtube.com',
    x: 'https://x.com',
    linkedin: 'https://linkedin.com',
  },
  homepageSections: {
    showFeatured: true,
    showBestSellers: true,
    showNewArrivals: true,
    showCategories: true,
    showBrands: true,
    showPromoBanner: true,
    showWhySoniq: true,
    showReviews: true,
    showNewsletter: true,
  },
  themeConfig: DEFAULT_THEME_CONFIG,
  themeDraftConfig: null,
  navigationConfig: DEFAULT_NAVIGATION_CONFIG,
  footerConfig: DEFAULT_FOOTER_CONFIG,
  homepageConfig: DEFAULT_HOMEPAGE_CONFIG,
  updatedAt: '',
};
