/* --------------------------------------------------------------
   Event theming.

   The site serves two events that share the same lookup UI:
     - Pithi     — July 24, 2026 (maroon + orange)
     - Reception — July 25, 2026 (navy + gold, default)

   The event is chosen automatically from the guest's local date so
   guests aren't asked which event they're attending (some are only
   invited to one). Outside those two days we fall back to the default
   Reception theme.

   A `?event=pithi` or `?event=reception` query parameter overrides the
   date-based choice — useful for previewing and for sharing an explicit
   link. The override is applied on this page load only; it is not
   persisted so a returning guest on the actual event day still sees
   the correct theme.
   -------------------------------------------------------------- */
(function () {
  "use strict";

  var EVENTS = {
    pithi:     { className: "theme-pithi",     label: "Pithi",     date: "July 24" },
    reception: { className: "theme-reception", label: "Reception", date: "July 25" }
  };

  // Wedding dates (local time). Update if the schedule changes.
  var PITHI     = { year: 2026, month: 7, day: 24 };
  var RECEPTION = { year: 2026, month: 7, day: 25 };

  function isEvent(name) {
    return Object.prototype.hasOwnProperty.call(EVENTS, name);
  }

  function eventFromQuery() {
    try {
      var params = new URLSearchParams(window.location.search);
      var v = params.get("event");
      return isEvent(v) ? v : null;
    } catch (e) {
      return null;
    }
  }

  function eventFromDate(now) {
    var y = now.getFullYear();
    var m = now.getMonth() + 1; // 1-12
    var d = now.getDate();
    if (y === PITHI.year     && m === PITHI.month     && d === PITHI.day)     return "pithi";
    if (y === RECEPTION.year && m === RECEPTION.month && d === RECEPTION.day) return "reception";
    return null;
  }

  function applyTheme(name) {
    var body = document.body;
    body.classList.remove("theme-pithi", "theme-reception");
    body.classList.add(EVENTS[name].className);
    body.setAttribute("data-event", name);
  }

  function updateHeader(name) {
    var titleEl = document.getElementById("event-title");
    var subEl = document.getElementById("event-subtitle");
    if (!titleEl) return;

    if (subEl) {
      // Lookup page.
      titleEl.textContent = EVENTS[name].label + " \u2014 find your table";
      subEl.textContent =
        "Enter your name below to find your seat for the " +
        EVENTS[name].label + " on " + EVENTS[name].date + ".";
    } else {
      // Seating plan page (no subtitle slot).
      titleEl.textContent = EVENTS[name].label + " seating plan";
    }
  }

  var chosen = eventFromQuery() || eventFromDate(new Date()) || "reception";
  applyTheme(chosen);
  updateHeader(chosen);

  // Exposed so app.js / seating.js can fetch the right per-event data
  // without duplicating the selection logic.
  window.SNS = {
    event: chosen,
    guestsUrl: "./guests-" + chosen + ".json"
  };
})();
