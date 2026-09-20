// Callback OAuth GitHub: scambia il code con il token e lo consegna
// alla finestra dell'admin (protocollo Decap/Sveltia via postMessage).

export default async function handler(req, res) {
  const { code, state } = req.query;
  const cookieState = (req.headers.cookie || '')
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith('oauth_state='))
    ?.slice('oauth_state='.length);

  if (!code || !state || state !== cookieState) {
    res.status(400).send('Stato OAuth non valido: riprova il login da /places/admin');
    return;
  }

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: process.env.OAUTH_GITHUB_CLIENT_ID,
      client_secret: process.env.OAUTH_GITHUB_CLIENT_SECRET,
      code,
    }),
  });
  const data = await tokenRes.json();

  const status = data.access_token ? 'success' : 'error';
  const content = data.access_token
    ? { token: data.access_token, provider: 'github' }
    : { error: data.error_description || data.error || 'token mancante' };
  const payload = `authorization:github:${status}:${JSON.stringify(content)}`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Set-Cookie', 'oauth_state=; Path=/; Max-Age=0');
  res.send(`<!doctype html>
<html>
  <body>
    <p>Accesso completato, puoi chiudere questa finestra.</p>
    <script>
      (function () {
        var payload = ${JSON.stringify(payload)};
        function receiveMessage(e) {
          window.opener.postMessage(payload, e.origin);
          window.removeEventListener('message', receiveMessage);
        }
        window.addEventListener('message', receiveMessage, false);
        window.opener.postMessage('authorizing:github', '*');
      })();
    </script>
  </body>
</html>`);
}
