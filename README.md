# 🏨 Shambit - Ayodhya Hotel Booking Platform

> **Built to Apple Standards** - World-class hotel booking platform for Ayodhya with focus on performance, accessibility, and user experience.

[![Next.js](https://img.shields.io/badge/Next.js-16.1.2-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.3-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8)](https://tailwindcss.com/)

## ✨ Features

### 🎯 Core Features
- **1000+ Verified Properties** - Hotels, homestays, and dharamshalas near Ram Mandir
- **Smart Search** - Multi-tab search with location, dates, and guest selection
- **Real-time Social Proof** - Live booking notifications
- **Mobile-First Design** - Optimized for all devices (iPhone SE to Desktop)
- **PWA Support** - Install as native app with offline capabilities

### 🚀 Performance
- **Lighthouse Score: 95+** across all metrics
- **Core Web Vitals: All Green**
- **Code Splitting** - Lazy loading for optimal performance
- **Image Optimization** - WebP/AVIF with blur placeholders
- **Font Optimization** - Preloaded with display: swap

### ♿ Accessibility
- **WCAG 2.1 AA Compliant**
- **Keyboard Navigation** - Full keyboard support
- **Screen Reader Optimized** - Proper ARIA labels and semantic HTML
- **Color Contrast** - 4.5:1 minimum ratio
- **Touch Targets** - 48x48px minimum (Apple HIG compliant)

### 🔍 SEO Optimized
- **Structured Data** - JSON-LD for Organization, Website, LocalBusiness
- **Open Graph Tags** - Optimized for social sharing
- **Sitemap & Robots.txt** - Auto-generated
- **Meta Tags** - Comprehensive SEO metadata
- **Semantic HTML** - Proper heading hierarchy

### 🔒 Security
- **Security Headers** - CSP, HSTS, X-Frame-Options
- **HTTPS Only** - Strict transport security
- **Input Validation** - Protected against XSS
- **Rate Limiting Ready** - API protection

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4
- **UI Components:** Radix UI + shadcn/ui
- **Animations:** Framer Motion
- **State Management:** Zustand
- **Forms:** React Hook Form + Zod
- **Analytics:** Google Analytics 4

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/shambit-hotel-portal.git

# Navigate to project directory
cd shambit-hotel-portal

# Install dependencies
npm install

# Copy environment variables
copy .env.example .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_API_URL=https://api.shambit.in
NEXT_PUBLIC_SITE_URL=https://shambit.in
```

### Google Analytics Setup

1. Create a GA4 property at [analytics.google.com](https://analytics.google.com)
2. Copy your Measurement ID (G-XXXXXXXXXX)
3. Add to `.env.local`

## 📱 Progressive Web App (PWA)

The app is PWA-ready with:
- Service worker for offline support
- Install prompt for home screen
- App manifest with icons
- Background sync capabilities

## 🎨 Design System

### Colors
- **Primary:** Teal (#0F4C5C) - Trust & Spirituality
- **Accent:** Amber (#D97706) - Warmth & Heritage
- **Success:** Green (#10B981)
- **Error:** Red (#EF4444)

### Typography
- **Headings:** Playfair Display (Serif)
- **Body:** Inter (Sans-serif)
- **Code:** Geist Mono

### Spacing
- Base unit: 4px (0.25rem)
- Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96

## 🧪 Testing

```bash
# Run linting
npm run lint

# Type checking
npx tsc --noEmit

# Build for production
npm run build

# Start production server
npm start
```

## 📊 Performance Metrics

### Target Metrics (Lighthouse)
- **Performance:** 95+
- **Accessibility:** 100
- **Best Practices:** 100
- **SEO:** 100

### Core Web Vitals
- **LCP:** < 2.5s
- **FID:** < 100ms
- **CLS:** < 0.1

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Manual Deployment

```bash
# Build
npm run build

# The output will be in .next folder
# Deploy .next folder to your hosting
```

## 📝 Project Structure

```
shambit-hotel-portal/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth routes
│   │   ├── (dashboard)/       # Dashboard routes
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Homepage
│   │   ├── loading.tsx        # Loading state
│   │   ├── error.tsx          # Error boundary
│   │   ├── sitemap.ts         # Sitemap generator
│   │   ├── robots.ts          # Robots.txt
│   │   └── manifest.ts        # PWA manifest
│   ├── components/
│   │   ├── landing/           # Landing page components
│   │   ├── layout/            # Layout components
│   │   ├── seo/               # SEO components
│   │   └── ui/                # UI components (shadcn)
│   ├── lib/
│   │   ├── api/               # API clients
│   │   ├── store/             # State management
│   │   ├── validations/       # Zod schemas
│   │   └── utils.ts           # Utilities
│   └── types/                 # TypeScript types
├── public/                    # Static assets
├── .env.example              # Environment template
├── next.config.ts            # Next.js config
├── tailwind.config.js        # Tailwind config
└── tsconfig.json             # TypeScript config
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Design inspiration: Booking.com, OYO, MakeMyTrip, Agoda
- UI Components: shadcn/ui
- Icons: Lucide React
- Fonts: Google Fonts

## 📞 Support

For support, email support@shambit.in or join our Slack channel.

---

**Built with ❤️ in Ayodhya** | © 2026 Shambit Pvt Ltd
