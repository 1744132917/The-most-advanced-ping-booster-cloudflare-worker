/**
 * Example Client Implementation for Ping Booster Worker
 * 
 * This file demonstrates how to interact with the ping booster worker
 * from various client environments (browser, Node.js, etc.)
 */

// ============================================================================
// Browser Example - HTTP Requests
// ============================================================================

async function fetchWithPingBooster() {
  const workerUrl = 'https://your-worker.workers.dev';
  
  try {
    const response = await fetch(`${workerUrl}/api/data`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Check performance headers
    console.log('Cache Status:', response.headers.get('x-cache'));
    console.log('Backend:', response.headers.get('x-backend'));
    console.log('Latency:', response.headers.get('x-latency'), 'ms');
    console.log('Region:', response.headers.get('x-region'));
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
}

// ============================================================================
// Browser Example - WebSocket Connection
// ============================================================================

class PingBoosterWebSocket {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.messageHandlers = new Map();
    this.latencyHistory = [];
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        resolve();
      };
      
      this.ws.onmessage = (event) => {
        this.handleMessage(event);
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };
      
      this.ws.onclose = () => {
        console.log('WebSocket closed');
        this.reconnect();
      };
    });
  }

  handleMessage(event) {
    try {
      const message = JSON.parse(event.data);
      
      // Handle ping/pong for keep-alive
      if (message.type === 'ping') {
        this.send({ type: 'pong', timestamp: Date.now() });
        return;
      }
      
      // Track latency
      if (message.latency) {
        this.latencyHistory.push(message.latency);
        if (this.latencyHistory.length > 100) {
          this.latencyHistory.shift();
        }
        console.log('Average latency:', this.getAverageLatency(), 'ms');
      }
      
      // Call registered handlers
      const handler = this.messageHandlers.get(message.type);
      if (handler) {
        handler(message);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        ...data,
        timestamp: Date.now(),
      }));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  on(type, handler) {
    this.messageHandlers.set(type, handler);
  }

  reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect().catch(console.error);
    }, delay);
  }

  getAverageLatency() {
    if (this.latencyHistory.length === 0) return 0;
    const sum = this.latencyHistory.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.latencyHistory.length);
  }

  close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Usage example
async function useWebSocket() {
  const ws = new PingBoosterWebSocket('wss://your-worker.workers.dev/ws');
  
  // Register message handler
  ws.on('response', (message) => {
    console.log('Received response:', message.data);
  });
  
  // Connect
  await ws.connect();
  
  // Send messages
  ws.send({
    type: 'message',
    data: { action: 'getData', params: { id: 123 } },
  });
}

// ============================================================================
// Node.js Example - HTTP Requests
// ============================================================================

// Using fetch (Node.js 18+) or node-fetch
async function nodeFetchExample() {
  const fetch = globalThis.fetch; // or require('node-fetch')
  const workerUrl = 'https://your-worker.workers.dev';
  
  try {
    const response = await fetch(`${workerUrl}/api/data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'example',
      }),
    });
    
    console.log('Status:', response.status);
    console.log('Cache:', response.headers.get('x-cache'));
    console.log('Latency:', response.headers.get('x-latency'), 'ms');
    
    const data = await response.json();
    console.log('Data:', data);
  } catch (error) {
    console.error('Request failed:', error);
  }
}

// ============================================================================
// Node.js Example - WebSocket Connection
// ============================================================================

// Using 'ws' package
function nodeWebSocketExample() {
  const WebSocket = require('ws');
  const ws = new WebSocket('wss://your-worker.workers.dev/ws');
  
  ws.on('open', () => {
    console.log('Connected');
    
    // Send initial message
    ws.send(JSON.stringify({
      type: 'message',
      data: { action: 'subscribe', channel: 'updates' },
      timestamp: Date.now(),
    }));
  });
  
  ws.on('message', (data) => {
    const message = JSON.parse(data);
    console.log('Received:', message);
    
    // Handle ping/pong
    if (message.type === 'ping') {
      ws.send(JSON.stringify({
        type: 'pong',
        timestamp: Date.now(),
      }));
    }
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
  
  ws.on('close', () => {
    console.log('Disconnected');
  });
}

// ============================================================================
// Health Check Example
// ============================================================================

async function checkHealth() {
  const workerUrl = 'https://your-worker.workers.dev';
  
  try {
    const response = await fetch(`${workerUrl}/health`);
    const health = await response.json();
    
    console.log('Worker Status:', health.status);
    console.log('Metrics:', health.metrics);
    console.log('Backends:', health.backends);
    
    // Check if all backends are healthy
    const allHealthy = health.backends.every(b => b.healthy);
    if (!allHealthy) {
      console.warn('Some backends are unhealthy!');
    }
    
    return health;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
}

// ============================================================================
// Metrics Monitoring Example
// ============================================================================

async function monitorMetrics(interval = 5000) {
  const workerUrl = 'https://your-worker.workers.dev';
  
  setInterval(async () => {
    try {
      const response = await fetch(`${workerUrl}/metrics`);
      const metrics = await response.json();
      
      console.log('=== Metrics ===');
      console.log('Total Requests:', metrics.metrics.totalRequests);
      console.log('Active Connections:', metrics.metrics.activeConnections);
      console.log('Cache Hit Rate:', 
        (metrics.metrics.cacheHits / 
        (metrics.metrics.cacheHits + metrics.metrics.cacheMisses) * 100).toFixed(2) + '%'
      );
      console.log('Rate Limited Clients:', metrics.rateLimits);
      console.log('===============');
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
  }, interval);
}

// ============================================================================
// React Hook Example
// ============================================================================

function usePingBooster(workerUrl) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [metrics, setMetrics] = React.useState({
    latency: 0,
    cacheStatus: 'MISS',
    backend: '',
  });

  const fetchData = async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const startTime = Date.now();
      const response = await fetch(`${workerUrl}${endpoint}`, options);
      const responseTime = Date.now() - startTime;
      
      // Update metrics
      setMetrics({
        latency: parseInt(response.headers.get('x-latency') || responseTime),
        cacheStatus: response.headers.get('x-cache') || 'MISS',
        backend: response.headers.get('x-backend') || 'unknown',
      });
      
      const result = await response.json();
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, metrics, fetchData };
}

// Usage in React component
function ExampleComponent() {
  const { data, loading, error, metrics, fetchData } = usePingBooster('https://your-worker.workers.dev');

  React.useEffect(() => {
    fetchData('/api/data');
  }, []);

  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {data && (
        <div>
          <h3>Data: {JSON.stringify(data)}</h3>
          <p>Latency: {metrics.latency}ms</p>
          <p>Cache: {metrics.cacheStatus}</p>
          <p>Backend: {metrics.backend}</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Load Testing Example
// ============================================================================

async function loadTest(concurrentRequests = 10, totalRequests = 100) {
  const workerUrl = 'https://your-worker.workers.dev';
  const results = {
    success: 0,
    failed: 0,
    totalLatency: 0,
    cacheHits: 0,
    cacheMisses: 0,
  };

  async function makeRequest() {
    const startTime = Date.now();
    try {
      const response = await fetch(`${workerUrl}/api/data`);
      const latency = Date.now() - startTime;
      
      results.success++;
      results.totalLatency += latency;
      
      if (response.headers.get('x-cache') === 'HIT') {
        results.cacheHits++;
      } else {
        results.cacheMisses++;
      }
    } catch (error) {
      results.failed++;
    }
  }

  // Run load test
  console.log(`Starting load test: ${totalRequests} requests with ${concurrentRequests} concurrent`);
  const startTime = Date.now();
  
  for (let i = 0; i < totalRequests; i += concurrentRequests) {
    const batch = [];
    for (let j = 0; j < concurrentRequests && i + j < totalRequests; j++) {
      batch.push(makeRequest());
    }
    await Promise.all(batch);
  }
  
  const totalTime = Date.now() - startTime;
  
  console.log('=== Load Test Results ===');
  console.log('Total Time:', totalTime, 'ms');
  console.log('Successful Requests:', results.success);
  console.log('Failed Requests:', results.failed);
  console.log('Average Latency:', Math.round(results.totalLatency / results.success), 'ms');
  console.log('Requests/Second:', Math.round((totalRequests / totalTime) * 1000));
  console.log('Cache Hit Rate:', Math.round((results.cacheHits / totalRequests) * 100) + '%');
  console.log('========================');
}

// ============================================================================
// Export for use in other modules
// ============================================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    fetchWithPingBooster,
    PingBoosterWebSocket,
    nodeFetchExample,
    nodeWebSocketExample,
    checkHealth,
    monitorMetrics,
    usePingBooster,
    loadTest,
  };
}
