# Balance

A free balance scale game for young kids that works offline. One side of the scale holds some weights, and the child puts weights on the other side until both sides are level. It starts with counting cubes and grows into simple sums, without writing a single number down.

Made for ages 5 and up. There is no timer and no way to lose. Undo takes back the last move, and Start over takes all the weights off.

## Demo

Check out the live demo at: https://mardesnic.github.io/des-balance/

On your phone, open it and choose **Add to Home Screen** (Safari) or **Install app** (Chrome). It then opens like an app and works offline.

## Features

- Four levels, from Very easy to Hard
- Picks up where you left off after a reload
- Keeps the screen on while you play
- In English and Croatian, following the phone's language unless you pick one
- Light and dark mode
- No ads, accounts or tracking

## Development

```bash
npm install
npm run dev        # local dev server
npm test           # game and translation tests
npm run build      # production build in dist/
```

`npm run deploy` builds the app and publishes it to GitHub Pages.
