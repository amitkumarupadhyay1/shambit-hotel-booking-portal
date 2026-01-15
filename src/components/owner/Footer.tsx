import Link from 'next/link';

const footerLinks = {
  platform: [
    { name: 'Login', href: '/owner/login' },
    { name: 'Register', href: '/owner/register' },
    { name: 'Dashboard', href: '/owner/dashboard' },
    { name: 'Properties', href: '/owner/properties' },
  ],
  compliance: [
    { name: 'GST Registration', href: '/compliance/gst' },
    { name: 'Fire NOC', href: '/compliance/fire-noc' },
    { name: 'Health License', href: '/compliance/health-license' },
    { name: 'UP Tourism Registration', href: '/compliance/up-tourism' },
    { name: 'FSSAI Certificate', href: '/compliance/fssai' },
    { name: 'Police Verification', href: '/compliance/police-verification' },
  ],
  legal: [
    { name: 'Terms of Service', href: '/legal/terms' },
    { name: 'Privacy Policy', href: '/legal/privacy' },
    { name: 'Grievance Officer', href: '/legal/grievance' },
    { name: 'DPDP Act Compliance', href: '/legal/dpdp' },
  ],
  support: [
    { name: 'Help Center', href: '/support' },
    { name: 'Contact Us', href: '/contact' },
    { name: 'WhatsApp Support', href: 'https://wa.me/919876543210' },
    { name: 'Email Support', href: 'mailto:support@shambit.com' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-orange-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-xl font-bold">Shambit</span>
            </div>
            <p className="mt-4 text-gray-400 leading-relaxed">
              Empowering Ayodhya's hospitality industry with technology.
              Connecting property owners with travelers through our seamless booking platform.
            </p>
            <div className="mt-6">
              <p className="text-sm text-gray-400">Follow us on social media</p>
              <div className="mt-2 flex gap-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Follow us on Twitter">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Follow us on Facebook">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Follow us on LinkedIn">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="grid gap-8 sm:grid-cols-2 lg:col-span-3">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-orange-400">
                Platform
              </h3>
              <ul className="mt-4 space-y-2">
                {footerLinks.platform.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-orange-400">
                Compliance
              </h3>
              <ul className="mt-4 space-y-2">
                {footerLinks.compliance.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-orange-400">
                Legal
              </h3>
              <ul className="mt-4 space-y-2">
                {footerLinks.legal.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-orange-400">
                Support
              </h3>
              <ul className="mt-4 space-y-2">
                {footerLinks.support.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-12 border-t border-gray-800 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-gray-400">
              © 2024 Shambit Hospitality Private Limited. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-gray-400">
              <span>📍 Ayodhya, Uttar Pradesh</span>
              <span>📞 +91 98765 43210</span>
              <span>✉️ support@shambit.com</span>
            </div>
          </div>
        </div>

        {/* Compliance notice */}
        <div className="mt-8 rounded-lg bg-gray-800 p-4">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-gray-300">
              <p className="font-medium text-orange-400 mb-1">Legal Compliance Notice</p>
              <p>
                All property listings on Shambit must comply with UP Tourism guidelines, GST regulations,
                and local hospitality laws. Non-compliant properties will be removed from the platform.
                For detailed compliance requirements, please refer to our{' '}
                <Link href="/compliance" className="text-orange-400 hover:text-orange-300 underline">
                  compliance checklist
                </Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
