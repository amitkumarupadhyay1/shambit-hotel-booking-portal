import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Shambit - Book Hotels in Ayodhya',
    short_name: 'Shambit',
    description: 'Book verified hotels, homestays & dharamshalas near Ram Mandir in Ayodhya. Best deals starting ₹999.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0F4C5C',
    orientation: 'portrait-primary',
    scope: '/',
    id: '/',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    screenshots: [
      {
        src: '/ramji.jpg',
        sizes: '1080x1920',
        type: 'image/jpeg',
        form_factor: 'narrow',
        label: 'Search Hotels in Ayodhya'
      },
      {
        src: '/ram mandir.jpg',
        sizes: '1280x720',
        type: 'image/jpeg',
        form_factor: 'wide',
        label: 'Premium Stays Near Ram Mandir'
      }
    ],
    categories: ['travel', 'lifestyle'],
    lang: 'en',
    dir: 'ltr',
    prefer_related_applications: false,
    related_applications: [],
    shortcuts: [
      {
        name: 'Search Hotels',
        short_name: 'Search',
        description: 'Search for hotels in Ayodhya',
        url: '/search',
        icons: [{ src: '/logo.png', sizes: '96x96', type: 'image/png' }],
      },
      {
        name: 'My Bookings',
        short_name: 'Bookings',
        description: 'View your bookings',
        url: '/my-bookings',
        icons: [{ src: '/logo.png', sizes: '96x96', type: 'image/png' }],
      },
    ],
  };
}
