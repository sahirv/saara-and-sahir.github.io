/* --------------------------------------------------------------
   Event theming + chooser splash.

   Two events share the site: "reception" (default navy + gold) and
   "pithi" (maroon + orange). The chosen event is stored so the theme
   carries across to the seating plan page. Applying a `theme-*` class
   to <body> swaps the CSS custom properties defined in styles.css.
   -------------------------------------------------------------- */
(function () {
  "use strict";

  var STORAGE_KEY = "sns-event";
  var EVENTS = { pithi: "theme-pithi", reception: "theme-reception" };

  function isEvent(event) {
    return Object.prototype.hasOwnProperty.call(EVENTS, event);
  }

  function readStored() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function writeStored(event) {
    try {
      localStorage.setItem(STORAGE_KEY, event);
    } catch (e) {
      /* storage unavailable (e.g. private mode) — theme still applies for
         this page, we simply can't remember it. */
    }
  }

  function applyTheme(event) {
    var body = document.body;
    body.classList.remove("theme-pithi", "theme-reception");
    body.classList.add(isEvent(event) ? EVENTS[event] : EVENTS.reception);
  }

  // Apply any previously chosen theme up front so pages other than the
  // chooser (e.g. the seating plan) render in the right colours.
  var stored = readStored();
  applyTheme(isEvent(stored) ? stored : "reception");

  // Wire up the chooser splash if it's present on this page.
  var splash = document.getElementById("event-splash");
  var lookup = document.getElementById("lookup");
  if (!splash || !lookup) return;

  splash.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-event]");
    if (!btn) return;

    var event = btn.getAttribute("data-event");
    if (!isEvent(event)) event = "reception";

    writeStored(event);
    applyTheme(event);

    splash.hidden = true;
    lookup.hidden = false;

    var input = document.getElementById("name-input");
    if (input) input.focus();
  });
})();
