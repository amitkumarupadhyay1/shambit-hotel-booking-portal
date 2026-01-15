export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Shambit",
    "url": "https://shambit.in",
    "logo": "https://shambit.in/logo.png",
    "description": "Leading hotel booking platform for Ayodhya - verified stays near Ram Mandir",
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
      "https://instagram.com/shambit_in",
      "https://linkedin.com/company/shambit"
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
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://shambit.in/search?q={search_term_string}"
      },
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

export function LocalBusinessSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "name": "Shambit",
    "image": "https://shambit.in/og-image.jpg",
    "priceRange": "₹₹",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Ram Path, Naya Ghat",
      "addressLocality": "Ayodhya",
      "addressRegion": "UP",
      "postalCode": "224123",
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 26.7922,
      "longitude": 82.1998
    },
    "url": "https://shambit.in",
    "telephone": "+91-999-999-9999",
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ],
      "opens": "00:00",
      "closes": "23:59"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
