# Quick Start Guide

Get your Ping Booster Worker up and running in 5 minutes!

## 1. Prerequisites

- Node.js 16+ installed
- A Cloudflare account (free tier works!)
- At least one backend API to proxy

## 2. Installation (2 minutes)

```bash
# Clone the repository
git clone https://github.com/1744132917/The-most-advanced-ping-booster-cloudflare-worker.git
cd The-most-advanced-ping-booster-cloudflare-worker

# Install dependencies
npm install

# Login to Cloudflare
npx wrangler login
```

## 3. Configuration (1 minute)

Edit `worker.js` and update the backend URL (line 18):

```javascript
const CONFIG = {
  backends: [
    { url: 'https://your-api.example.com', priority: 1, region: 'us-east', healthy: true },
  ],
  // ... rest stays the same
```

## 4. Test Locally (1 minute)

```bash
# Start development server
npm run dev
```

In another terminal:

```bash
# Test health endpoint
curl http://localhost:8787/health

# Test your API through the worker
curl http://localhost:8787/your-api-path
```

You should see response headers showing cache status, latency, and backend info!

## 5. Deploy (1 minute)

```bash
# Deploy to Cloudflare
npm run deploy
```

Your worker is now live at: `https://ping-booster-worker.your-subdomain.workers.dev`

## What You Get

✅ **Automatic Caching**: Responses are cached for 5 minutes by default  
✅ **Rate Limiting**: 100 requests per minute per IP  
✅ **Health Checks**: Automatic backend monitoring  
✅ **Smart Routing**: Geo-aware backend selection  
✅ **WebSocket Support**: Real-time connections at `/ws`  
✅ **Metrics**: Monitor performance at `/metrics`

## Next Steps

### Customize Settings

See [CONFIGURATION.md](CONFIGURATION.md) for detailed configuration options:
- Adjust cache TTL
- Change rate limits
- Add multiple backends
- Configure regions

### Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for:
- Custom domain setup
- Environment configuration
- Monitoring setup
- Security best practices

### Use WebSockets

```javascript
const ws = new WebSocket('wss://your-worker.workers.dev/ws');
ws.onopen = () => console.log('Connected!');
ws.onmessage = (e) => console.log('Received:', JSON.parse(e.data));
```

### Monitor Performance

```bash
# Check health
curl https://your-worker.workers.dev/health

# View metrics
curl https://your-worker.workers.dev/metrics
```

## Common Configurations

### High Traffic API

```javascript
cache: { ttl: 600 },  // 10 minute cache
rateLimit: { requestsPerMinute: 1000 },  // Higher limit
```

### Real-time Application

```javascript
cache: { ttl: 0, bypassPaths: ['*'] },  // No caching
rateLimit: { enabled: false },  // No rate limiting
```

### Multiple Regions

```javascript
backends: [
  { url: 'https://us-api.example.com', priority: 1, region: 'us-east' },
  { url: 'https://eu-api.example.com', priority: 1, region: 'eu-west' },
  { url: 'https://ap-api.example.com', priority: 1, region: 'ap-east' },
],
```

## Troubleshooting

**Worker not starting?**
```bash
npx wrangler tail  # View logs
```

**Backend not reachable?**
- Check the backend URL is correct
- Verify CORS settings on backend
- Test with: `curl https://your-worker.workers.dev/health`

**Rate limited?**
- Adjust `CONFIG.rateLimit.requestsPerMinute` in worker.js

## Performance Tips

1. **Enable Caching**: Set appropriate TTL for your use case
2. **Add Multiple Backends**: Improve reliability and reduce latency
3. **Use Regional Routing**: Deploy backends in multiple regions
4. **Monitor Metrics**: Check `/metrics` regularly

## Getting Help

- 📖 [Full Documentation](README.md)
- ⚙️ [Configuration Guide](CONFIGURATION.md)
- 🚀 [Deployment Guide](DEPLOYMENT.md)
- 💻 [Code Examples](examples.js)
- 🐛 [Open an Issue](https://github.com/1744132917/The-most-advanced-ping-booster-cloudflare-worker/issues)

## Architecture Overview

```
Client → Cloudflare Edge → Ping Booster Worker → Your Backend API
           ↓
       [Cache, Rate Limit, Route, Optimize]
```

The worker runs on Cloudflare's global edge network, closer to your users than your backend, reducing latency significantly!

## Benchmarks

Typical improvements with Ping Booster Worker:
- **Cache Hit**: ~10-50ms response time
- **Cache Miss**: ~100-300ms (depends on backend)
- **Without Worker**: ~200-500ms (direct to backend)

**Result**: Up to 90% latency reduction with caching!

---

**You're all set! 🚀**

Your API is now faster, more reliable, and protected. Enjoy the boost!
