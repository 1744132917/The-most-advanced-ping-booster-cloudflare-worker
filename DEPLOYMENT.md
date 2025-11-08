# Deployment Guide

This guide will walk you through deploying the Ping Booster Cloudflare Worker to production.

## Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Node.js**: Version 16 or higher
3. **Wrangler CLI**: Cloudflare Workers CLI tool
4. **Backend API**: At least one backend server to proxy requests to

## Step 1: Install Dependencies

```bash
npm install
```

This will install Wrangler and other development dependencies.

## Step 2: Authenticate with Cloudflare

```bash
npx wrangler login
```

This will open a browser window for you to authenticate with your Cloudflare account.

Alternatively, you can use an API token:

```bash
export CLOUDFLARE_API_TOKEN=your-api-token
```

## Step 3: Configure Your Worker

### 3.1 Update wrangler.toml

Edit `wrangler.toml` and update the following fields:

```toml
name = "your-worker-name"
route = "your-domain.com/*"  # Optional: if you want to use a custom domain
zone_id = "your-zone-id"     # Optional: required if using a custom domain
```

To find your zone ID:
1. Go to the Cloudflare dashboard
2. Select your domain
3. Find the Zone ID in the right sidebar (Overview section)

### 3.2 Configure Backends

Edit `worker.js` and update the `CONFIG.backends` array:

```javascript
const CONFIG = {
  backends: [
    { 
      url: 'https://your-api.example.com',
      priority: 1,
      region: 'us-east',
      healthy: true
    },
    { 
      url: 'https://your-backup-api.example.com',
      priority: 2,
      region: 'us-west',
      healthy: true
    },
  ],
  // ... rest of config
};
```

### 3.3 Adjust Rate Limits

Update rate limiting settings based on your expected traffic:

```javascript
rateLimit: {
  enabled: true,
  requestsPerMinute: 100,  // Adjust based on your needs
  windowMs: 60000,
},
```

### 3.4 Configure Caching

Set cache TTL and bypass paths:

```javascript
cache: {
  ttl: 300,  // 5 minutes in seconds
  bypassPaths: ['/api/realtime', '/ws'],  // Paths to never cache
},
```

## Step 4: Test Locally

Before deploying to production, test your worker locally:

```bash
npm run dev
```

This will start a local development server at `http://localhost:8787`

Test the endpoints:

```bash
# Test health check
curl http://localhost:8787/health

# Test API proxy
curl http://localhost:8787/api/your-endpoint

# Test WebSocket (use wscat or a WebSocket client)
wscat -c ws://localhost:8787/ws
```

## Step 5: Deploy to Development

Deploy to a development environment first:

```bash
npm run deploy:staging
```

Or deploy directly:

```bash
npx wrangler deploy --env development
```

Your worker will be available at:
- `https://your-worker-name-dev.your-subdomain.workers.dev`

Test the deployed worker:

```bash
curl https://your-worker-name-dev.your-subdomain.workers.dev/health
```

## Step 6: Deploy to Production

Once you've verified everything works in development:

```bash
npm run deploy:production
```

Or:

```bash
npx wrangler deploy --env production
```

## Step 7: Configure Custom Domain (Optional)

To use a custom domain:

### 7.1 Add Route to wrangler.toml

```toml
[env.production]
name = "ping-booster-worker"
route = "api.yourdomain.com/*"
zone_id = "your-zone-id"
```

### 7.2 Deploy with Routes

```bash
npx wrangler deploy --env production
```

### 7.3 Verify DNS

Ensure your domain is configured in Cloudflare:
1. Go to Cloudflare dashboard
2. Select your domain
3. Go to DNS settings
4. Ensure there's a record for your subdomain (e.g., `api`)

## Step 8: Set Up Monitoring

### 8.1 Enable Cloudflare Analytics

In the Cloudflare dashboard:
1. Go to Workers & Pages
2. Select your worker
3. View the Metrics tab

### 8.2 Monitor with Built-in Endpoints

Use the health and metrics endpoints:

```bash
# Check health
curl https://api.yourdomain.com/health

# View metrics
curl https://api.yourdomain.com/metrics
```

### 8.3 Set Up Alerts

In Cloudflare dashboard:
1. Go to Notifications
2. Add Worker alert policies
3. Configure thresholds for:
   - Error rates
   - CPU time
   - Request volume

## Step 9: Configure Secrets (Optional)

If you need to store sensitive data like API keys:

```bash
# Set a secret
npx wrangler secret put API_KEY

# List secrets
npx wrangler secret list
```

Access secrets in your worker:

```javascript
export default {
  async fetch(request, env, ctx) {
    const apiKey = env.API_KEY;
    // Use the API key
  }
}
```

## Step 10: Set Up Cron Triggers

The worker includes health check cron triggers. Verify they're configured:

```toml
[triggers]
crons = ["*/5 * * * *"]  # Every 5 minutes
```

View cron execution in the dashboard:
1. Go to Workers & Pages
2. Select your worker
3. View the Logs tab
4. Filter by "scheduled" events

## Troubleshooting

### Worker Not Starting

Check the logs:
```bash
npx wrangler tail
```

### Backend Connection Issues

1. Verify backend URLs are accessible from Cloudflare edge
2. Check CORS settings on backend
3. Verify SSL certificates are valid

### Rate Limiting Issues

Adjust rate limits in `CONFIG.rateLimit`:
```javascript
rateLimit: {
  enabled: true,
  requestsPerMinute: 1000,  // Increase limit
  windowMs: 60000,
}
```

### Cache Not Working

1. Verify cache is enabled for the request method (only GET requests are cached by default)
2. Check if the path is in `bypassPaths`
3. Verify cache headers in response

### High Latency

1. Check backend health via `/health` endpoint
2. Add more regional backends
3. Increase connection pooling
4. Enable HTTP/2

## Performance Optimization

### 1. Add More Regional Backends

```javascript
backends: [
  { url: 'https://us-api.example.com', priority: 1, region: 'us-east', healthy: true },
  { url: 'https://eu-api.example.com', priority: 1, region: 'eu-west', healthy: true },
  { url: 'https://ap-api.example.com', priority: 1, region: 'ap-east', healthy: true },
]
```

### 2. Optimize Caching

```javascript
cache: {
  ttl: 600,  // Increase to 10 minutes for static content
  bypassPaths: ['/api/auth', '/api/write'],  // Only bypass dynamic paths
}
```

### 3. Enable All Optimizations

```javascript
optimization: {
  connectionPooling: true,
  keepAlive: true,
  compression: true,
  http2: true,
}
```

### 4. Monitor and Adjust

Use the `/metrics` endpoint to monitor:
- Cache hit rate
- Request latency
- Backend health

## Scaling

Cloudflare Workers automatically scale based on demand. However, consider:

1. **Backend Capacity**: Ensure your backends can handle the traffic
2. **Rate Limits**: Adjust based on your backend capacity
3. **Connection Pooling**: Enable for better performance
4. **Regional Backends**: Add more regions as you grow

## Security Best Practices

1. **Use HTTPS**: Always use HTTPS for backend URLs
2. **Rate Limiting**: Keep rate limiting enabled in production
3. **Secrets Management**: Use Wrangler secrets for sensitive data
4. **CORS**: Configure CORS headers appropriately
5. **Authentication**: Add authentication for protected endpoints

## Rollback

If you need to rollback a deployment:

```bash
# View deployment history
npx wrangler deployments list

# Rollback to a specific deployment
npx wrangler rollback [deployment-id]
```

## Production Checklist

Before deploying to production, ensure:

- [ ] Backend URLs are configured correctly
- [ ] Rate limits are appropriate for your traffic
- [ ] Cache settings are optimized
- [ ] Health check endpoints are working on backends
- [ ] Secrets are configured (if needed)
- [ ] Monitoring and alerts are set up
- [ ] Custom domain is configured (if needed)
- [ ] Testing is complete in staging environment
- [ ] Documentation is updated with your specific configuration

## Support

For issues or questions:
- Check the [README.md](README.md) for usage information
- Review [CONFIGURATION.md](CONFIGURATION.md) for configuration examples
- Check Cloudflare Workers documentation
- Open an issue on GitHub

## Next Steps

After deployment:
1. Monitor the `/health` endpoint regularly
2. Check the `/metrics` endpoint for performance data
3. Review Cloudflare dashboard for analytics
4. Set up alerts for critical issues
5. Optimize based on real-world usage patterns
