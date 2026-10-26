/* JetSpec++ site: theme toggle (videos follow the theme) and the result tables of the paper's
   Tables 1 to 3. The numbers come from data.js. */
(function () {
  "use strict";

  var D = window.JSPP_DATA, SPEED = D.SPEED, BENCHES = D.BENCHES, TAU = D.TAU;
  var MODELS = [
    { key: "qwen3-8b", name: "Qwen3-8B", sched: "J1-R1" },
    { key: "qwen3.8-27b", name: "Qwen3.8-27B", sched: "J3-R3" }
  ];
  var SPEED_BENCHES = [["gsm8k", "GSM8K"], ["math500", "MATH-500"]];
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
  var SPEEDS = [0.5, 0.8, 1, 1.2, 1.5, 2];
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
    var ratios = MODELS.map(function (m) {
      return SPEED_BENCHES.map(function (b) {
        return fmt(speedRow(m.key, b[0], "JetSpec++")[1] / speedRow(m.key, b[0], "DSpark")[1], 2) + "×";
      });
    });
    document.getElementById("speed-summary").textContent = "With Qwen3-8B, JetSpec++ decodes " + ratios[0][0] +
      " faster than DSpark on GSM8K and " + ratios[0][1] + " faster on MATH-500. With Qwen3.8-27B, it decodes " +
      ratios[1][0] + " and " + ratios[1][1] + " faster. The full table:";
    var head = '<tr><th rowspan="2">Method</th><th class="num" rowspan="2">GPUs</th>' + SPEED_BENCHES.map(function (b) {
      return '<th class="grp-col gl" colspan="3">' + b[1] + "</th>";
    }).join("") + "</tr><tr>" + SPEED_BENCHES.map(function () {
      return '<th class="num sub gl">tok/s</th><th class="num sub">Speedup</th><th class="num sub">τ</th>';
    }).join("") + "</tr>";
    var body = MODELS.map(function (m) {
      return '<tr class="grp"><th colspan="8">' + m.name + "</th></tr>" + SPEED[m.key + "/gsm8k"].rows.map(function (first) {
        var name = first[0], ours = name === "JetSpec++";
        return "<tr" + (ours ? ' class="hl"' : "") + "><th>" + (ours ? "JetSpec++ " + m.sched : name) + '</th><td class="num">' +
          first[7] + "</td>" + SPEED_BENCHES.map(function (b) {
            var r = speedRow(m.key, b[0], name);
            return '<td class="num gl">' + fmt(r[1], 1) + '</td><td class="num">' + fmt(r[2], 2) + '×</td><td class="num">' + fmt(r[3], 2) + "</td>";
          }).join("") + "</tr>";
      }).join("");
    }).join("");
    document.getElementById("speed-table").innerHTML = '<table class="dtable even"><caption>' +
      "<b>Decode speed at batch size 1 on GB200.</b> The table gives tokens per second (tok/s), the speedup over AR on one GPU, and the tokens per round (τ). " +
      "All runs use batch size 1, temperature 0 and CUDA graphs on GB200. Each benchmark has 128 prompts, and the " +
      "verification budget is 16 (5 for SSD). GPUs is the number of GPUs that serve one request. JetSpec++ runs J1-R1 " +
      "on Qwen3-8B and J3-R3 on Qwen3.8-27B. The numbers come from the paper (Table 3).</caption>" + cols(7) + "<thead>" + head +
      "</thead><tbody>" + body + "</tbody></table>";
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
      "<b>Tokens per round at temperature " + state.temp + " and budget " + state.budget + ".</b> " +
      "The table gives the mean number of tokens committed per verification round (τ). Budget is the block size at verification. J1-R1 runs one Jacobi pass with one " +
      "context refresh and anchor replacement, and J3-R3 runs three of each. The numbers come from the paper (Table 1 " +
      "for Qwen3-8B, Table 2 for Qwen3.8-27B).</caption>" + cols(BENCHES.length) + "<thead>" + head + "</thead><tbody>" + body + "</tbody></table>";
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
  renderTau();
  syncVideos();
})();
