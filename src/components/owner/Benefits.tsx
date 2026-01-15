const benefits = [
  {
    icon: (
      <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Track Earnings Daily',
    description: 'Real-time earnings tracking with detailed breakdowns of commissions and payouts. Monitor your business performance with comprehensive analytics.',
  },
  {
    icon: (
      <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Real-Time Bookings',
    description: 'Instant notifications for new bookings, cancellations, and updates. Never miss an opportunity with our comprehensive booking management system.',
  },
  {
    icon: (
      <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Mobile-First Design',
    description: 'Manage your properties on-the-go with our PWA-compatible mobile interface. Full functionality optimized for phones and tablets.',
  },
  {
    icon: (
      <svg className="h-8 w-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Zero Setup Fees',
    description: 'Start earning immediately with no registration or listing fees. Only pay commission on successful bookings - 5-10% based on room rates.',
  },
  {
    icon: (
      <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Lightning Fast Onboarding',
    description: 'Complete property registration in under 5 minutes. Our step-by-step wizard guides you through compliance and listing requirements.',
  },
  {
    icon: (
      <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    title: 'Dedicated Support',
    description: '24/7 support through WhatsApp and email. Our Ayodhya-based team understands local hospitality needs and regulations.',
  },
];

export default function Benefits() {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Why Choose Shambit Partner Portal?
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Join hundreds of Ayodhya property owners who trust us to grow their business
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="relative rounded-2xl bg-white p-8 shadow-lg ring-1 ring-gray-200 transition-all hover:shadow-xl hover:-translate-y-1"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50">
                  {benefit.icon}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {benefit.title}
                  </h3>
                </div>
              </div>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>

        {/* Call to action */}
        <div className="mt-16 text-center">
          <div className="rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 p-8 text-white">
            <h3 className="text-2xl font-bold">Ready to Get Started?</h3>
            <p className="mt-2 text-orange-100">
              Join the fastest-growing hospitality network in Ayodhya
            </p>
            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <a
                href="/owner/register"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 font-semibold text-orange-600 transition-colors hover:bg-gray-50"
              >
                Register Your Property
                <svg className="ml-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </a>
              <a
                href="/owner/login"
                className="inline-flex items-center justify-center rounded-full border-2 border-white bg-transparent px-6 py-3 font-semibold text-white transition-colors hover:bg-white hover:text-orange-600"
              >
                Already Registered? Login
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
