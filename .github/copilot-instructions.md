# Copilot instructions

## Repository overview

This repo is published as a GitHub Pages site at `https://saara-and-sahir.github.io/`
(user/organization Pages site — the `<user>.github.io` naming convention means the
root of the `main` branch is served directly, with no build step).

**Purpose**: a static seating-lookup site for Saara & Sahir's wedding. A guest
types their name into a text box on the home page and the site tells them which
table they are on. Each table has both a number and a themed name
(e.g. "Table 4 — Orion").

The site covers **two events** that share the same UI:

| Event     | Date (2026) | Theme         |
| --------- | ----------- | ------------- |
| Pithi     | July 24     | maroon + orange |
| Reception | July 25     | navy + gold (default) |

The active event is selected automatically by `theme.js` from the guest's
local date. Outside those two days the Reception theme is used as the default.
A `?event=pithi` or `?event=reception` query parameter overrides the
date-based choice (previewing, sharing an explicit link). There is no
event chooser UI — some guests are only invited to one event, so we don't
present a choice they may not have.

## Layout

Everything lives at the repo root (Pages serves it as-is):

- `index.html` — name lookup form.
- `seating.html` — full seating plan for the active event.
- `theme.js` — picks the event, applies the theme class to `<body>`, sets the
  header text, and exposes `window.SNS = { event, guestsUrl }` for the other
  scripts. Loaded first on every page.
- `app.js` — lookup form behaviour on `index.html`.
- `seating.js` — renders the seating plan on `seating.html`.
- `styles.css` — single stylesheet driven by CSS custom properties; the
  `.theme-pithi` body class swaps the palette. **No** `backdrop-filter`,
  `filter`, or `background-attachment: fixed`, and animations use only
  `opacity` + `transform` so they run on the compositor thread.
- `guests-pithi.json`, `guests-reception.json` — per-event guest data
  (see schema below).

## Data model

Each event has its own JSON file (`guests-<event>.json`) so the two guest
lists can differ. Schema:

```json
{
  "tables": [
    {
      "number": 1,
      "tableName": "Orion",
      "guests": [
        { "name": "Full Name", "aliases": ["Nickname", "Maiden Name"] }
      ]
    }
  ]
}
```

- `tableName` is the table's themed display name (e.g. a constellation for the
  Reception or a hike name for the Pithi); it may be an empty string.
- `aliases` is optional and used only for name matching (not displayed).
- The JSON is fetched client-side, so **anything in it is publicly visible**.
  Keep it to names + table info only — no addresses, phone numbers, dietary
  notes, plus-one drama, etc.
- Table numbers and table names do **not** need to line up between
  the two events; they're independent seating plans.

Scripts always fetch via `window.SNS.guestsUrl` (set by `theme.js`) rather
than hardcoding a filename, so adding future events only requires updating
`theme.js`.

## Working in this repo

- **Preview locally**: `python -m http.server 8000` from the repo root, then
  open `http://localhost:8000/`. Use `?event=pithi` or `?event=reception`
  to preview a specific theme.
- **Deploy**: pushing to `main` publishes via GitHub Pages. There is no
  build step.
- **No test / lint / build tooling** is configured. Don't invent `npm`,
  `make`, or similar commands; if you add tooling, wire it up explicitly
  and document it here.

## Conventions

- Keep asset paths **relative** (e.g. `./styles.css`, not `/styles.css`) so
  the site works both from the Pages URL and when opened as a local file.
- Load `theme.js` **before** `app.js` / `seating.js` on any page that reads
  `window.SNS`.
- **Name matching should be forgiving.** Guests will mistype, use nicknames,
  or enter only a first or last name. Matching is case-insensitive,
  diacritic-stripped, and supports prefix + alias matches; preserve that
  behaviour when editing `app.js`.
- **Fail gracefully on no match.** Point guests at the full seating plan
  rather than showing a blank result or a raw error.
- **Table identity has two parts** (number + table name); show both
  wherever a table is displayed.
- **Animations stay on the compositor**: only animate `opacity` and
  `transform`. Avoid `filter`, `backdrop-filter`, animated
  `background-position`, and `background-attachment: fixed` — earlier
  versions of the site used these and were unusably slow.
