# Balance

A free balance scale game for young kids that works offline. One side of the scale holds something, and the child puts fruit from the shelf on the other side until both sides are level. It starts with counting strawberries and grows into simple sums, without writing a single number down.

Made for ages 5 and up. There is no timer and no way to lose. Undo takes back the last move, and Start over takes all the fruit off.

## Demo

Check out the live demo at: https://mardesnic.github.io/des-balance/

On your phone, open it and choose **Add to Home Screen** (Safari) or **Install app** (Chrome). It then opens like an app and works offline.

## Features

- Four levels:
  - **Very easy**: only strawberries, so put as many as there are on the left
  - **Easy**: strawberries and apples, and an apple weighs as much as two strawberries (shown with dots)
  - **Medium**: a vegetable with its weight on it, and five fruit to pick the right ones from
  - **Hard**: heavier vegetables, and often some fruit must go next to the vegetable to make it work
- Each fruit always weighs the same: strawberry 1, apple 2, pear 3, pineapple 5, watermelon 10. Heavier fruit and vegetables are drawn bigger, in about the right sizes
- Drag a fruit onto either side, from one side to the other, or off the scale back to the shelf
- The scale tips as soon as one side is heavier, even by one strawberry
- Every round can be solved with the fruit on the shelf, and no single fruit is the whole answer
- A count of rounds solved at each level
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
