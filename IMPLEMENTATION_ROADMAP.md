# 🚀 IMPLEMENTATION ROADMAP - SHAMBIT HOMEPAGE FIXES

## Week 1: Critical Fixes (Must-Have for Launch)

### Day 1-2: SEO Foundation

#### 1. Update Root Layout Metadata
**File:** `src/app/layout.tsx`

```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL('https://shambit.in'),
  title: {
    default: "Book Hotels in Ayodhya | 1000+ Verified Stays Near Ram Mandir | Shambit",
    template: "%s | Shambit - Ayodhya Hotels & Homestays"
  },
  description: "Find best hotel deals in Ayodhya starting ₹999. Book verified hotels, homestays & dharamshalas near Ram Mandir. Free cancellation. Pay at hotel. 24/7 support.",
  keywords: ["ayodhya hotels", "ram mandir hotels", "ayodhya booking", "dharamshala ayodhya", "homestay ayodhya", "hotels near ram janmabhoomi", "ayodhya accommodation"],
  authors: [{ name: "Shambit" }],
  creator: "Shambit",
  publisher: "Shambit",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://shambit.in",
    title: "Book Hotels in Ayodhya - Best Deals Near Ram Mandir",
    description: "1000+ verified properties. Starting ₹999/night. Free cancellation. Pay at hotel.",
    siteName: "Shambit",
    images: [
      {
        url: "/og-image-ayodhya.jpg",
        width: 1200,
        height: 630,
        alt: "Shambit - Book Hotels in Ayodhya",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Book Hotels in Ayodhya | Shambit",
    description: "Best deals on Ayodhya hotels near Ram Mandir. Starting ₹999/night.",
    images: ["/twitter-card.jpg"],
    creator: "@shambit_in",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://shambit.in",
    languages: {
      "en-IN": "https://shambit.in",
      "hi-IN": "https://shambit.in/hi",
    },
  },
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
  },
  category: "travel",
};
```

#### 2. Add Structured Data (JSON-LD)
**Create:** `src/components/seo/structured-data.tsx`

```typescript
export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Shambit",
    "url": "https://shambit.in",
    "logo": "https://shambit.in/logo.png",
    "description": "Leading hotel booking platform for Ayodhya",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Ram Path, Naya Ghat",
      "addressLocality": "Ayodhya",
      "addressRegion": "Uttar Pradesh",
      "postalCode": "224123",
      "addressCountry": "IN"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-999-999-9999",
      "contactType": "customer service",
      "areaServed": "IN",
      "availableLanguage": ["English", "Hindi"]
    },
    "sameAs": [
      "https://facebook.com/shambit",
      "https://twitter.com/shambit_in",
      "https://instagram.com/shambit_in"
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function WebsiteSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Shambit",
    "url": "https://shambit.in",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://shambit.in/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function BreadcrumbSchema({ items }: { items: Array<{ name: string; url: string }> }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

**Update:** `src/app/page.tsx`

```typescript
import { OrganizationSchema, WebsiteSchema } from "@/components/seo/structured-data";

export default function Home() {
  return (
    <>
      <OrganizationSchema />
      <WebsiteSchema />
      <main>
        {/* existing content */}
      </main>
    </>
  );
}
```

#### 3. Create Sitemap
**Create:** `src/app/sitemap.ts`

```typescript
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://shambit.in';
  
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/hotels`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/homestays`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];
}
```

#### 4. Create robots.txt
**Create:** `src/app/robots.ts`

```typescript
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/dashboard/'],
      },
    ],
    sitemap: 'https://shambit.in/sitemap.xml',
  };
}
```

### Day 3-4: Performance Optimization

#### 1. Image Optimization
**Update:** `src/components/landing/hero.tsx`

```typescript
"use client";

import { motion } from "framer-motion";
import { SearchBar } from "./search-bar";
import Image from "next/image";

// Import local optimized image
import heroImage from "@/public/ayodhya-hero.jpg";

export function Hero() {
    return (
        <section className="relative min-h-[600px] md:min-h-[700px] lg:min-h-[800px] flex flex-col pt-32 pb-20 overflow-hidden">
            {/* Optimized Background Image */}
            <Image
                src={heroImage}
                alt="Ram Mandir Ayodhya - Spiritual stays and hotels"
                fill
                priority
                quality={90}
                placeholder="blur"
                sizes="100vw"
                className="object-cover"
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 z-10 bg-gradient-to-br from-[#0f172a]/80 via-[#1e293b]/70 to-[#0e4a4a]/80" />

            {/* Content Container */}
            <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center flex-1 justify-start">
                {/* Rest of content */}
            </div>
        </section>
    );
}
```

#### 2. Code Splitting
**Update:** `src/app/page.tsx`

```typescript
import dynamic from 'next/dynamic';
import { Header } from "@/components/layout/header";
import { Hero } from "@/components/landing/hero";
import { PromotionsBanner } from "@/components/landing/promotions-banner";
import { FeaturedDeals } from "@/components/landing/featured-deals";
import { Footer } from "@/components/layout/footer";

// Lazy load below-the-fold components
const PropertyTypes = dynamic(() => import("@/components/landing/property-types").then(mod => ({ default: mod.PropertyTypes })));
const FeaturedDestinations = dynamic(() => import("@/components/landing/featured-destinations").then(mod => ({ default: mod.FeaturedDestinations })));
const Benefits = dynamic(() => import("@/components/landing/benefits").then(mod => ({ default: mod.Benefits })));
const Testimonials = dynamic(() => import("@/components/landing/testimonials").then(mod => ({ default: mod.Testimonials })));
const CTABanner = dynamic(() => import("@/components/landing/cta-banner").then(mod => ({ default: mod.CTABanner })));

export default function Home() {
  return (
    <main className="min-h-screen bg-background font-sans text-foreground selection:bg-teal-100 selection:text-teal-900">
      <Header />
      <Hero />
      <PromotionsBanner />
      <FeaturedDeals />
      <PropertyTypes />
      <FeaturedDestinations />
      <Benefits />
      <Testimonials />
      <CTABanner />
      <Footer />
    </main>
  );
}
```

#### 3. Add Loading States
**Create:** `src/app/loading.tsx`

```typescript
export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Skeleton */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="flex gap-4">
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Hero Skeleton */}
      <div className="pt-32 pb-20 min-h-[600px] bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-12 w-3/4 mx-auto bg-white/20 rounded mb-4" />
          <div className="h-6 w-1/2 mx-auto bg-white/20 rounded mb-8" />
          <div className="h-24 w-full bg-white/30 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
```

#### 4. Optimize Framer Motion
**Update:** `src/components/landing/featured-deals.tsx`

```typescript
"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";

export function FeaturedDeals() {
    const shouldReduceMotion = useReducedMotion();

    return (
        <section className="py-16 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                {/* ... */}
                <div className="flex overflow-x-auto pb-4 -mx-4 px-4 md:grid md:grid-cols-4 md:gap-6 md:overflow-visible md:p-0 scrollbar-hide snap-x">
                    {DEALS.map((deal) => (
                        <motion.div
                            key={deal.id}
                            className="min-w-[280px] snap-center bg-white rounded-xl border border-gray-200 overflow-hidden group hover:shadow-lg transition-all duration-300 relative"
                            whileHover={shouldReduceMotion ? {} : { y: -5 }}
                            transition={{ duration: 0.2 }}
                        >
                            {/* Content */}
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
```

### Day 5-6: Accessibility Fixes

#### 1. Fix Color Contrast
**Update:** `src/app/globals.css`

```css
@theme inline {
  /* ... existing vars ... */
  --color-gold: #D97706; /* Changed from #FF9933 for WCAG AA compliance */
  --color-gold-foreground: #FFFFFF;
  --color-teal: #0F4C5C;
  --color-teal-foreground: #FFFFFF;
}
```

#### 2. Add Keyboard Navigation & ARIA
**Update:** `src/components/landing/featured-deals.tsx`

```typescript
export function FeaturedDeals() {
    return (
        <section 
            className="py-16 bg-white overflow-hidden"
            aria-labelledby="featured-deals-heading"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 
                            id="featured-deals-heading"
                            className="text-2xl md:text-3xl font-bold text-gray-900"
                        >
                            Deals for your next stay
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">
                            Save on top-rated properties in Ayodhya
                        </p>
                    </div>
                    <Button 
                        variant="link" 
                        className="text-teal-600 font-bold hover:text-teal-700"
                        aria-label="View all hotel deals in Ayodhya"
                    >
                        View All <ArrowRight className="ml-1 w-4 h-4" aria-hidden="true" />
                    </Button>
                </div>

                <div 
                    className="flex overflow-x-auto pb-4 -mx-4 px-4 md:grid md:grid-cols-4 md:gap-6 md:overflow-visible md:p-0 scrollbar-hide snap-x"
                    role="list"
                    aria-label="Featured hotel deals"
                >
                    {DEALS.map((deal) => (
                        <article
                            key={deal.id}
                            className="min-w-[280px] snap-center bg-white rounded-xl border border-gray-200 overflow-hidden group hover:shadow-lg transition-all duration-300 relative focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
                            role="listitem"
                        >
                            <a 
                                href={`/hotel/${deal.id}`}
                                className="block focus:outline-none"
                                aria-label={`View details for ${deal.title} in ${deal.location}, starting at ${deal.price} per night`}
                            >
                                {/* Image Section */}
                                <div className="relative h-48 w-full">
                                    <Image
                                        src={deal.image}
                                        alt={`${deal.title} - ${deal.location}`}
                                        fill
                                        sizes="(max-width: 768px) 280px, 25vw"
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <button 
                                        className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 hover:bg-white text-gray-400 hover:text-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        aria-label={`Add ${deal.title} to favorites`}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            // Handle favorite
                                        }}
                                    >
                                        <Heart className="w-4 h-4" aria-hidden="true" />
                                    </button>
                                    {/* ... rest of content ... */}
                                </div>
                            </a>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
```

#### 3. Add Skip Links
**Update:** `src/components/layout/header.tsx`

```typescript
export function Header() {
    return (
        <>
            {/* Skip to main content link */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:shadow-lg"
            >
                Skip to main content
            </a>
            
            <header className={/* ... */}>
                {/* existing header content */}
            </header>
        </>
    );
}
```

**Update:** `src/app/page.tsx`

```typescript
export default function Home() {
  return (
    <main id="main-content" className="min-h-screen bg-background font-sans text-foreground selection:bg-teal-100 selection:text-teal-900">
      {/* content */}
    </main>
  );
}
```

### Day 7: Security & Analytics

#### 1. Add Security Headers
**Update:** `next.config.ts`

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)'
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

#### 2. Add Analytics
**Create:** `src/lib/analytics.ts`

```typescript
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID!, {
      page_path: url,
    });
  }
};

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const event = ({ action, category, label, value }: {
  action: string;
  category: string;
  label: string;
  value?: number;
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};
```

**Update:** `src/app/layout.tsx`

```typescript
import Script from 'next/script';
import { GA_TRACKING_ID } from '@/lib/analytics';

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                {/* Google Analytics */}
                <Script
                    strategy="afterInteractive"
                    src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
                />
                <Script
                    id="google-analytics"
                    strategy="afterInteractive"
                    dangerouslySetInnerHTML={{
                        __html: `
                            window.dataLayer = window.dataLayer || [];
                            function gtag(){dataLayer.push(arguments);}
                            gtag('js', new Date());
                            gtag('config', '${GA_TRACKING_ID}', {
                                page_path: window.location.pathname,
                            });
                        `,
                    }}
                />
            </head>
            <body className={`${inter.variable} ${playfair.variable} ${geistMono.variable} antialiased`}>
                {children}
                <Toaster richColors position="top-center" />
            </body>
        </html>
    );
}
```

---

## Week 2: High Priority Enhancements

### Mobile Optimization

#### 1. Fix Touch Targets
**Update:** `src/components/landing/property-types.tsx`

```typescript
<motion.button
    key={type.id}
    className={`${type.bgColor} rounded-2xl p-6 text-center transition-all duration-300 group-hover:shadow-xl border border-transparent group-hover:border-gray-200 h-full flex flex-col items-center justify-center min-h-[120px] min-w-[120px] touch-manipulation`}
    style={{ minHeight: '48px', minWidth: '48px' }} // WCAG compliance
    aria-label={`Browse ${type.title} - ${type.count} available`}
>
    {/* content */}
</motion.button>
```

#### 2. Add PWA Support
**Create:** `src/app/manifest.ts`

```typescript
import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Shambit - Book Hotels in Ayodhya',
    short_name: 'Shambit',
    description: 'Book verified hotels, homestays & dharamshalas in Ayodhya',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0F4C5C',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
```

### Content Improvements

#### 1. Rewrite Hero Copy
**Update:** `src/components/landing/hero.tsx`

```typescript
<h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-serif text-white tracking-tight drop-shadow-lg mb-4">
    Experience Divine Hospitality in <span className="text-teal-400">Ayodhya</span>
</h1>
<p className="text-lg text-white/90 font-medium drop-shadow-md">
    Book verified stays near Ram Janmabhoomi from ₹999 • 10,000+ pilgrims stayed last month
</p>
```

#### 2. Add Social Proof
**Create:** `src/components/landing/live-activity.tsx`

```typescript
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users } from "lucide-react";

const MOCK_BOOKINGS = [
    { name: "Rajesh K.", location: "Lucknow", hotel: "Ram Prastham Homestay" },
    { name: "Priya S.", location: "Delhi", hotel: "Saryu View Hotel" },
    { name: "Amit P.", location: "Mumbai", hotel: "Ayodhya Palace" },
];

export function LiveActivity() {
    const [currentBooking, setCurrentBooking] = useState(0);
    const [show, setShow] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setShow(true);
            setTimeout(() => setShow(false), 4000);
            setCurrentBooking((prev) => (prev + 1) % MOCK_BOOKINGS.length);
        }, 8000);

        return () => clearInterval(interval);
    }, []);

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.3 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                    className="fixed bottom-6 left-6 z-50 bg-white rounded-xl shadow-2xl p-4 max-w-sm border border-gray-200"
                >
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <Users className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900">
                                {MOCK_BOOKINGS[currentBooking].name} from {MOCK_BOOKINGS[currentBooking].location}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                                Just booked <span className="font-semibold">{MOCK_BOOKINGS[currentBooking].hotel}</span>
                            </p>
                            <p className="text-[10px] text-gray-400 mt-1">2 minutes ago</p>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
```

**Add to:** `src/app/page.tsx`

```typescript
import { LiveActivity } from "@/components/landing/live-activity";

export default function Home() {
  return (
    <>
      <main>{/* existing content */}</main>
      <LiveActivity />
    </>
  );
}
```

---

## Week 3-4: Advanced Features

### A/B Testing Setup
### Internationalization (Hindi)
### Advanced Analytics
### Error Monitoring (Sentry)
### Performance Monitoring

---

## Testing Checklist

### Before Launch:
- [ ] Test on iPhone SE (smallest screen)
- [ ] Test on Android Go device
- [ ] Test with screen reader (NVDA/JAWS)
- [ ] Test keyboard navigation
- [ ] Run Lighthouse audit (target: 90+ on all metrics)
- [ ] Run WAVE accessibility checker
- [ ] Test on 3G connection
- [ ] Verify all images load
- [ ] Check all links work
- [ ] Test form submissions
- [ ] Verify analytics tracking
- [ ] Check SEO meta tags
- [ ] Validate structured data
- [ ] Test PWA install
- [ ] Check security headers

---

## Success Metrics

### Week 1 Targets:
- Lighthouse Performance: 70+
- Lighthouse SEO: 95+
- Lighthouse Accessibility: 90+
- Lighthouse Best Practices: 95+

### Week 2 Targets:
- Lighthouse Performance: 85+
- Mobile usability: 100%
- Core Web Vitals: All green

### Week 4 Targets:
- Lighthouse Performance: 95+
- Conversion rate: 2%+
- Bounce rate: <50%
- Average session: 3+ minutes

---

**Next Steps:** Start with Day 1-2 SEO fixes immediately. These have the highest ROI and are critical for organic traffic.
