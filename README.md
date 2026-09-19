# bubblegumfartjuice.com

Single-page static site. No build step, no dependencies.

## Files

- `index.html` — the whole site, one scrolling page
- `styles.css` — all styling; colors are variables at the top
- `mascot.js` — scroll choreography, farts, sound
- `img/front.png` — mascot facing right (default)
- `img/front-flipped.png` — mascot facing left (used on the return walk)
- `img/back.png` — the butt, used in the Shop section
- `sfx/` — the three fart recordings
- `CNAME` — tells GitHub Pages to serve at bubblegumfartjuice.com

Do NOT upload `preview.html`. That's the phone-preview build with
everything crammed inline.

## Adding a video to Work

Find the block in `index.html` that looks like this:

    <div class="embed-placeholder">YouTube embed goes here</div>

Replace it with:

    <iframe src="https://www.youtube.com/embed/VIDEO_ID"
            title="Video title"
            allowfullscreen loading="lazy"></iframe>

VIDEO_ID is the part after `v=` in a normal YouTube URL. The styling
is already handled. Copy the whole `.video-slot` card for each new one.

## Sound

`medium.mp3` fires while walking. `2for1.mp3` fires when he's clicked.
`shortnsweet.mp3` fires once when you hit the very bottom.

Browsers block audio until the visitor taps something, so the first
few scroll farts are silent. Nothing to fix, that's the rule.

## Deploying to GitHub Pages

1. Upload these files to the ROOT of a public repo (not in a subfolder).
2. Settings → Pages → Deploy from a branch → `main` → `/ (root)`.
3. Settings → Pages → Custom domain → `bubblegumfartjuice.com`.
4. Tick "Enforce HTTPS" once it's available.

## Namecheap DNS

Domain List → Manage → Advanced DNS. Delete the parking records, add:

| Type  | Host | Value                  |
|-------|------|------------------------|
| A     | @    | 185.199.108.153        |
| A     | @    | 185.199.109.153        |
| A     | @    | 185.199.110.153        |
| A     | @    | 185.199.111.153        |
| CNAME | www  | YOURUSERNAME.github.io |
