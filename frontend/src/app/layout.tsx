import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono, Playfair_Display } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster } from 'sonner';

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
    display: "swap",
    preload: true,
});

const playfair = Playfair_Display({
    variable: "--font-playfair",
    subsets: ["latin"],
    display: "swap",
    preload: true,
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
    display: "swap",
});

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#ffffff' },
        { media: '(prefers-color-scheme: dark)', color: '#0F4C5C' },
    ],
};

export const metadata: Metadata = {
    metadataBase: new URL('https://shambit.in'),
    title: {
        default: "Book Hotels in Ayodhya | 1000+ Verified Stays Near Ram Mandir | Shambit",
        template: "%s | Shambit - Ayodhya Hotels & Homestays"
    },
    description: "Find best hotel deals in Ayodhya starting ₹999. Book verified hotels, homestays & dharamshalas near Ram Mandir. Free cancellation. Pay at hotel. 24/7 support.",
    keywords: ["ayodhya hotels", "ram mandir hotels", "ayodhya booking", "dharamshala ayodhya", "homestay ayodhya", "hotels near ram janmabhoomi", "ayodhya accommodation", "ram ki paidi hotels", "hanuman garhi hotels"],
    authors: [{ name: "Shambit", url: "https://shambit.in" }],
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
        description: "1000+ verified properties. Starting ₹999/night. Free cancellation. Pay at hotel. 24/7 support.",
        siteName: "Shambit",
        images: [
            {
                url: "/og-image-ayodhya.jpg",
                width: 1200,
                height: 630,
                alt: "Shambit - Book Hotels in Ayodhya Near Ram Mandir",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Book Hotels in Ayodhya | Shambit",
        description: "Best deals on Ayodhya hotels near Ram Mandir. Starting ₹999/night.",
        images: ["/twitter-card.jpg"],
        creator: "@shambit_in",
        site: "@shambit_in",
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
    category: "travel",
    applicationName: "Shambit",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "Shambit",
    },
};

const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-XXXXXXXXXX';

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="scroll-smooth">
            <head>
                {/* Preconnect to external domains */}
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                
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
                                anonymize_ip: true,
                            });
                        `,
                    }}
                />
            </head>
            <body
                className={`${inter.variable} ${playfair.variable} ${geistMono.variable} antialiased`}
            >
                {children}
                <Toaster richColors position="top-center" />
            </body>
        </html>
    );
}
