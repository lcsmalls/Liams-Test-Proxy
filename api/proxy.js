// api/proxy.js
export default async function handler(req, res) {
  const WHITELIST = {
    'compendium': 'https://compendiumofeverything.org',
    'example': 'https://example.com',
    'cdn': 'https://cdn.compendiumofeverything.org',
    'youtube': 'https://www.youtube.com/embed/'  // only embeds
  };

  const key = req.query.url;
  if (!key || !WHITELIST[key]) {
    return res.status(400).json({ error: 'Invalid or missing URL key' });
  }

  const path = req.query.path || '';

  // Special rule for YouTube: only allow simple video IDs
  if (key === 'youtube') {
    if (!path.match(/^[\w-]+$/)) {
      return res.status(400).json({ error: 'Invalid YouTube video ID' });
    }
    const embedUrl = WHITELIST[key] + path;
    // Redirect iframe directly to the embed URL
    res.redirect(embedUrl);
    return;
  }

  const targetUrl = WHITELIST[key] + path;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
        'Accept': '*/*'
      }
    });

    let body = await response.text();
    const contentType = response.headers.get('content-type') || '';

    // Rewrite CDN URLs to go through proxy
    if (contentType.includes('text/html')) {
      body = body.replace(
        /https:\/\/cdn\.compendiumofeverything\.org(\/[^\s'"]*)/g,
        '/api/proxy?url=cdn&path=$1'
      );
    }

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
