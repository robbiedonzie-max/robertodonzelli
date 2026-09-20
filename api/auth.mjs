// Avvio del flusso OAuth GitHub per il pannello admin (/places/admin).
// Richiede le env var OAUTH_GITHUB_CLIENT_ID e OAUTH_GITHUB_CLIENT_SECRET su Vercel.
import crypto from 'node:crypto';

export default function handler(req, res) {
  const clientId = process.env.OAUTH_GITHUB_CLIENT_ID;
  if (!clientId) {
    res.status(500).send('OAUTH_GITHUB_CLIENT_ID non configurato su Vercel');
    return;
  }
  const state = crypto.randomBytes(16).toString('hex');
  const redirectUri = `https://${req.headers.host}/api/callback`;
  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', 'repo');
  url.searchParams.set('state', state);

  res.setHeader('Set-Cookie', `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
  res.redirect(302, url.toString());
}
