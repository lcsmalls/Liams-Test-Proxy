// api/proxy.js
// import fetch from 'node-fetch';  ← remove this line

const WHITELIST = {
  'compendium': 'https://compendiumofeverything.org',
  'example': 'https://example.com'
  'testersite': 'https://pornhub.com'
};

export default async function handler(req, res) {
  const key = req.query.url;
  if (!key || !WHITELIST[key]) {
    return res.status(400).json({ error: 'Invalid or missing URL key' });
  }

  const targetUrl = WHITELIST[key];

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
        'Accept': 'text/html,*/*'
      }
    });

    let body = await response.text();

    res.setHeader('X-Frame-Options', '');
    res.setHeader('Content-Security-Policy', ""); 
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');

    res.status(200).send(body);

  } catch (err) {
    console.error('Proxy fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch site', detail: String(err) });
  }
}
