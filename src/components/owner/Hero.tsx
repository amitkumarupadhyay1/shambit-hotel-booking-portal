import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative px-6 py-16 sm:py-24 lg:py-32">
      {/* Background with subtle Ayodhya temple pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-orange-100/20 to-yellow-100/20" />

      <div className="relative mx-auto max-w-7xl">
        <div className="text-center">
          {/* Main headline */}
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
            Welcome to{' '}
            <span className="text-orange-600">Shambit</span>{' '}
            Partner Portal
          </h1>

          {/* Subheadline */}
          <p className="mt-6 text-xl font-medium text-gray-600 sm:text-2xl">
            Grow Your Ayodhya Business with Zero Registration Fees
          </p>

          {/* Key benefits */}
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center sm:gap-8">
            <div className="flex items-center justify-center gap-2 text-lg font-semibold text-green-700">
              <span className="rounded-full bg-green-100 p-1">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
              Earn More with 5-10% Commission Only on Bookings
            </div>
            <div className="flex items-center justify-center gap-2 text-lg font-semibold text-blue-700">
              <span className="rounded-full bg-blue-100 p-1">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </span>
              Easy Onboarding in Minutes
            </div>
            <div className="flex items-center justify-center gap-2 text-lg font-semibold text-purple-700">
              <span className="rounded-full bg-purple-100 p-1">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </span>
              Manage Everything from Your Phone
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/owner/login"
              className="inline-flex items-center justify-center rounded-full bg-orange-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-colors hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            >
              Login
              <svg className="ml-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
            <Link
              href="/owner/register"
              className="inline-flex items-center justify-center rounded-full border-2 border-orange-600 bg-white px-8 py-4 text-lg font-semibold text-orange-600 shadow-lg transition-colors hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            >
              Register Your Property
              <svg className="ml-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="mt-16">
            <p className="text-sm text-gray-500">Trusted by Ayodhya Property Owners</p>
            <div className="mt-4 flex justify-center gap-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">500+</div>
                <div className="text-sm text-gray-600">Properties Listed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">10K+</div>
                <div className="text-sm text-gray-600">Bookings Made</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">₹50L+</div>
                <div className="text-sm text-gray-600">Earnings Generated</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
