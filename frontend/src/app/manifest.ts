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
    icons: [
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
        purpose: 'any',
      },
    ],
    categories: ['travel', 'lifestyle'],
    shortcuts: [
      {
        name: 'Search Hotels',
        short_name: 'Search',
        description: 'Search for hotels in Ayodhya',
        url: '/search',
        icons: [{ src: '/icon-search.png', sizes: '96x96' }],
      },
      {
        name: 'My Bookings',
        short_name: 'Bookings',
        description: 'View your bookings',
        url: '/bookings',
        icons: [{ src: '/icon-bookings.png', sizes: '96x96' }],
      },
    ],
  };
}
