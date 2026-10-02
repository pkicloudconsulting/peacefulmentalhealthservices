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
})();
