/**
 * Service Worker
 * 实现离线支持、缓存策略、后台同步
 */

const CACHE_NAME = 'my-admin-v1'
const STATIC_CACHE = 'my-admin-static-v1'
const API_CACHE = 'my-admin-api-v1'

// 需要预缓存的静态资源
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  // 添加其他需要预缓存的资源
]

// 需要缓存的 API 请求模式
const API_CACHE_PATTERNS = [
  /^\/api\//
]

/**
 * 安装事件
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS)
    })
  )
  self.skipWaiting()
})

/**
 * 激活事件
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return (
              cacheName !== STATIC_CACHE &&
              cacheName !== API_CACHE &&
              cacheName !== CACHE_NAME
            )
          })
          .map((cacheName) => caches.delete(cacheName))
      )
    })
  )
  self.clients.claim()
})

/**
 * 拦截请求
 */
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // 跳过非 HTTP 请求
  if (!url.protocol.startsWith('http')) return

  // API 请求 - Network First 策略
  if (API_CACHE_PATTERNS.some((pattern) => pattern.test(url.pathname))) {
    event.respondWith(networkFirst(event.request))
    return
  }

  // 静态资源 - Cache First 策略
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(event.request))
    return
  }
})

/**
 * Network First 策略
 * 优先从网络获取，失败时使用缓存
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request)
    // 克隆响应以便缓存
    const responseClone = response.clone()
    const cache = await caches.open(API_CACHE)
    cache.put(request, responseClone)
    return response
  } catch (error) {
    const cache = await caches.open(API_CACHE)
    const cachedResponse = await cache.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    throw error
  }
}

/**
 * Cache First 策略
 * 优先从缓存获取，失败时从网络获取
 */
async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE)
  const cachedResponse = await cache.match(request)
  if (cachedResponse) {
    return cachedResponse
  }
  try {
    const response = await fetch(request)
    const responseClone = response.clone()
    cache.put(request, responseClone)
    return response
  } catch (error) {
    throw error
  }
}

/**
 * Network Only 策略
 * 只从网络获取
 */
async function networkOnly(request) {
  return fetch(request)
}

/**
 * Cache Only 策略
 * 只从缓存获取
 */
async function cacheOnly(request) {
  const cache = await caches.open(STATIC_CACHE)
  return cache.match(request)
}

/**
 * Stale While Revalidate 策略
 * 先返回缓存，同时后台更新
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(STATIC_CACHE)
  const cachedResponse = await cache.match(request)

  const fetchPromise = fetch(request).then((response) => {
    cache.put(request, response.clone())
    return response
  })

  return cachedResponse || fetchPromise
}

/**
 * 处理消息
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
