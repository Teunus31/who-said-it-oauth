# Who Said It — OAuth server

Kleine gehoste server die als enige de Twitch `client_secret` kent. De
gedeelde desktop-app praat hiermee om in te loggen; hij hoeft zelf nooit een
secret te bevatten.

## Deployen op Render.com (gratis)

1. Zet deze map in een eigen GitHub-repository (bijv. `who-said-it-oauth`).
2. Ga naar render.com → New → Web Service → koppel die repository.
3. Instellingen:
   - Build command: `npm install`
   - Start command: `npm start`
4. Onder "Environment", voeg toe:
   - `TWITCH_CLIENT_ID` = jouw Twitch client ID
   - `TWITCH_CLIENT_SECRET` = jouw Twitch client secret
5. Deploy. Je krijgt een URL zoals `https://who-said-it-auth.onrender.com`.

## Twitch Developer Console

Ga naar dev.twitch.tv/console/apps → jouw app → OAuth Redirect URLs, en zet
daar (in plaats van `http://localhost:3000/auth/callback`):

```
https://who-said-it-auth.onrender.com/auth/callback
```

(gebruik je eigen Render-URL).

## De desktop-app koppelen

In `server.js` van de desktop-app staat een constante `OAUTH_SERVER`. Zet die
op jouw Render-URL, bijvoorbeeld:

```js
const OAUTH_SERVER = 'https://who-said-it-auth.onrender.com';
```

Bouw daarna de app opnieuw (`npm run build:win:portable`). Vanaf dan hoeft
niemand die de app deelt nog een `.env` in te vullen — alleen inloggen met
hun eigen Twitch-account.

## Let op: gratis Render-tier

De gratis tier "slaapt" na een tijdje inactiviteit en heeft dan ~30-50
seconden nodig om weer wakker te worden bij de eerste login na een tijdje.
Dat is prima voor dit gebruik (het gebeurt alleen tijdens het inloggen, niet
tijdens het spelen), maar goed om te weten zodat het niet als "kapot"
aanvoelt.
