/* Peaceful Mental Health Services: header behaviour shared by every page.
   - announcement bar dismiss (remembered for the browser session)
   - full-screen mobile menu (hamburger), Escape to close, scroll lock
   - on phones, menu items with a dropdown expand in place instead of navigating */
(function () {
  var bar = document.querySelector(".announce-bar");
  if (bar) {
    try { if (sessionStorage.getItem("pmAnnounceHidden")) bar.hidden = true; } catch (e) {}
    var x = bar.querySelector(".announce-close");
    if (x) x.addEventListener("click", function () {
      bar.hidden = true;
      try { sessionStorage.setItem("pmAnnounceHidden", "1"); } catch (e) {}
    });
  }

  var nav = document.getElementById("nav");
  var toggle = document.querySelector(".nav-toggle");
  if (!nav || !toggle) return;
  var phone = window.matchMedia("(max-width: 640px)");

  function setOpen(open) {
    nav.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("nav-open", open);
    if (!open) {
      [].forEach.call(nav.querySelectorAll(".nav-item.is-open"), function (it) {
        it.classList.remove("is-open");
        var a = it.querySelector(":scope > a"); if (a) a.setAttribute("aria-expanded", "false");
      });
    }
  }
  toggle.addEventListener("click", function () { setOpen(!nav.classList.contains("open")); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("open")) { setOpen(false); toggle.focus(); }
  });
  phone.addEventListener && phone.addEventListener("change", function (m) { if (!m.matches) setOpen(false); });

  [].forEach.call(nav.querySelectorAll(".nav-item > a"), function (a) {
    a.setAttribute("aria-expanded", "false");
    a.addEventListener("click", function (e) {
      if (!phone.matches) return;
      e.preventDefault();
      var item = a.parentNode, open = !item.classList.contains("is-open");
      item.classList.toggle("is-open", open);
      a.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });
  [].forEach.call(nav.querySelectorAll(".nav-drop a"), function (a) {
    a.addEventListener("click", function () { if (phone.matches) setOpen(false); });
  });

  // Desktop: keep a dropdown open while the pointer travels from its menu link down to the panel,
  // so visitors can reach the Get Care links without the menu snapping shut on the way.
  [].forEach.call(nav.querySelectorAll(".nav-item"), function (item) {
    var timer;
    item.addEventListener("mouseenter", function () {
      if (phone.matches) return;
      clearTimeout(timer);
      [].forEach.call(nav.querySelectorAll(".nav-item.is-hover"), function (other) {
        if (other !== item) other.classList.remove("is-hover");
      });
      item.classList.add("is-hover");
    });
    item.addEventListener("mouseleave", function () {
      clearTimeout(timer);
      timer = setTimeout(function () { item.classList.remove("is-hover"); }, 350);
    });
  });
})();

/* Homepage (desktop): the header floats over the hero photo; it turns solid once the page scrolls */
(function () {
  if (!document.body.classList.contains("home-overlay")) return;
  var header = document.querySelector(".site-header");
  if (!header) return;
  function onScroll() { header.classList.toggle("is-solid", window.scrollY > 40); }
  function measure() { document.documentElement.style.setProperty("--hdr-h", header.offsetHeight + "px"); }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", measure);
  onScroll(); measure();
})();

/* Every screen size: the crisis line can be dismissed, and the announcement pops up
   2 seconds after the page opens and stays until it is closed (remembered for the visit) */
(function () {
  var crisis = document.querySelector(".crisis-bar");
  if (crisis) {
    try { if (sessionStorage.getItem("pmCrisisHidden")) crisis.classList.add("is-dismissed"); } catch (e) {}
    var cx = crisis.querySelector(".crisis-close");
    if (cx) cx.addEventListener("click", function () {
      crisis.classList.add("is-dismissed");
      try { sessionStorage.setItem("pmCrisisHidden", "1"); } catch (e) {}
      window.dispatchEvent(new Event("resize"));
    });
  }

  var bar = document.querySelector(".announce-bar");
  if (!bar) return;
  var timer = setTimeout(function () { if (!bar.hidden) bar.classList.add("is-shown"); }, 2000);
  var x = bar.querySelector(".announce-close");
  if (x) x.addEventListener("click", function () { clearTimeout(timer); bar.classList.remove("is-shown"); });
})();

/* Wordmark lockup: size "MENTAL HEALTH" so it is exactly as wide as "PEACEFUL" (SERVICES spreads via flex) */
(function () {
  function fit() {
    [].forEach.call(document.querySelectorAll(".brand-name"), function (b) {
      var a = b.querySelector(".bn-1"), m = b.querySelector(".bn-2");
      if (!a || !m) return;
      m.style.fontSize = "";
      var wa = a.getBoundingClientRect().width, wm = m.getBoundingClientRect().width;
      if (!wa || !wm) return;
      var px = parseFloat(getComputedStyle(m).fontSize);
      m.style.fontSize = (px * wa / wm).toFixed(2) + "px";
    });
  }
  fit();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  window.addEventListener("resize", fit);
})();
