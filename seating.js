(function () {
  "use strict";

  const planEl = document.getElementById("seating-plan");
  const statusEl = document.getElementById("seating-status");

  fetch("./guests.json", { cache: "no-cache" })
    .then((r) => {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then(render)
    .catch((err) => {
      console.error(err);
      statusEl.innerHTML =
        '<div class="not-found">' +
        "Something went wrong loading the seating plan. Please refresh and try again." +
        "</div>";
    });

  // Compare guest names by last token (last name), then full name — so a table
  // reads alphabetically the way most seating charts do.
  function compareGuests(a, b) {
    const la = lastWord(a);
    const lb = lastWord(b);
    if (la !== lb) return la.localeCompare(lb);
    return a.localeCompare(b);
  }
  function lastWord(s) {
    const parts = String(s).trim().split(/\s+/);
    return (parts[parts.length - 1] || "").toLowerCase();
  }

  function render(data) {
    const tables = (data.tables || []).slice().sort((a, b) => {
      // Sort by table number when numeric, otherwise by constellation name.
      const an = typeof a.number === "number" ? a.number : Infinity;
      const bn = typeof b.number === "number" ? b.number : Infinity;
      if (an !== bn) return an - bn;
      return String(a.constellation).localeCompare(String(b.constellation));
    });

    planEl.innerHTML = "";

    if (tables.length === 0) {
      statusEl.innerHTML =
        '<div class="not-found">No tables have been published yet.</div>';
      return;
    }

    for (const table of tables) {
      const card = document.createElement("section");
      card.className = "table-card";

      const h = document.createElement("h2");
      h.className = "table-card__heading";
      const num = document.createElement("span");
      num.className = "table-number";
      num.textContent = "Table " + table.number;
      const sep = document.createTextNode(" — ");
      const con = document.createElement("span");
      con.className = "constellation";
      con.textContent = table.constellation;
      h.appendChild(num);
      h.appendChild(sep);
      h.appendChild(con);
      card.appendChild(h);

      const guests = (table.guests || [])
        .map((g) => g.name)
        .sort(compareGuests);

      if (guests.length === 0) {
        const empty = document.createElement("p");
        empty.className = "guest-name";
        empty.textContent = "(no guests listed)";
        card.appendChild(empty);
      } else {
        const ul = document.createElement("ul");
        ul.className = "guest-list";
        for (const name of guests) {
          const li = document.createElement("li");
          li.textContent = name;
          ul.appendChild(li);
        }
        card.appendChild(ul);
      }

      planEl.appendChild(card);
    }
  }
})();
