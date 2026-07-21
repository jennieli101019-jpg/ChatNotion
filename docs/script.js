/* ============================================================
   ChatNotion landing page — interactivity
   - EN / 中文 language toggle (persisted)
   - sticky nav shadow on scroll
   - scroll-reveal animations
   ============================================================ */
(function () {
  "use strict";

  var html = document.documentElement;

  /* ---------- language toggle ---------- */
  var STORE_KEY = "chatnotion-lang";
  var langButtons = document.querySelectorAll("[data-set-lang]");

  function setLang(lang) {
    if (lang !== "en" && lang !== "zh") lang = "en";
    html.setAttribute("data-lang", lang);
    html.setAttribute("lang", lang === "zh" ? "zh-CN" : "en");
    langButtons.forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-set-lang") === lang);
      b.setAttribute("aria-pressed", String(b.getAttribute("data-set-lang") === lang));
    });
    try { localStorage.setItem(STORE_KEY, lang); } catch (e) {}
  }

  langButtons.forEach(function (b) {
    b.addEventListener("click", function () {
      setLang(b.getAttribute("data-set-lang"));
    });
  });

  // initial language: stored preference, else default to English
  var initial = null;
  try { initial = localStorage.getItem(STORE_KEY); } catch (e) {}
  if (!initial) {
    initial = "en";
  }
  setLang(initial);

  /* ---------- nav shadow on scroll ---------- */
  var nav = document.getElementById("nav");
  function onScroll() {
    if (nav) nav.classList.toggle("scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- scroll reveal ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- demo video: swap the poster facade for the real player ----------
     Keeping the iframe out of the page until the click means the poster shows no YouTube
     title bar or branding, the page loads without YouTube's script, and nothing is
     requested from YouTube for visitors who never press play. */
  (function () {
    var facade = document.getElementById("videoFacade");
    if (!facade) return;

    facade.addEventListener("click", function () {
      var id = facade.getAttribute("data-video");
      var frame = document.createElement("iframe");
      // autoplay so the click that dismissed the poster also starts playback
      frame.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0";
      frame.title = "ChatNotion product demo";
      frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      frame.referrerPolicy = "strict-origin-when-cross-origin";
      frame.allowFullscreen = true;

      var holder = document.createElement("div");
      holder.className = "video-frame" + (facade.classList.contains("in") ? " in" : "");
      holder.appendChild(frame);
      facade.replaceWith(holder);
    });
  })();

  /* ---------- hero diagram: scripted left-to-right build ----------
     Walks the same path a user does: read the answer, press Generate tree,
     watch the tree build, open a leaf as a note, highlight a line, add a note.
     Only runs when the figure is on screen, and never under reduced motion. */
  (function () {
    var fig = document.querySelector(".tree-figure");
    var svg = fig && fig.querySelector("svg");
    if (!svg || !("IntersectionObserver" in window)) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var cursor = svg.querySelector(".dg-cursor");
    var ripple = svg.querySelector(".dg-ripple");
    if (!cursor || !ripple) return;

    function all(sel) {
      return Array.prototype.slice.call(svg.querySelectorAll(sel));
    }
    function show(sel) { all(sel).forEach(function (e) { e.classList.add("on"); }); }
    function hide(sel) { all(sel).forEach(function (e) { e.classList.remove("on"); }); }
    function moveTo(x, y) { cursor.style.transform = "translate(" + x + "px," + y + "px)"; }
    function click() {
      ripple.classList.remove("go");
      void ripple.getBoundingClientRect(); // restart the keyframes
      ripple.classList.add("go");
    }

    // dashed-line reveal needs each path's real length
    all(".dg-draw").forEach(function (p) {
      p.style.setProperty("--len", p.getTotalLength().toFixed(1));
    });

    function reset() {
      hide(".dg, .dg-temp");
      cursor.classList.remove("on");
      ripple.classList.remove("go");
      cursor.style.transition = "none";
      moveTo(150, 300);
      void cursor.getBoundingClientRect();
      cursor.style.transition = "";
    }

    // [wait before this beat, what it does]
    var beats = [
      [0, reset],
      [260, function () { show(".dg-card"); }],
      [380, function () { show(".dg-body"); }],
      [520, function () { show(".dg-btn"); }],
      [320, function () { cursor.classList.add("on"); moveTo(114, 256); }],
      [800, click],
      [280, function () { show(".dg-t1"); }],
      [300, function () { show(".dg-n"); }],
      [420, function () { show(".dg-t2"); }],
      [320, function () { show(".dg-leaf"); }],
      [420, function () { moveTo(614, 142); }],
      [660, click],
      [200, function () { show(".dg-pick"); }],
      [240, function () { show(".dg-pencil"); }],   // inline pencil action on the node
      [380, function () { moveTo(702, 142); }],
      [640, click],
      [240, function () { show(".dg-link, .dg-note"); }],  // note opens, read-only
      [460, function () { moveTo(1053, 84); }],     // Edit
      [640, click],
      [220, function () { show(".dg-editon"); }],   // now in edit mode
      [380, function () { moveTo(914, 153); }],
      [620, function () { click(); show(".dg-sel"); }],
      [300, function () { show(".dg-pop"); }],
      [440, function () { moveTo(880, 117); }],     // Highlight
      [640, function () { click(); show(".dg-hl"); hide(".dg-sel"); }],
      [360, function () { moveTo(962, 117); }],     // Add note — a separate action
      [640, function () { click(); show(".dg-notebox"); }],
      [340, function () { hide(".dg-pop"); show(".dg-foot"); }],
      [500, function () { cursor.classList.remove("on"); }],
      [2400, function () {}] // hold the finished frame before looping
    ];

    var timer = null;
    var i = 0;

    function step() {
      if (i >= beats.length) i = 0;
      var beat = beats[i++];
      timer = setTimeout(function () {
        beat[1]();
        step();
      }, beat[0]);
    }

    var observed = false;
    var dio = new IntersectionObserver(
      function (entries) {
        observed = true;
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            if (timer === null) { i = 0; step(); }
          } else if (timer !== null) {
            clearTimeout(timer);
            timer = null;
          }
        });
      },
      { threshold: 0.25 }
    );

    fig.classList.add("dg-ready");
    reset();
    dio.observe(fig);

    // The figure is hidden until the timeline runs, so if the observer never
    // reports back we would strand it blank. Start it anyway.
    setTimeout(function () {
      if (!observed && timer === null) { i = 0; step(); }
    }, 1600);
  })();
})();
