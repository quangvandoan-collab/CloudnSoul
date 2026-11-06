# Putting the Cloud Temple and Church on Render

`site` holds the website. `server.js` serves it and passes live messages between visitors,
so people can see each other, chat, and share wishes, incense, the bell and koi feeding.
Nothing is written to disk: messages are forgotten as soon as they are passed on.

## Render settings (Web Service)
- Language: Node
- Branch: main
- Build Command: echo done
- Start Command: node server.js
- Instance Type: Free

## Updating
After any change in `public`, run `python3 scripts/build-site.py`, copy the new `site` folder
and `server.js` into the GitHub folder, then commit and push. Render redeploys by itself.

## Good to know
- On the free plan the service sleeps after 15 minutes without visitors; the next visitor waits about a minute.
- Chat is open to anyone. Public messages are checked for links, phone numbers and money words,
  and each visitor can post only a few messages a minute. Check Vietnam's Decree 147/2024 rules.
