import Hero from '@/components/owner/Hero';
import Benefits from '../../components/owner/Benefits';
import Footer from '../../components/owner/Footer';

export default function OwnerLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      <Hero />
      <Benefits />
      <Footer />
    </div>
  );
}
