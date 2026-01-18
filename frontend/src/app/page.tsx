import dynamic from 'next/dynamic';
import { Header } from "@/components/layout/header";
import { Hero } from "@/components/landing/hero";
import { Footer } from "@/components/layout/footer";
import { OrganizationSchema, WebsiteSchema, LocalBusinessSchema } from "@/components/seo/structured-data";
import { PWAInstallOverlay } from '@/components/pwa/pwa-install-overlay';

// Lazy load below-the-fold components for better performance
const PropertyTypes = dynamic(() => import("@/components/landing/property-types").then(mod => ({ default: mod.PropertyTypes })), {
  loading: () => <div className="py-16 bg-gradient-to-b from-gray-50 to-white animate-pulse"><div className="max-w-7xl mx-auto px-4 h-64 bg-gray-100 rounded-xl" /></div>
});

const FeaturedDestinations = dynamic(() => import("@/components/landing/featured-destinations").then(mod => ({ default: mod.FeaturedDestinations })), {
  loading: () => <div className="py-16 bg-white animate-pulse"><div className="max-w-7xl mx-auto px-4 h-64 bg-gray-100 rounded-xl" /></div>
});

const CTABanner = dynamic(() => import("@/components/landing/cta-banner").then(mod => ({ default: mod.CTABanner })));

export default function Home() {
  return (
    <>
      {/* Structured Data for SEO */}
      <OrganizationSchema />
      <WebsiteSchema />
      <LocalBusinessSchema />

      <main
        id="main-content"
        className="min-h-screen bg-background font-sans text-foreground selection:bg-teal-100 selection:text-teal-900"
      >
        <Header />
        <Hero />
        <div className="space-y-12 pb-20">
          <PropertyTypes />
          <FeaturedDestinations />
          <CTABanner />
        </div>
        <Footer />
        <PWAInstallOverlay />
      </main>
    </>
  );
}
