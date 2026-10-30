/* JetSpec++ site: theme toggle (videos follow the theme) and the result tables of the paper's
   Tables 1 to 3. The numbers come from data.js. */
(function () {
  "use strict";

  var D = window.JSPP_DATA, SPEED = D.SPEED, BENCHES = D.BENCHES, TAU = D.TAU, BATCH = D.BATCH;
  var MODELS = [
    { key: "qwen3-8b", name: "Qwen3-8B", sched: "J1-R1" },
    { key: "qwen3.8-27b", name: "Qwen3.8-27B", sched: "J3-R3" }
  ];
  var SPEED_BENCHES = [["math500", "MATH-500"], ["gsm8k", "GSM8K"]];
  var state = { temp: "0", budget: "16" };

  /* ---------- theme and videos ---------- */
  var root = document.documentElement;
  var osDark = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function theme() {
    var set = root.getAttribute("data-theme");
    if (set === "light" || set === "dark") return set;
    return osDark && osDark.matches ? "dark" : "light";
  }

  function syncVideos() {
    var mode = theme();
    document.querySelectorAll(".video video").forEach(function (video) {
      var figure = video.parentElement;
      var want = video.getAttribute(mode === "dark" ? "data-src-dark" : "data-src-light");
      if (!want || video.getAttribute("src") === want) return;
      // A theme switch keeps the viewer's place, speed and pause state.
      var resumeAt = video.currentTime || 0, rate = video.playbackRate || 1, first = !video.getAttribute("src");
      var keepPaused = !first && video.paused;
      figure.classList.add("pending");
      video.onloadeddata = function () {
        figure.classList.remove("pending");
        video.playbackRate = rate;
        if (resumeAt && isFinite(video.duration)) video.currentTime = Math.min(resumeAt, video.duration);
        if (!(keepPaused || (first && reducedMotion))) video.play().catch(function () {});
      };
      video.onerror = function () { figure.classList.add("pending"); };
      video.src = want;
      video.load();
    });
  }

  /* ---------- video controls: play or pause, a seek bar, the time and the speed ---------- */
  var SPEEDS = [0.5, 1];
  function clock(s) {
    s = Math.max(0, Math.floor(s || 0));
    return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2);
  }
  function addControls(figure) {
    var video = figure.querySelector("video");
    var bar = document.createElement("div");
    bar.className = "vc";
    bar.innerHTML = '<button type="button" class="vc-play" aria-label="Play or pause">Pause</button>' +
      '<input type="range" class="vc-seek" min="0" max="1000" step="1" value="0" aria-label="Seek">' +
      '<span class="vc-time">0:00 / 0:00</span>' +
      '<span class="vc-label">Speed</span><div class="segmented vc-speed" role="group" aria-label="Playback speed">' +
      SPEEDS.map(function (s) { return '<button type="button" data-rate="' + s + '" aria-pressed="' + (s === 1) + '">' + s + "&times;</button>"; }).join("") +
      "</div>";
    figure.parentNode.insertBefore(bar, figure.nextSibling);
    var play = bar.querySelector(".vc-play"), seek = bar.querySelector(".vc-seek"), time = bar.querySelector(".vc-time");
    var dragging = false;
    function update() {
      play.textContent = video.paused ? "Play" : "Pause";
      var d = video.duration;
      if (isFinite(d) && d > 0) {
        if (!dragging) seek.value = String(Math.round(1000 * video.currentTime / d));
        time.textContent = clock(video.currentTime) + " / " + clock(d);
      }
    }
    play.addEventListener("click", function () {
      if (video.paused) video.play().catch(function () {}); else video.pause();
    });
    seek.addEventListener("input", function () {
      dragging = true;
      if (isFinite(video.duration)) video.currentTime = video.duration * seek.value / 1000;
    });
    seek.addEventListener("change", function () { dragging = false; });
    bar.querySelectorAll("[data-rate]").forEach(function (b) {
      b.addEventListener("click", function () {
        video.playbackRate = +b.getAttribute("data-rate");
        bar.querySelectorAll("[data-rate]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      });
    });
    ["play", "pause", "timeupdate", "loadedmetadata", "seeked"].forEach(function (e) { video.addEventListener(e, update); });
  }
  document.querySelectorAll(".video").forEach(addControls);

  document.getElementById("theme-toggle").addEventListener("click", function () {
    var next = theme() === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("jspp-theme", next); } catch (e) {}
    syncVideos();
  });
  if (osDark && osDark.addEventListener) osDark.addEventListener("change", syncVideos);

  function fmt(x, digits) {
    return x.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }

  // A method column, then `n` number columns that share the rest of the width equally.
  function cols(n) {
    return '<colgroup><col class="c-method">' + new Array(n + 1).join("<col>") + "</colgroup>";
  }

  /* ---------- decode speed (Table 3) ---------- */
  function speedRow(model, bench, name) {
    return SPEED[model + "/" + bench].rows.filter(function (r) { return r[0] === name; })[0];
  }

  function renderSpeed() {
    var head = '<tr><th colspan="2" rowspan="2">Method</th><th class="num" rowspan="2">GPUs</th>' + SPEED_BENCHES.map(function (b) {
      return '<th class="grp-col gl" colspan="3">' + b[1] + "</th>";
    }).join("") + "</tr><tr>" + SPEED_BENCHES.map(function () {
      return '<th class="num sub gl">tok/s</th><th class="num sub">Speedup</th><th class="num sub">τ</th>';
    }).join("") + "</tr>";
    // A method with several setups ("DSpark", "DSpark, disaggregated", ...) takes one multi-row method cell.
    var base = function (r) { return r[0].split(", ")[0]; };
    var body = MODELS.map(function (m) {
      var rows = SPEED[m.key + "/gsm8k"].rows;
      return '<tr class="grp"><th colspan="9">' + m.name + "</th></tr>" + rows.map(function (first, i) {
        var name = first[0], ours = name === "JetSpec++", setup = name.split(", ")[1];
        var n = rows.filter(function (r) { return base(r) === base(first); }).length;
        var lead = i === 0 || base(rows[i - 1]) !== base(first);
        var label = ours ? "JetSpec++ " + m.sched : base(first);
        var method = n === 1 ? '<th colspan="2">' + label + "</th>" :
          (lead ? '<th rowspan="' + n + '">' + label + "</th>" : "") +
          '<td class="setup">' + (setup ? setup.charAt(0).toUpperCase() + setup.slice(1) : "Colocated") + "</td>";
        return "<tr" + (ours ? ' class="hl"' : "") + ">" + method + '<td class="num">' + first[7] + "</td>" + SPEED_BENCHES.map(function (b) {
          var r = speedRow(m.key, b[0], name);
          return '<td class="num gl">' + fmt(r[1], 1) + '</td><td class="num">' + fmt(r[2], 2) + '×</td><td class="num">' + fmt(r[3], 2) + "</td>";
        }).join("") + "</tr>";
      }).join("");
    }).join("");
    document.getElementById("speed-table").innerHTML = '<table class="dtable even speed"><caption>' +
      "<b>Decode speed at batch size 1 on GB200.</b> Temperature 0, 128 prompts per benchmark.</caption>" + cols(7).replace('<col class="c-method">', '<col class="c-method"><col class="c-setup">') + "<thead>" + head +
      "</thead><tbody>" + body + "</tbody></table>";
  }

  /* ---------- batch sizes 1 to 4 ---------- */
  function renderBatch() {
    var sizes = [1, 2, 3, 4];
    var head = '<tr><th colspan="2" rowspan="2">Method</th>' + sizes.map(function (c) {
      return '<th class="grp-col gl" colspan="2">Batch size ' + c + "</th>";
    }).join("") + "</tr><tr>" + sizes.map(function () {
      return '<th class="num sub gl">Total</th><th class="num sub">Per user</th>';
    }).join("") + "</tr>";
    // A method with several setups takes one multi-row method cell, as in the decode speed table.
    var base = function (r) { return r[0].split(", ")[0]; };
    var cell = function (x) { return x === null ? "&ndash;" : fmt(x, 1); };
    var body = BATCH.map(function (r, row) {
      var setup = r[0].split(", ")[1];
      var n = BATCH.filter(function (x) { return base(x) === base(r); }).length;
      var lead = row === 0 || base(BATCH[row - 1]) !== base(r);
      var method = n === 1 ? '<th colspan="2">' + r[0] + "</th>" :
        (lead ? '<th rowspan="' + n + '">' + base(r) + "</th>" : "") +
        '<td class="setup">' + (setup ? setup.charAt(0).toUpperCase() + setup.slice(1) : "One GPU") + "</td>";
      return "<tr" + (r[0] === "JetSpec++" ? ' class="hl"' : "") + ">" + method + sizes.map(function (c, i) {
        return '<td class="num gl">' + cell(r[1][i]) + '</td><td class="num">' + cell(r[2][i]) + "</td>";
      }).join("") + "</tr>";
    }).join("");
    document.getElementById("batch-table").innerHTML = '<table class="dtable even batch"><caption>' +
      "<b>Total and per-user tok/s on GB200, Qwen3-8B, MATH-500.</b> " +
      "Batch size 1 is from the paper. Batch sizes 2 to 4 are preliminary, from an unreleased development branch with batch optimizations on JetSpec++ only. JetSpec++ runs J1-R1 on two GPUs, with a reduced draft vocabulary above batch size 1. AR runs on one GPU. For DSpark, two GPUs means data parallelism (DP): one replica on each GPU.</caption>" +
      cols(8).replace('<col class="c-method">', '<col class="c-method"><col class="c-setup">') + "<thead>" + head + "</thead><tbody>" + body + "</tbody></table>";
  }

  /* ---------- acceptance length (Tables 1 and 2) ---------- */
  function renderTau() {
    var key = state.temp + "/" + state.budget;
    var head = "<tr><th>Method</th>" + BENCHES.map(function (b, i) {
      return '<th class="num' + (i === 0 ? " gl" : "") + '">' + b + "</th>";
    }).join("") + "</tr>";
    var body = MODELS.map(function (m) {
      var T = TAU[m.key][key];
      return '<tr class="grp"><th colspan="8">' + m.name + "</th></tr>" + Object.keys(T).map(function (n) {
        return "<tr" + (n.indexOf("JetSpec++") === 0 ? ' class="hl"' : "") + "><th>" + n + "</th>" + T[n].map(function (v, i) {
          return '<td class="num' + (i === 0 ? " gl" : "") + '">' + fmt(v, 2) + "</td>";
        }).join("") + "</tr>";
      }).join("");
    }).join("");
    document.getElementById("tau-table").innerHTML = '<table class="dtable even"><caption>' +
      "<b>Tokens per round (τ) at temperature " + state.temp + " and budget " + state.budget + ".</b> " +
      "J1-R1 runs one Jacobi pass with one context refresh and anchor replacement, and J3-R3 runs three of each.</caption>" + cols(BENCHES.length) + "<thead>" + head + "</thead><tbody>" + body + "</tbody></table>";
  }

  /* ---------- filters ---------- */
  var FILTERS = {
    temp: [["0", "Temperature 0"], ["1", "Temperature 1"]],
    budget: [["16", "Budget 16"], ["32", "Budget 32"]]
  };
  function buildFilters() {
    document.querySelectorAll("[data-filter]").forEach(function (group) {
      var key = group.getAttribute("data-filter");
      FILTERS[key].forEach(function (opt) {
        var b = document.createElement("button");
        b.type = "button";
        b.textContent = opt[1];
        b.setAttribute("aria-pressed", String(state[key] === opt[0]));
        b.addEventListener("click", function () {
          state[key] = opt[0];
          group.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
          renderTau();
        });
        group.appendChild(b);
      });
    });
  }

  /* ---------- citation copy ---------- */
  document.querySelectorAll("[data-copy]").forEach(function (button) {
    button.addEventListener("click", function () {
      var text = document.getElementById(button.getAttribute("data-copy")).textContent;
      var done = function () { button.textContent = "Copied"; setTimeout(function () { button.textContent = "Copy"; }, 1500); };
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, function () {}); else done();
    });
  });

  buildFilters();
  renderSpeed();
  renderBatch();
  renderTau();
  syncVideos();
})();
