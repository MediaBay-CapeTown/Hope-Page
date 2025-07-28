// MediaBay Service Worker
// Provides offline functionality and caching for PWA

const CACHE_NAME = 'mediabay-v1.0.0';
const STATIC_CACHE = 'mediabay-static-v1.0.0';
const DYNAMIC_CACHE = 'mediabay-dynamic-v1.0.0';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/index.html',
  '/assets/css/styles.css',
  '/assets/js/main.js',
  '/assets/images/logo.jpeg',
  '/manifest.json',
  // Google Fonts
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Poppins:wght@300;400;500;600;700;800;900&display=swap',
  // Font Awesome
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Files to cache dynamically
const DYNAMIC_FILES = [
  // External images from Unsplash
  'https://images.unsplash.com/',
  // API endpoints (if any)
  '/api/'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Service Worker: Static files cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Error caching static files', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated successfully');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve cached files or fetch from network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Handle different types of requests
  if (isStaticFile(request.url)) {
    // Static files - cache first strategy
    event.respondWith(cacheFirst(request));
  } else if (isImageRequest(request.url)) {
    // Images - cache first with fallback
    event.respondWith(cacheFirstWithFallback(request));
  } else if (isAPIRequest(request.url)) {
    // API requests - network first strategy
    event.respondWith(networkFirst(request));
  } else {
    // Other requests - stale while revalidate
    event.respondWith(staleWhileRevalidate(request));
  }
});

// Cache strategies
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Cache first strategy failed:', error);
    return new Response('Offline - Content not available', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

async function cacheFirstWithFallback(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Cache first with fallback failed:', error);
    // Return a fallback image or placeholder
    return caches.match('/assets/images/logo.jpeg');
  }
}

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Network first strategy failed:', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response(JSON.stringify({
      error: 'Network unavailable',
      message: 'Please check your internet connection'
    }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch((error) => {
    console.error('Stale while revalidate fetch failed:', error);
    return cachedResponse;
  });
  
  return cachedResponse || fetchPromise;
}

// Helper functions
function isStaticFile(url) {
  const staticExtensions = ['.css', '.js', '.html', '.json'];
  return staticExtensions.some(ext => url.includes(ext)) || 
         url.includes('fonts.googleapis.com') ||
         url.includes('cdnjs.cloudflare.com');
}

function isImageRequest(url) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  return imageExtensions.some(ext => url.includes(ext)) ||
         url.includes('images.unsplash.com') ||
         url.includes('ui-avatars.com');
}

function isAPIRequest(url) {
  return url.includes('/api/') || 
         url.includes('api.') ||
         url.includes('googleapis.com');
}

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === 'contact-form-sync') {
    event.waitUntil(syncContactForms());
  }
  
  if (event.tag === 'newsletter-sync') {
    event.waitUntil(syncNewsletterSignups());
  }
});

async function syncContactForms() {
  try {
    const pendingForms = await getStoredData('pendingContactForms');
    
    for (const formData of pendingForms) {
      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });
        
        if (response.ok) {
          // Remove from pending list
          await removeStoredData('pendingContactForms', formData.id);
          console.log('Contact form synced successfully');
        }
      } catch (error) {
        console.error('Failed to sync contact form:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

async function syncNewsletterSignups() {
  try {
    const pendingSignups = await getStoredData('pendingNewsletterSignups');
    
    for (const signupData of pendingSignups) {
      try {
        const response = await fetch('/api/newsletter', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(signupData)
        });
        
        if (response.ok) {
          await removeStoredData('pendingNewsletterSignups', signupData.id);
          console.log('Newsletter signup synced successfully');
        }
      } catch (error) {
        console.error('Failed to sync newsletter signup:', error);
      }
    }
  } catch (error) {
    console.error('Newsletter sync failed:', error);
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: 'Thank you for your interest in MediaBay!',
    icon: '/assets/images/logo.jpeg',
    badge: '/assets/images/logo.jpeg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Website',
        icon: '/assets/images/logo.jpeg'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/assets/images/logo.jpeg'
      }
    ]
  };
  
  if (event.data) {
    const data = event.data.json();
    options.body = data.body || options.body;
    options.title = data.title || 'MediaBay';
  }
  
  event.waitUntil(
    self.registration.showNotification('MediaBay', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.matchAll().then((clientList) => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
  
  if (event.data && event.data.type === 'STORE_FORM_DATA') {
    storeData(event.data.key, event.data.data);
  }
});

// IndexedDB helpers for offline storage
async function storeData(key, data) {
  try {
    const db = await openDB();
    const transaction = db.transaction(['offline_data'], 'readwrite');
    const store = transaction.objectStore('offline_data');
    
    await store.put({
      id: key,
      data: data,
      timestamp: Date.now()
    });
    
    console.log('Data stored offline:', key);
  } catch (error) {
    console.error('Failed to store data offline:', error);
  }
}

async function getStoredData(key) {
  try {
    const db = await openDB();
    const transaction = db.transaction(['offline_data'], 'readonly');
    const store = transaction.objectStore('offline_data');
    
    const result = await store.get(key);
    return result ? result.data : [];
  } catch (error) {
    console.error('Failed to get stored data:', error);
    return [];
  }
}

async function removeStoredData(key, itemId) {
  try {
    const db = await openDB();
    const transaction = db.transaction(['offline_data'], 'readwrite');
    const store = transaction.objectStore('offline_data');
    
    const data = await getStoredData(key);
    const updatedData = data.filter(item => item.id !== itemId);
    
    await store.put({
      id: key,
      data: updatedData,
      timestamp: Date.now()
    });
    
    console.log('Data removed from offline storage');
  } catch (error) {
    console.error('Failed to remove stored data:', error);
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MediaBayDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('offline_data')) {
        const store = db.createObjectStore('offline_data', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('Service Worker: Periodic sync triggered', event.tag);
  
  if (event.tag === 'content-sync') {
    event.waitUntil(syncContent());
  }
});

async function syncContent() {
  try {
    // Sync any cached content with server
    console.log('Syncing content in background');
    
    // Update cache with fresh content
    const cache = await caches.open(DYNAMIC_CACHE);
    const requests = await cache.keys();
    
    for (const request of requests) {
      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.put(request, response);
        }
      } catch (error) {
        console.error('Failed to sync content:', error);
      }
    }
  } catch (error) {
    console.error('Periodic sync failed:', error);
  }
}

// Error handling
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker unhandled rejection:', event.reason);
});

// Cleanup old caches periodically
setInterval(async () => {
  try {
    const cacheNames = await caches.keys();
    const oldCaches = cacheNames.filter(name => 
      !name.includes('v1.0.0') && 
      (name.includes('mediabay') || name.includes('static') || name.includes('dynamic'))
    );
    
    await Promise.all(oldCaches.map(name => caches.delete(name)));
    
    if (oldCaches.length > 0) {
      console.log('Cleaned up old caches:', oldCaches);
    }
  } catch (error) {
    console.error('Cache cleanup failed:', error);
  }
}, 24 * 60 * 60 * 1000); // Run daily

console.log('Service Worker: Loaded successfully');