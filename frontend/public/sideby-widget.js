(function () {
  function init(options) {
    var target = typeof options.element === "string"
      ? document.querySelector(options.element)
      : options.element;
    if (!target) return;

    var baseUrl = options.baseUrl || "https://sideby.ink";
    var slug = options.slug;
    if (!slug) {
      target.textContent = "SideBy widget requires a comparison slug.";
      return;
    }

    // Determine theme
    var activeTheme = options.theme || "auto";
    if (activeTheme === "auto") {
      var isDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      activeTheme = isDark ? "dark" : "light";
    }

    var bg = activeTheme === "dark" ? "#0f172a" : "#ffffff";
    var text = activeTheme === "dark" ? "#f8fafc" : "#0f172a";
    var subtext = activeTheme === "dark" ? "#cbd5e1" : "#475569";
    var border = activeTheme === "dark" ? "rgba(51, 65, 85, 0.8)" : "rgba(226, 232, 240, 0.8)";
    var secondary = activeTheme === "dark" ? "#94a3b8" : "#64748b";
    var accent = activeTheme === "dark" ? "#f97316" : "#ea580c";
    var cardShadow = activeTheme === "dark"
      ? "rgba(0, 0, 0, 0.3) 0px 4px 12px"
      : "rgba(0, 0, 0, 0.05) 0px 4px 12px";

    target.innerHTML = [
      '<div style="border:1px solid ' + border + ';border-radius:12px;padding:16px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:' + bg + ';color:' + text + ';box-shadow:' + cardShadow + '">',
      'Loading comparison...',
      '</div>'
    ].join("");

    fetch(baseUrl.replace(/\/$/, "") + "/api/comparisons/by-slug/" + encodeURIComponent(slug))
      .then(function (response) { return response.json(); })
      .then(function (data) {
        if (data.error) {
          target.innerHTML = '<div style="color:red;font-size:13px;padding:8px">Error loading comparison: ' + escapeHtml(data.error) + '</div>';
          return;
        }

        var result = data.result || {};
        var verdict = result.verdict || {};
        var entities = result.entities || {};
        var winner = verdict.winner || null;
        var query = data.query || result.query || "Comparison";

        if (options.compact) {
          // Render Compact Layout
          target.innerHTML = [
            '<div style="border:1px solid ' + border + ';border-radius:12px;padding:12px 16px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:' + bg + ';color:' + text + ';box-shadow:' + cardShadow + ';display:flex;flex-direction:column;gap:4px">',
            '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px">',
            '<span style="font-weight:600;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + escapeHtml(query) + '</span>',
            '<a style="color:' + accent + ';text-decoration:none;font-size:12px;font-weight:700;white-space:nowrap" target="_blank" rel="noopener noreferrer" href="' + baseUrl.replace(/\/$/, "") + '/compare/' + encodeURIComponent(slug) + '">View Full &rarr;</a>',
            '</div>',
            '<div style="font-size:12px;color:' + subtext + ';line-height:1.4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + escapeHtml(verdict.summary || "Source-backed comparison is ready.") + '</div>',
            '<div style="display:flex;justify-content:space-between;font-size:10px;color:' + secondary + ';margin-top:2px">',
            '<a href="https://snapsolve.ink" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:none;font-weight:500">Made by SnapSolve Ink</a>',
            '<span>Powered by SideBy</span>',
            '</div>',
            '</div>'
          ].join("");
        } else {
          // Render Standard Full Layout
          var winnerBadge = "";
          if (winner && winner !== "tie") {
            var winnerName = winner === "a" ? (entities.a && entities.a.name) : (entities.b && entities.b.name);
            winnerBadge = '<span style="display:inline-block;padding:2px 8px;border-radius:100px;font-size:11px;font-weight:600;background:rgba(234,88,12,0.1);color:' + accent + ';margin-left:8px">Winner: ' + escapeHtml(winnerName || winner) + '</span>';
          } else if (winner === "tie") {
            winnerBadge = '<span style="display:inline-block;padding:2px 8px;border-radius:100px;font-size:11px;font-weight:600;background:rgba(100,116,139,0.1);color:' + secondary + ';margin-left:8px">Winner: Tie</span>';
          }

          target.innerHTML = [
            '<div style="border:1px solid ' + border + ';border-radius:16px;padding:20px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:' + bg + ';color:' + text + ';box-shadow:' + cardShadow + ';display:flex;flex-direction:column;gap:12px">',
            '<div style="display:flex;justify-content:space-between;align-items:flex-start">',
            '<div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:' + secondary + ';font-weight:700">SideBy Research</div>',
            winnerBadge,
            '</div>',
            '<h3 style="margin:0;font-size:18px;font-weight:700;line-height:1.25">' + escapeHtml(query) + '</h3>',
            '<p style="margin:0;color:' + subtext + ';font-size:13.5px;line-height:1.5">' + escapeHtml(verdict.summary || "Source-backed comparison is ready.") + '</p>',
            '<div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid ' + border + ';padding-top:12px;margin-top:4px">',
            '<a href="https://snapsolve.ink" target="_blank" rel="noopener noreferrer" style="font-size:11px;color:' + secondary + ';text-decoration:none;font-weight:500">Made by SnapSolve Ink</a>',
            '<a style="display:inline-block;color:' + accent + ';text-decoration:none;font-size:13px;font-weight:700" target="_blank" rel="noopener noreferrer" href="' + baseUrl.replace(/\/$/, "") + '/compare/' + encodeURIComponent(slug) + '">Read Full Comparison &rarr;</a>',
            '</div>',
            '</div>'
          ].join("");
        }
      })
      .catch(function (error) {
        target.innerHTML = '<div style="color:red;font-size:13px;padding:8px">Unable to connect to SideBy.</div>';
      });
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Auto-initialize elements with class 'sideby-widget'
  function autoInit() {
    var elements = document.querySelectorAll(".sideby-widget");
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      if (el.dataset.initialized) continue;
      el.dataset.initialized = "true";

      init({
        element: el,
        slug: el.getAttribute("data-slug"),
        theme: el.getAttribute("data-theme") || "auto",
        compact: el.getAttribute("data-compact") === "true",
        baseUrl: el.getAttribute("data-base-url")
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoInit);
  } else {
    autoInit();
  }

  window.SideBy = { init: init };
})();
