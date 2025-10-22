// api/proxy.js
export default async function handler(req, res) {
  const WHITELIST = {
    'compendium': 'https://compendiumofeverything.org',
    'example': 'https://example.com',
    'cdn': 'https://cdn.compendiumofeverything.org',
    'youtube': 'https://www.youtube.com/embed/', // YouTube embed
    'pornhubA': 'https://www.pornhub.com/embed/', // Option A
    'pornhubB': 'https://www.pornhub.com/embed/view_video.php?viewkey=' // Option B
  };

  const key = req.query.url;
  if (!key || !WHITELIST[key]) {
    return res.status(400).json({ error: 'Invalid or missing URL key' });
  }

  const path = (req.query.path || '').trim();

  // YouTube embed
  if (key === 'youtube') {
    if (!/^[\w-]+$/.test(path)) {
      return res.status(400).json({ error: 'Invalid YouTube video ID' });
    }
    res.redirect(WHITELIST[key] + path);
    return;
  }

  // Pornhub Option A
  if (key === 'pornhubA') {
    if (!/^[A-Za-z0-9_-]+$/.test(path)) {
      return res.status(400).json({ error: 'Invalid Pornhub viewkey' });
    }
    res.redirect(WHITELIST[key] + path);
    return;
  }

  // Pornhub Option B
  if (key === 'pornhubB') {
    if (!/^[A-Za-z0-9_-]+$/.test(path)) {
      return res.status(400).json({ error: 'Invalid Pornhub viewkey' });
    }
    res.redirect(WHITELIST[key] + encodeURIComponent(path));
    return;
  }

  // Normal proxy for HTML/CDN
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
