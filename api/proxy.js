// api/proxy.js
export default async function handler(req, res) {
  const WHITELIST = {
    'compendium': 'https://compendiumofeverything.org',
    'example': 'https://example.com',
    'cdn': 'https://cdn.compendiumofeverything.org'
  };

  const key = req.query.url;
  if (!key || !WHITELIST[key]) {
    return res.status(400).json({ error: 'Invalid or missing URL key' });
  }

  const path = req.query.path || '';
  const targetUrl = WHITELIST[key] + path;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
        'Accept': '*/*'
      }
    });

    let body = await response.text();

    // Only rewrite URLs for HTML content
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      // Rewrite all URLs pointing to your CDN so they go through the proxy
      body = body.replace(
        /https:\/\/cdn\.compendiumofeverything\.org(\/[^\s'"]*)/g,
        '/api/proxy?url=cdn&path=$1'
      );
    }

    // Strip headers that block embedding
    res.setHeader('X-Frame-Options', '');
    res.setHeader('Content-Security-Policy', '');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'no-store');

    res.status(200).send(body);

  } catch (err) {
    console.error('Proxy fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch site', detail: String(err) });
  }
}
