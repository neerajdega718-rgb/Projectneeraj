const CACHE_NAME = 'studysnap-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/js/app.js',
  '/js/ai-engine.js',
  '/js/utils.js',
  '/js/gamification.js',
  '/js/homework.js',
  '/js/quizzes.js',
  '/js/flashcards.js',
  '/js/essay.js',
  '/js/tools.js',
  '/js/firebase-config.js',
  '/js/study-friends.js',
  '/js/parent-dashboard.js',
  '/assets/studysnap-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(urlsToCache)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).catch(() => caches.match('/index.html'))));
});
