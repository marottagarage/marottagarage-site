// Marotta Garage Sàrl — menu mobile, année du pied de page et animations au défilement.
(function () {
  var toggle = document.querySelector(".menu-toggle");
  var nav = document.getElementById("nav");

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // Ombre sous l'en-tête dès qu'on défile
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () { header.classList.toggle("scrolled", window.scrollY > 10); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // Apparition des blocs au défilement. On n'anime que ce qui est encore sous
  // l'écran au chargement, pour ne jamais faire clignoter le haut de la page.
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) return;

  var targets = document.querySelectorAll(
    ".section-head, .card, .split > *, .info-grid > *, .cta .container > *, .strengths li, .prose > *"
  );
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });

  Array.prototype.forEach.call(targets, function (el) {
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    // Décalage en cascade entre frères (cartes, colonnes, atouts)
    var index = Array.prototype.indexOf.call(el.parentNode.children, el);
    el.style.transitionDelay = Math.min(index, 4) * 0.1 + "s";
    el.classList.add("reveal");
    observer.observe(el);
  });
  document.documentElement.classList.add("js");

  // Filet de sécurité : si l'observateur rate un bloc, on l'affiche au défilement
  window.addEventListener("scroll", function () {
    var pending = document.querySelectorAll(".reveal:not(.in)");
    for (var i = 0; i < pending.length; i++) {
      if (pending[i].getBoundingClientRect().top < window.innerHeight) pending[i].classList.add("in");
    }
  }, { passive: true });
})();
