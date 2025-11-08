# Example Configuration

This file shows example configurations for different use cases.

## Basic Configuration

```javascript
const CONFIG = {
  backends: [
    { url: 'https://api.example.com', priority: 1, region: 'us-east', healthy: true },
  ],
  
  websocket: {
    keepAliveInterval: 30000,
    maxConnections: 1000,
    timeout: 60000,
  },
  
  cache: {
    ttl: 300,
    bypassPaths: ['/api/realtime', '/ws'],
  },
  
  rateLimit: {
    enabled: true,
    requestsPerMinute: 100,
    windowMs: 60000,
  },
  
  optimization: {
    connectionPooling: true,
    keepAlive: true,
    compression: true,
    http2: true,
  },
  
  healthCheck: {
    enabled: true,
    interval: 30000,
    timeout: 5000,
  },
};
```

## High-Traffic Configuration

For high-traffic applications with multiple regions:

```javascript
const CONFIG = {
  backends: [
    // US East
    { url: 'https://us-east-api.example.com', priority: 1, region: 'us-east', healthy: true },
    { url: 'https://us-east-api-2.example.com', priority: 2, region: 'us-east', healthy: true },
    
    // US West
    { url: 'https://us-west-api.example.com', priority: 1, region: 'us-west', healthy: true },
    { url: 'https://us-west-api-2.example.com', priority: 2, region: 'us-west', healthy: true },
    
    // Europe
    { url: 'https://eu-west-api.example.com', priority: 1, region: 'eu-west', healthy: true },
    { url: 'https://eu-west-api-2.example.com', priority: 2, region: 'eu-west', healthy: true },
    
    // Asia Pacific
    { url: 'https://ap-east-api.example.com', priority: 1, region: 'ap-east', healthy: true },
  ],
  
  websocket: {
    keepAliveInterval: 20000, // More frequent pings
    maxConnections: 10000,    // Higher connection limit
    timeout: 120000,          // Longer timeout
  },
  
  cache: {
    ttl: 600,                 // 10 minutes
    bypassPaths: ['/api/realtime', '/ws', '/api/live'],
  },
  
  rateLimit: {
    enabled: true,
    requestsPerMinute: 1000,  // Higher limit
    windowMs: 60000,
  },
  
  optimization: {
    connectionPooling: true,
    keepAlive: true,
    compression: true,
    http2: true,
  },
  
  healthCheck: {
    enabled: true,
    interval: 15000,          // More frequent checks
    timeout: 3000,
  },
};
```

## Low-Latency Gaming Configuration

Optimized for gaming and real-time applications:

```javascript
const CONFIG = {
  backends: [
    { url: 'https://game-server-1.example.com', priority: 1, region: 'us-east', healthy: true },
    { url: 'https://game-server-2.example.com', priority: 2, region: 'us-west', healthy: true },
  ],
  
  websocket: {
    keepAliveInterval: 10000,  // Very frequent pings
    maxConnections: 5000,
    timeout: 30000,            // Shorter timeout
  },
  
  cache: {
    ttl: 0,                    // No caching for real-time data
    bypassPaths: ['*'],        // Bypass all paths
  },
  
  rateLimit: {
    enabled: false,            // No rate limiting for gaming
    requestsPerMinute: 10000,
    windowMs: 60000,
  },
  
  optimization: {
    connectionPooling: true,
    keepAlive: true,
    compression: false,        // No compression for minimal latency
    http2: true,
  },
  
  healthCheck: {
    enabled: true,
    interval: 10000,           // Very frequent checks
    timeout: 2000,             // Quick timeout
  },
};
```

## API Gateway Configuration

For use as an API gateway with aggressive caching:

```javascript
const CONFIG = {
  backends: [
    { url: 'https://api.example.com', priority: 1, region: 'us-east', healthy: true },
    { url: 'https://api-backup.example.com', priority: 2, region: 'us-west', healthy: true },
  ],
  
  websocket: {
    keepAliveInterval: 30000,
    maxConnections: 1000,
    timeout: 60000,
  },
  
  cache: {
    ttl: 3600,                 // 1 hour
    bypassPaths: ['/api/auth', '/api/user', '/api/write'],
  },
  
  rateLimit: {
    enabled: true,
    requestsPerMinute: 100,
    windowMs: 60000,
  },
  
  optimization: {
    connectionPooling: true,
    keepAlive: true,
    compression: true,
    http2: true,
  },
  
  healthCheck: {
    enabled: true,
    interval: 30000,
    timeout: 5000,
  },
};
```

## Secure Configuration with Rate Limiting

For public APIs that need DDoS protection:

```javascript
const CONFIG = {
  backends: [
    { url: 'https://protected-api.example.com', priority: 1, region: 'us-east', healthy: true },
  ],
  
  websocket: {
    keepAliveInterval: 30000,
    maxConnections: 100,       // Restricted connections
    timeout: 60000,
  },
  
  cache: {
    ttl: 300,
    bypassPaths: ['/ws'],
  },
  
  rateLimit: {
    enabled: true,
    requestsPerMinute: 10,     // Strict rate limiting
    windowMs: 60000,
  },
  
  optimization: {
    connectionPooling: true,
    keepAlive: true,
    compression: true,
    http2: true,
  },
  
  healthCheck: {
    enabled: true,
    interval: 30000,
    timeout: 5000,
  },
};
```

## Environment-Specific Configuration

You can also use environment variables to configure different settings:

```javascript
const ENV = typeof ENVIRONMENT !== 'undefined' ? ENVIRONMENT : 'production';

const CONFIG = {
  backends: ENV === 'production' 
    ? [
        { url: 'https://prod-api.example.com', priority: 1, region: 'us-east', healthy: true },
      ]
    : [
        { url: 'https://dev-api.example.com', priority: 1, region: 'us-east', healthy: true },
      ],
  
  rateLimit: {
    enabled: ENV === 'production',
    requestsPerMinute: ENV === 'production' ? 100 : 10000,
    windowMs: 60000,
  },
  
  cache: {
    ttl: ENV === 'production' ? 300 : 10,
    bypassPaths: ['/api/realtime', '/ws'],
  },
};
```

## Custom Region Mapping

You can customize the region mapping for better geo-routing:

```javascript
class SmartRouter {
  getRegionFromCountry(country) {
    const regions = {
      // North America
      'US': 'us-east',
      'CA': 'us-east',
      'MX': 'us-west',
      
      // Europe
      'GB': 'eu-west',
      'DE': 'eu-west',
      'FR': 'eu-west',
      'IT': 'eu-west',
      'ES': 'eu-west',
      'NL': 'eu-west',
      'SE': 'eu-north',
      'NO': 'eu-north',
      
      // Asia Pacific
      'JP': 'ap-east',
      'CN': 'ap-east',
      'KR': 'ap-east',
      'SG': 'ap-south',
      'IN': 'ap-south',
      'AU': 'ap-south',
      'NZ': 'ap-south',
      
      // South America
      'BR': 'sa-east',
      'AR': 'sa-east',
      'CL': 'sa-east',
      
      // Middle East
      'AE': 'me-south',
      'SA': 'me-south',
      
      // Africa
      'ZA': 'af-south',
    };
    return regions[country] || 'us-east';
  }
}
```
