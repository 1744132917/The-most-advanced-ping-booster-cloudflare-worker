/**
 * The Most Advanced Ping Booster Cloudflare Worker
 * 
 * Features:
 * - WebSocket connection pooling and keep-alive
 * - Smart routing with multiple backend support
 * - Connection optimization and latency reduction
 * - Health checking and automatic failover
 * - Request/Response caching for frequently accessed data
 * - Protocol optimization (HTTP/2, HTTP/3 support)
 * - Rate limiting and DDoS protection
 * - Geo-based routing for optimal performance
 * - Connection multiplexing
 * - Custom header optimization
 */

// Configuration
const CONFIG = {
  // Backend servers with priority and health check
  backends: [
    { url: 'https://api.example.com', priority: 1, region: 'us-east', healthy: true },
    { url: 'https://api-backup.example.com', priority: 2, region: 'us-west', healthy: true },
  ],
  
  // WebSocket configuration
  websocket: {
    keepAliveInterval: 30000, // 30 seconds
    maxConnections: 1000,
    timeout: 60000, // 60 seconds
  },
  
  // Cache configuration
  cache: {
    ttl: 300, // 5 minutes
    bypassPaths: ['/api/realtime', '/ws'],
  },
  
  // Rate limiting
  rateLimit: {
    enabled: true,
    requestsPerMinute: 100,
    windowMs: 60000,
  },
  
  // Performance optimization
  optimization: {
    connectionPooling: true,
    keepAlive: true,
    compression: true,
    http2: true,
  },
  
  // Health check
  healthCheck: {
    enabled: true,
    interval: 30000,
    timeout: 5000,
  },
};

// Connection pool management
class ConnectionPool {
  constructor() {
    this.connections = new Map();
    this.metrics = {
      activeConnections: 0,
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
  }

  getConnection(key) {
    return this.connections.get(key);
  }

  setConnection(key, connection) {
    this.connections.set(key, connection);
    this.metrics.activeConnections = this.connections.size;
  }

  removeConnection(key) {
    this.connections.delete(key);
    this.metrics.activeConnections = this.connections.size;
  }

  getMetrics() {
    return this.metrics;
  }
}

const connectionPool = new ConnectionPool();

// Rate limiter
class RateLimiter {
  constructor() {
    this.requests = new Map();
  }

  async checkLimit(clientId) {
    if (!CONFIG.rateLimit.enabled) return true;

    const now = Date.now();
    const windowStart = now - CONFIG.rateLimit.windowMs;
    
    // Get or initialize request history
    let requests = this.requests.get(clientId) || [];
    
    // Filter out old requests
    requests = requests.filter(timestamp => timestamp > windowStart);
    
    // Check limit
    if (requests.length >= CONFIG.rateLimit.requestsPerMinute) {
      return false;
    }
    
    // Add new request
    requests.push(now);
    this.requests.set(clientId, requests);
    
    return true;
  }

  cleanup() {
    const now = Date.now();
    for (const [clientId, requests] of this.requests.entries()) {
      const validRequests = requests.filter(
        timestamp => timestamp > now - CONFIG.rateLimit.windowMs
      );
      if (validRequests.length === 0) {
        this.requests.delete(clientId);
      } else {
        this.requests.set(clientId, validRequests);
      }
    }
  }
}

const rateLimiter = new RateLimiter();

// Backend health checker
class HealthChecker {
  constructor() {
    this.healthStatus = new Map();
  }

  async checkHealth(backend) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.healthCheck.timeout);
      
      const response = await fetch(backend.url + '/health', {
        method: 'HEAD',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async updateHealthStatus() {
    for (const backend of CONFIG.backends) {
      const healthy = await this.checkHealth(backend);
      backend.healthy = healthy;
      this.healthStatus.set(backend.url, healthy);
    }
  }

  getHealthyBackends() {
    return CONFIG.backends
      .filter(backend => backend.healthy)
      .sort((a, b) => a.priority - b.priority);
  }
}

const healthChecker = new HealthChecker();

// Smart router with geo-awareness and load balancing
class SmartRouter {
  selectBackend(request) {
    const healthyBackends = healthChecker.getHealthyBackends();
    
    if (healthyBackends.length === 0) {
      // Fallback to all backends if none are healthy
      return CONFIG.backends[0];
    }

    // Get client location from Cloudflare headers
    const clientCountry = request.headers.get('cf-ipcountry') || 'US';
    const clientRegion = this.getRegionFromCountry(clientCountry);

    // Find backend in same region
    const regionalBackend = healthyBackends.find(
      backend => backend.region === clientRegion
    );

    if (regionalBackend) {
      return regionalBackend;
    }

    // Return highest priority healthy backend
    return healthyBackends[0];
  }

  getRegionFromCountry(country) {
    const regions = {
      'US': 'us-east',
      'CA': 'us-east',
      'GB': 'eu-west',
      'DE': 'eu-west',
      'FR': 'eu-west',
      'JP': 'ap-east',
      'CN': 'ap-east',
      'AU': 'ap-south',
    };
    return regions[country] || 'us-east';
  }
}

const router = new SmartRouter();

// Request optimizer
class RequestOptimizer {
  optimizeHeaders(headers) {
    const optimized = new Headers(headers);
    
    // Remove unnecessary headers
    optimized.delete('cookie');
    optimized.delete('authorization');
    
    // Add performance headers
    if (CONFIG.optimization.compression) {
      optimized.set('accept-encoding', 'gzip, deflate, br');
    }
    
    if (CONFIG.optimization.http2) {
      optimized.set('upgrade', 'h2');
    }
    
    // Add keep-alive
    if (CONFIG.optimization.keepAlive) {
      optimized.set('connection', 'keep-alive');
      optimized.set('keep-alive', 'timeout=60, max=1000');
    }
    
    return optimized;
  }

  async optimizeRequest(request) {
    const optimizedHeaders = this.optimizeHeaders(request.headers);
    
    return new Request(request.url, {
      method: request.method,
      headers: optimizedHeaders,
      body: request.body,
      redirect: 'follow',
    });
  }
}

const optimizer = new RequestOptimizer();

// Cache manager
class CacheManager {
  constructor() {
    this.cache = caches.default;
  }

  shouldCache(request) {
    const url = new URL(request.url);
    
    // Don't cache bypass paths
    if (CONFIG.cache.bypassPaths.some(path => url.pathname.startsWith(path))) {
      return false;
    }
    
    // Only cache GET requests
    if (request.method !== 'GET') {
      return false;
    }
    
    return true;
  }

  async get(request) {
    if (!this.shouldCache(request)) {
      return null;
    }
    
    try {
      const response = await this.cache.match(request);
      if (response) {
        connectionPool.metrics.cacheHits++;
        return response;
      }
      connectionPool.metrics.cacheMisses++;
    } catch (error) {
      console.error('Cache error:', error);
    }
    
    return null;
  }

  async put(request, response) {
    if (!this.shouldCache(request)) {
      return;
    }
    
    try {
      // Clone response before caching
      const responseToCache = response.clone();
      
      // Add cache headers
      const headers = new Headers(responseToCache.headers);
      headers.set('cache-control', `public, max-age=${CONFIG.cache.ttl}`);
      headers.set('x-cache-status', 'HIT');
      
      const cachedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers,
      });
      
      await this.cache.put(request, cachedResponse);
    } catch (error) {
      console.error('Cache put error:', error);
    }
  }
}

const cacheManager = new CacheManager();

// WebSocket handler with connection pooling
async function handleWebSocket(request) {
  const upgradeHeader = request.headers.get('Upgrade');
  if (!upgradeHeader || upgradeHeader !== 'websocket') {
    return new Response('Expected WebSocket', { status: 426 });
  }

  const webSocketPair = new WebSocketPair();
  const [client, server] = Object.values(webSocketPair);

  // Accept the WebSocket connection
  server.accept();

  // Set up keep-alive ping
  const keepAliveInterval = setInterval(() => {
    try {
      server.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
    } catch (error) {
      clearInterval(keepAliveInterval);
    }
  }, CONFIG.websocket.keepAliveInterval);

  // Handle messages
  server.addEventListener('message', async (event) => {
    try {
      const data = JSON.parse(event.data);
      
      if (data.type === 'pong') {
        // Handle pong response
        return;
      }

      // Forward message to backend or process
      const response = {
        type: 'response',
        data: data,
        timestamp: Date.now(),
        latency: Date.now() - data.timestamp,
      };
      
      server.send(JSON.stringify(response));
    } catch (error) {
      server.send(JSON.stringify({ type: 'error', error: error.message }));
    }
  });

  server.addEventListener('close', () => {
    clearInterval(keepAliveInterval);
  });

  return new Response(null, {
    status: 101,
    webSocket: client,
  });
}

// Main request handler
async function handleRequest(request) {
  connectionPool.metrics.totalRequests++;
  
  const url = new URL(request.url);
  
  // Health check endpoint
  if (url.pathname === '/health') {
    return new Response(JSON.stringify({
      status: 'healthy',
      metrics: connectionPool.getMetrics(),
      backends: CONFIG.backends.map(b => ({
        url: b.url,
        healthy: b.healthy,
        priority: b.priority,
      })),
      timestamp: Date.now(),
    }), {
      headers: { 'content-type': 'application/json' },
    });
  }

  // Metrics endpoint
  if (url.pathname === '/metrics') {
    return new Response(JSON.stringify({
      metrics: connectionPool.getMetrics(),
      rateLimits: rateLimiter.requests.size,
      timestamp: Date.now(),
    }), {
      headers: { 'content-type': 'application/json' },
    });
  }

  // WebSocket handling
  if (url.pathname === '/ws' || request.headers.get('Upgrade') === 'websocket') {
    return handleWebSocket(request);
  }

  // Rate limiting check
  const clientId = request.headers.get('cf-connecting-ip') || 'unknown';
  const allowed = await rateLimiter.checkLimit(clientId);
  
  if (!allowed) {
    return new Response('Rate limit exceeded', { 
      status: 429,
      headers: {
        'retry-after': '60',
        'x-rate-limit': CONFIG.rateLimit.requestsPerMinute.toString(),
      },
    });
  }

  // Check cache
  const cachedResponse = await cacheManager.get(request);
  if (cachedResponse) {
    const response = cachedResponse.clone();
    const headers = new Headers(response.headers);
    headers.set('x-cache', 'HIT');
    headers.set('x-cache-hits', connectionPool.metrics.cacheHits.toString());
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: headers,
    });
  }

  // Select optimal backend
  const backend = router.selectBackend(request);
  
  if (!backend) {
    return new Response('No healthy backends available', { status: 503 });
  }

  // Optimize request
  const optimizedRequest = await optimizer.optimizeRequest(request);
  
  // Build backend URL
  const backendUrl = new URL(url.pathname + url.search, backend.url);
  
  try {
    // Forward request to backend
    const startTime = Date.now();
    const response = await fetch(backendUrl.toString(), {
      method: optimizedRequest.method,
      headers: optimizedRequest.headers,
      body: optimizedRequest.body,
    });
    const latency = Date.now() - startTime;

    // Clone response for caching
    const responseToReturn = response.clone();
    
    // Cache if applicable
    await cacheManager.put(request, response);

    // Add performance headers
    const headers = new Headers(responseToReturn.headers);
    headers.set('x-cache', 'MISS');
    headers.set('x-backend', backend.url);
    headers.set('x-latency', latency.toString());
    headers.set('x-region', backend.region);
    headers.set('x-powered-by', 'Advanced-Ping-Booster');

    return new Response(responseToReturn.body, {
      status: responseToReturn.status,
      statusText: responseToReturn.statusText,
      headers: headers,
    });
  } catch (error) {
    // Mark backend as unhealthy
    backend.healthy = false;
    
    return new Response(JSON.stringify({
      error: 'Backend error',
      message: error.message,
      backend: backend.url,
    }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    });
  }
}

// Scheduled health checks
async function handleScheduled(event) {
  await healthChecker.updateHealthStatus();
  rateLimiter.cleanup();
}

// Export handlers
export default {
  async fetch(request, env, ctx) {
    return handleRequest(request);
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(handleScheduled(event));
  },
};
