# Copilot instructions

## Repository overview

This repo is published as a GitHub Pages site at `https://saara-and-sahir.github.io/`
(user/organization Pages site — the `<user>.github.io` naming convention means the
root of the `main` branch is served directly, with no build step).

**Purpose**: a static seating-lookup site for Saara & Sahir's wedding. A guest
types their name into a text box on the home page and the site tells them which
table they are on. Each table has both a number and a constellation name
(e.g. "Table 4 — Orion").

**Data model**: attendee → table assignments live in a JSON file committed to
the repo (planned; not yet present). The lookup runs entirely client-side —
the JSON is fetched by the browser, so **anything in that file is publicly
visible**. Do not put anything sensitive (addresses, phone numbers, dietary
notes, plus-one drama, etc.) in it; keep it to the minimum needed for lookup
(guest name(s) and table identifier).

As of this writing the site is a placeholder: a single `index.html` at the repo
root that renders "Hello World". There is no framework, no bundler, no package
manager, no tests, and no CI configuration. Treat any new file added at the
repo root as immediately publicly served.

## Working in this repo

- **Preview locally**: open `index.html` directly in a browser, or run a static
  server from the repo root (e.g. `python -m http.server 8000`) and visit
  `http://localhost:8000/`. There is no dev server script.
- **Deploy**: pushing to the default branch publishes the site via GitHub Pages.
  There is no build step — files are served as-is from the repo root.
- **No test / lint / build tooling** is configured. Do not invent `npm`, `make`,
  or similar commands; if you add tooling, wire it up explicitly and document
  it here.

## Conventions

- Keep asset paths **relative** (e.g. `./styles.css`, not `/styles.css`) so the
  site works both from the Pages URL and when opened as a local file.
- The `<title>` currently says "Hello World"; update it when the real content
  lands.
- **Name matching should be forgiving.** Guests will mistype, use nicknames,
  or enter only a first or last name. Prefer case-insensitive, whitespace- and
  diacritic-normalized matching, and consider supporting nickname/alias lists
  in the JSON so a single seat can be found by multiple inputs.
- **Fail gracefully on no match.** Show a friendly "we couldn't find that name
  — please check with us" message rather than a blank result or an error.
- **Table identity has two parts** (number + constellation name); show both
  wherever a table is displayed so guests can find it by either.

## When scaling this up

If/when this grows beyond a single page, prefer either:
1. Staying static (plain HTML/CSS/JS, optionally with a small static-site
   generator whose output is committed or built in a GitHub Action), or
2. Moving the source into a subdirectory and using a GitHub Actions workflow
   to publish the built output to Pages.

Either way, update this file so future sessions know the new layout and
commands.
