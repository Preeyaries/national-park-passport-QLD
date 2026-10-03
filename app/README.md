# QLD Parks Passport

A clickable prototype of a national parks passport for Queensland, Australia.
Check in to a park with a date and a photo, collect its stamp, and unlock secret stamps.

## Run it

No build step and no dependencies.

- Quick way: double-click `index.html` to open it in a browser.
- Local server (recommended): run `python -m http.server 8000` in this folder, then open http://localhost:8000
- VS Code: right-click `index.html` and choose "Open with Live Server".

## Files

| File | What it holds |
| --- | --- |
| `index.html` | Page structure |
| `css/styles.css` | Design tokens (light and dark theme) and all styles |
| `js/data.js` | Regions, parks, activities, sample events, secret stamp rules |
| `js/app.js` | State, rendering, check-in form, stamp drawing, secret stamp checks |

## How secret stamps work

Each park in `js/data.js` can carry a `secret` object:

- `m: [7,8,9,10]` unlocks when the visit month is in the list (seasonal stamp)
- `a: 0` unlocks when the activity at that index is ticked at check-in

Collection stamps (first stamp, five parks, full region page) live in `GLOBAL_SECRETS`.

## Known limits

- Nearby events are sample listings, not real events.
- Park names and activities were written from general knowledge. Check them against the Queensland Parks website before real use.
- No GPS check yet, so a visit is not verified.
- Stamps and photos are saved in `localStorage` in one browser only. There are no accounts and no sync.

## Next steps

1. Add a backend (for example Node.js with Express and MongoDB) for accounts and synced visits.
2. Verify visits with GPS or photo EXIF location against park boundaries (CAPAD dataset).
3. Queue check-ins offline and sync later, because many parks have no signal.
4. Replace sample events with real listings.
5. Add New South Wales, Victoria and the other states.

## Booklet layout

- Front pages: a stamp index with every park, six slots per page.
- Park pages: each park has its own two pages. The left page shows the park picture and name. The right page is the visit record with the stamp, date, your photo, who you went with and your memories.

## Park photos

By default the app loads each park's lead photo from its English Wikipedia article when the page opens (`USE_WIKIPEDIA_PHOTOS = true` in `js/data.js`).

- Needs an internet connection. The result is cached in `localStorage`, so later visits are instant.
- The author and licence are shown under each photo with a link to the source. Keep that credit line. Most of these photos are Creative Commons and require attribution.
- A park whose article has no photo keeps the drawn placeholder.
- If an article title is wrong for a park, fix it in the `WIKI` map in `js/data.js`.

To use your own picture for a park, put the file in the `images` folder and map it. Your own entry always wins over Wikipedia:

```js
const PHOTOS = { lamington: 'images/lamington.jpg', noosa: 'images/noosa.jpg' };
```

## Accounts, tagging and the public feed (demo)

- **Sign in or sign up** with an email and a username. An email that already has an account signs in. A new email creates an account and moves the current stamps into it.
- **Tag friends** in the "Who did you go with?" field with `@username`. Each tagged friend gets the same park stamp in their own passport, marked "Stamp shared by @you".
- **Public or private** is chosen per visit with the "Share this visit on the public feed" tick box. The default is private.
- **Community tab** lists public posts. Tap a username to see only that person's posts.
- Two demo accounts are included: `@mali` and `@tomq`.

This is a front-end demo. Accounts live in `localStorage`, there is no password and nothing is sent to a server. A real version needs a backend with email verification, a users table, a visits table with a `public` flag, and a tags table.
