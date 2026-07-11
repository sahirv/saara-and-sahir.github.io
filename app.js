(function () {
  "use strict";

  const form = document.getElementById("lookup-form");
  const input = document.getElementById("name-input");
  const resultEl = document.getElementById("result");
  const submitBtn = form.querySelector("button[type='submit']");

  let guestIndex = null; // built lazily on first submit
  let dataPromise = null;

  function normalize(str) {
    return String(str || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // strip diacritics
      .toLowerCase()
      .replace(/[^a-z0-9\s'-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function tokens(str) {
    const n = normalize(str);
    return n ? n.split(" ") : [];
  }

  function loadData() {
    if (!dataPromise) {
      dataPromise = fetch(window.SNS.guestsUrl, { cache: "no-cache" })
        .then((r) => {
          if (!r.ok) throw new Error("HTTP " + r.status);
          return r.json();
        })
        .then(buildIndex);
    }
    return dataPromise;
  }

  // Flatten into a list of { display, tokens, aliasTokensList, table } entries.
  // Each entry's `table` also carries the full guest-name list so we can show
  // tablemates without a second lookup.
  function buildIndex(data) {
    const entries = [];
    for (const table of data.tables || []) {
      const allGuestNames = (table.guests || []).map((g) => g.name);
      const tableRef = {
        number: table.number,
        constellation: table.constellation,
        guestNames: allGuestNames,
      };
      for (const guest of table.guests || []) {
        entries.push({
          display: guest.name,
          tokens: tokens(guest.name),
          aliasTokensList: (guest.aliases || []).map(tokens),
          table: tableRef,
        });
      }
    }
    guestIndex = entries;
    return entries;
  }

  // Scoring:
  //  100 = exact full-name match (or exact alias)
  //   90 = all query tokens matched as whole name tokens (order-independent)
  //   70 = all query tokens matched as prefixes of name tokens
  //   50 = single query token matches any single name token exactly
  //   30 = single query token is a prefix of any name token (min length 2)
  //    0 = no match
  function scoreEntry(queryTokens, entry) {
    if (queryTokens.length === 0) return 0;

    const candidates = [entry.tokens, ...entry.aliasTokensList];
    let best = 0;

    for (const nameTokens of candidates) {
      if (nameTokens.length === 0) continue;

      // Exact join match
      if (queryTokens.join(" ") === nameTokens.join(" ")) {
        best = Math.max(best, 100);
        continue;
      }

      // All query tokens present as whole name tokens
      const nameSet = new Set(nameTokens);
      if (queryTokens.every((t) => nameSet.has(t))) {
        best = Math.max(best, 90);
        continue;
      }

      // All query tokens are prefixes of some (distinct) name token
      const used = new Array(nameTokens.length).fill(false);
      let allPrefix = true;
      for (const qt of queryTokens) {
        const idx = nameTokens.findIndex(
          (nt, i) => !used[i] && nt.startsWith(qt)
        );
        if (idx === -1) {
          allPrefix = false;
          break;
        }
        used[idx] = true;
      }
      if (allPrefix) {
        best = Math.max(best, 70);
        continue;
      }

      // Single-token queries: exact or prefix match against any name token
      if (queryTokens.length === 1) {
        const qt = queryTokens[0];
        if (nameTokens.includes(qt)) {
          best = Math.max(best, 50);
        } else if (qt.length >= 2 && nameTokens.some((nt) => nt.startsWith(qt))) {
          best = Math.max(best, 30);
        }
      }
    }

    return best;
  }

  function search(query) {
    const qt = tokens(query);
    if (qt.length === 0 || guestIndex == null) return [];

    const scored = [];
    for (const entry of guestIndex) {
      const score = scoreEntry(qt, entry);
      if (score > 0) scored.push({ entry, score });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored;
  }

  function renderFound(entry) {
    const { table } = entry;
    resultEl.innerHTML = "";
    const box = document.createElement("div");
    box.className = "found";
    box.innerHTML =
      '<p class="guest-name"></p>' +
      '<p class="table-line">' +
      'You&rsquo;re at <span class="table-number"></span> &mdash; ' +
      '<span class="constellation"></span></p>';
    box.querySelector(".guest-name").textContent = entry.display;
    box.querySelector(".table-number").textContent = "Table " + table.number;
    box.querySelector(".constellation").textContent = table.constellation;

    const tablemates = (table.guestNames || []).filter(
      (n) => n !== entry.display
    );
    if (tablemates.length > 0) {
      const heading = document.createElement("p");
      heading.className = "tablemates-heading";
      heading.textContent = "You\u2019ll be sitting with:";
      const ul = document.createElement("ul");
      ul.className = "tablemates";
      for (const name of tablemates) {
        const li = document.createElement("li");
        li.textContent = name;
        ul.appendChild(li);
      }
      box.appendChild(heading);
      box.appendChild(ul);
    }

    resultEl.appendChild(box);
  }

  function renderAmbiguous(matches) {
    resultEl.innerHTML = "";
    const box = document.createElement("div");
    box.className = "ambiguous";
    const p = document.createElement("p");
    p.textContent = "We found a few possible matches — please pick yours:";
    box.appendChild(p);
    const ul = document.createElement("ul");
    for (const m of matches) {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.style.background = "transparent";
      btn.style.color = "var(--accent)";
      btn.style.padding = "0";
      btn.style.textDecoration = "underline";
      btn.textContent =
        m.entry.display +
        "  (Table " +
        m.entry.table.number +
        " — " +
        m.entry.table.constellation +
        ")";
      btn.addEventListener("click", () => renderFound(m.entry));
      li.appendChild(btn);
      ul.appendChild(li);
    }
    box.appendChild(ul);
    resultEl.appendChild(box);
  }

  function renderNotFound() {
    var seatingHref = "./seating.html?event=" + (window.SNS && window.SNS.event ? window.SNS.event : "reception");
    resultEl.innerHTML =
      '<div class="not-found">' +
      "We couldn&rsquo;t find that name. Try just your first or last name, " +
      'or <a href="' + seatingHref + '">view the full seating plan</a>.' +
      "</div>";
  }

  function renderError() {
    resultEl.innerHTML =
      '<div class="not-found">' +
      "Something went wrong loading the guest list. Please refresh and try again." +
      "</div>";
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const query = input.value;
    if (!normalize(query)) {
      input.focus();
      return;
    }

    submitBtn.disabled = true;
    try {
      await loadData();
    } catch (err) {
      console.error(err);
      renderError();
      submitBtn.disabled = false;
      return;
    }
    submitBtn.disabled = false;

    const matches = search(query);
    if (matches.length === 0) {
      renderNotFound();
      return;
    }

    // Unambiguous: single top-scoring match, or top match strictly beats runner-up.
    const top = matches[0];
    const strong = top.score >= 70;
    const clearWinner =
      matches.length === 1 || matches[1].score < top.score;

    if (strong && clearWinner) {
      renderFound(top.entry);
    } else {
      // Show up to 5 candidates for disambiguation.
      renderAmbiguous(matches.slice(0, 5));
    }
  });
})();
