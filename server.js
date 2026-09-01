import 'dotenv/config';
import express from 'express';
import crypto from 'crypto';

const app = express();
app.set('trust proxy', 1);
const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
const sessions = new Map(); // state -> { localPort, created }

function redirectUri(req) {
  return `${req.protocol}://${req.get('host')}/auth/callback`;
}

// Opgeroepen door de lokale app: begint de Twitch-login.
app.get('/auth/start', (req, res) => {
  const localPort = String(req.query.local_port || '3000');
  if (!CLIENT_ID || !CLIENT_SECRET) return res.status(500).send('Server niet geconfigureerd (TWITCH_CLIENT_ID/SECRET ontbreken).');

  const state = crypto.randomBytes(24).toString('hex');
  sessions.set(state, { localPort, created: Date.now() });

  const p = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: redirectUri(req),
    response_type: 'code',
    scope: 'user:read:chat',
    state,
  });
  res.redirect(`https://id.twitch.tv/oauth2/authorize?${p}`);
});

// Twitch stuurt de gebruiker hierheen terug na het inloggen.
app.get('/auth/callback', async (req, res) => {
  const { code, state } = req.query;
  const s = sessions.get(state);
  if (!s) return res.status(400).send('Ongeldige of verlopen sessie. Probeer opnieuw vanuit de app.');
  sessions.delete(state);

  try {
    const tr = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri(req),
      }),
    });
    const tok = await tr.json();
    if (!tr.ok) throw new Error(tok.message || 'OAuth mislukt');

    // Geef alleen het access token terug aan de lokale app op de gebruikers-pc.
    // Het CLIENT_SECRET verlaat deze server nooit.
    const p = new URLSearchParams({ token: tok.access_token });
    res.send(`<!doctype html><meta charset="utf-8"><title>Ingelogd</title>
      <body style="font-family:sans-serif;text-align:center;padding-top:4rem">
        <p>Ingelogd! De app gaat automatisch verder…</p>
        <p><small>Sluit dit venster als er niets gebeurt binnen een paar seconden.</small></p>
        <script>location.href='http://localhost:${s.localPort}/oauth/receive?${p.toString()}'</script>
      </body>`);
  } catch (e) {
    res.status(400).send(`<h1>Fout</h1><p>${String(e.message)}</p>`);
  }
});

app.get('/', (req, res) => res.send('Who Said It — OAuth server draait.'));

// Opruimen van oude, niet-afgemaakte logins.
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of sessions) if (now - v.created > 10 * 60 * 1000) sessions.delete(k);
}, 60000);

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`OAuth server luistert op poort ${PORT}`));
