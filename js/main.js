// Marotta Garage Sàrl — menu mobile, badge « ouvert », bandeau de saison, voyants,
// rappel d'agenda, demande de reprise, volant + klaxon et animations au défilement.
(function () {
  var DE = (document.documentElement.lang || "").indexOf("de") === 0;
  var PHONE = "032 355 20 02";
  var EMAIL = "rafmarotta@hotmail.com";

  /* ---------- Menu mobile ---------- */
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

  /* ---------- Badge « Ouvert maintenant » (heure de Zurich, fériés bernois) ---------- */
  // Minutes depuis minuit ; 0 = dimanche … 6 = samedi.
  var HOURS = {
    1: [[435, 725], [805, 1050]], 2: [[435, 725], [805, 1050]],
    3: [[435, 725], [805, 1050]], 4: [[435, 725], [805, 1050]],
    5: [[435, 725], [805, 975]]
  };
  var DAYS_FR = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  var DAYS_DE = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

  // Jours fériés officiels du canton de Berne (dates fixes + calculées depuis Pâques)
  function easter(y) {
    var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4,
        f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30,
        i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
        month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
    return Date.UTC(y, month - 1, day);
  }
  function holiday(y, mo, d) {
    var fixed = {
      "1-1": ["Nouvel An", "Neujahr"], "1-2": ["Saint-Berchtold", "Berchtoldstag"],
      "8-1": ["Fête nationale", "Bundesfeier"], "12-25": ["Noël", "Weihnachten"], "12-26": ["Saint-Étienne", "Stephanstag"]
    };
    var name = fixed[mo + "-" + d];
    if (!name) {
      var diff = Math.round((Date.UTC(y, mo - 1, d) - easter(y)) / 86400000);
      name = { "-2": ["Vendredi saint", "Karfreitag"], "1": ["Lundi de Pâques", "Ostermontag"],
               "39": ["Ascension", "Auffahrt"], "50": ["Lundi de Pentecôte", "Pfingstmontag"] }[diff];
    }
    return name ? name[DE ? 1 : 0] : null;
  }

  function zurichNow() {
    try {
      var parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Zurich", year: "numeric", month: "numeric", day: "numeric",
        weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
      }).formatToParts(new Date());
      var map = {};
      parts.forEach(function (p) { map[p.type] = p.value; });
      return {
        y: +map.year, mo: +map.month, d: +map.day,
        day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(map.weekday),
        min: parseInt(map.hour, 10) * 60 + parseInt(map.minute, 10)
      };
    } catch (e) {
      var n = new Date();
      return { y: n.getFullYear(), mo: n.getMonth() + 1, d: n.getDate(), day: n.getDay(), min: n.getHours() * 60 + n.getMinutes() };
    }
  }
  function fmt(m) {
    var h = Math.floor(m / 60), mm = ("0" + (m % 60)).slice(-2);
    return DE ? h + "." + mm + " Uhr" : h + "h" + mm;
  }
  function openStatus(now) {
    now = now || zurichNow();
    var todayOff = holiday(now.y, now.mo, now.d);
    var slots = todayOff ? [] : (HOURS[now.day] || []), i;
    for (i = 0; i < slots.length; i++) {
      if (now.min >= slots[i][0] && now.min < slots[i][1]) {
        var end = slots[i][1];
        if (end - now.min <= 30) return { cls: "is-soon", text: DE ? "Schliesst bald · um " + fmt(end) : "Ferme bientôt · à " + fmt(end) };
        return { cls: "is-open", text: DE ? "Geöffnet · bis " + fmt(end) : "Ouvert · jusqu'à " + fmt(end) };
      }
    }
    for (i = 0; i < slots.length; i++) {
      if (now.min < slots[i][0]) {
        if (i > 0) return { cls: "is-closed", text: DE ? "Mittagspause · ab " + fmt(slots[i][0]) : "Pause de midi · réouvre à " + fmt(slots[i][0]) };
        return { cls: "is-closed", text: DE ? "Geschlossen · öffnet um " + fmt(slots[i][0]) : "Fermé · ouvre à " + fmt(slots[i][0]) };
      }
    }
    var closed = DE ? "Geschlossen" : "Fermé";
    if (todayOff) closed += " (" + todayOff + ")";
    for (var k = 1; k <= 14; k++) {
      var t = new Date(Date.UTC(now.y, now.mo - 1, now.d + k)), wd = t.getUTCDay();
      if (!HOURS[wd] || holiday(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate())) continue;
      var when = k === 1 ? (DE ? "morgen" : "demain") : (DE ? DAYS_DE[wd] : DAYS_FR[wd]);
      if (k > 6) when = DE ? "am " + t.getUTCDate() + "." + (t.getUTCMonth() + 1) + "." : "le " + t.getUTCDate() + "." + (t.getUTCMonth() + 1);
      var at = fmt(HOURS[wd][0][0]);
      return { cls: "is-closed", text: DE ? closed + " · öffnet " + when + " um " + at : closed + " · ouvre " + when + " à " + at };
    }
    return null;
  }
  var badge = document.getElementById("open-status");
  function renderBadge() {
    var s = openStatus();
    if (!badge || !s) return;
    badge.className = "open-status " + s.cls;
    badge.textContent = s.text;
    badge.hidden = false;
  }
  renderBadge();
  setInterval(renderBadge, 60000);

  /* ---------- Bandeau de saison (change tout seul selon la date) ---------- */
  var SEASONS = [
    { id: "pneus-hiver", from: 1001, to: 1130,
      fr: "❄️ <strong>Pneus d'hiver :</strong> c'est le moment de prendre rendez-vous pour le changement.",
      de: "❄️ <strong>Winterreifen:</strong> Jetzt einen Termin für den Reifenwechsel vereinbaren." },
    { id: "pneus-ete", from: 315, to: 430,
      fr: "☀️ <strong>Pneus d'été :</strong> pensez au changement dès que les températures remontent.",
      de: "☀️ <strong>Sommerreifen:</strong> Denken Sie an den Wechsel, sobald es wärmer wird." },
    { id: "vacances", from: 615, to: 715,
      fr: "🧳 <strong>Check-up vacances :</strong> faites contrôler votre voiture avant de partir.",
      de: "🧳 <strong>Ferien-Check:</strong> Lassen Sie Ihr Auto vor der Abreise prüfen." }
  ];
  var header = document.querySelector(".site-header");
  (function seasonBanner() {
    if (!header) return;
    var today = new Date(), md = (today.getMonth() + 1) * 100 + today.getDate();
    var season = null;
    SEASONS.forEach(function (s) { if (md >= s.from && md <= s.to) season = s; });
    if (!season) return;
    var key = "bandeau-" + season.id + "-" + today.getFullYear();
    try { if (localStorage.getItem(key)) return; } catch (e) {}
    var el = document.createElement("div");
    el.className = "season-banner";
    el.innerHTML = '<div class="container"><p>' + (DE ? season.de : season.fr) + '</p>' +
      '<a class="season-cta" href="tel:+41323552002">' + (DE ? "Anrufen →" : "Appeler →") + '</a>' +
      '<button type="button" aria-label="' + (DE ? "Schliessen" : "Fermer") + '">×</button></div>';
    header.parentNode.insertBefore(el, header.nextSibling);
    el.querySelector("button").addEventListener("click", function () {
      el.remove();
      try { localStorage.setItem(key, "1"); } catch (e) {}
    });
  })();

  /* ---------- Page voyants : ouvrir / fermer un voyant ---------- */
  var lights = document.querySelectorAll(".light");
  function openLight(light, scroll) {
    Array.prototype.forEach.call(lights, function (l) {
      var on = l === light && !l.classList.contains("open");
      l.classList.toggle("open", on);
      l.querySelector("button").setAttribute("aria-expanded", on ? "true" : "false");
    });
    if (scroll && light.classList.contains("open")) {
      setTimeout(function () { light.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, 50);
    }
  }
  Array.prototype.forEach.call(lights, function (light) {
    light.querySelector("button").addEventListener("click", function () {
      openLight(light, true);
      if (light.classList.contains("open") && history.replaceState) history.replaceState(null, "", "#" + light.id);
    });
  });
  if (lights.length && location.hash) {
    var target = document.getElementById(location.hash.slice(1));
    if (target && target.classList.contains("light")) openLight(target, true);
  }

  /* ---------- Rappel d'agenda (.ics + Google Agenda) ---------- */
  var reminder = document.getElementById("reminder-form");
  if (reminder) {
    var rType = document.getElementById("r-type"), rDate = document.getElementById("r-date"),
        rInterval = document.getElementById("r-interval"), rCar = document.getElementById("r-car"),
        rGoogle = document.getElementById("r-google"), rResult = document.getElementById("r-result");
    var LABELS = DE
      ? { service: "Service", expertise: "MFK", pneus: "Reifenwechsel" }
      : { service: "Service", expertise: "Expertise", pneus: "Changement de pneus" };

    var pad = function (n) { return ("0" + n).slice(-2); };
    var ymd = function (d) { return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()); };
    function dueDate() {
      if (!rDate.value) return null;
      var p = rDate.value.split("-"), months = parseInt(rInterval.value, 10);
      var d = new Date(+p[0], +p[1] - 1 + months, 1);
      var last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      d.setDate(Math.min(+p[2], last));
      return d;
    }
    function texts() {
      var car = rCar.value.trim();
      var title = LABELS[rType.value] + (car ? " · " + car : "") + " · Marotta Garage";
      var details = DE
        ? "Zeit für einen Termin bei Marotta Garage! Tel. " + PHONE + " · marottagarage.ch"
        : "C'est le moment de prendre rendez-vous chez Marotta Garage ! Tél. " + PHONE + " · marottagarage.ch";
      return { title: title, details: details, location: "Marotta Garage Sàrl, Hauptstrasse 35, 2552 Orpund" };
    }
    function updateGoogle() {
      var d = dueDate();
      if (!d) { rGoogle.setAttribute("href", "#"); return; }
      var next = new Date(d); next.setDate(d.getDate() + 1);
      var t = texts();
      rGoogle.href = "https://calendar.google.com/calendar/render?action=TEMPLATE" +
        "&text=" + encodeURIComponent(t.title) + "&dates=" + ymd(d) + "/" + ymd(next) +
        "&details=" + encodeURIComponent(t.details) + "&location=" + encodeURIComponent(t.location);
    }
    function showResult(d) {
      rResult.textContent = (DE ? "✅ Erinnerung für den " : "✅ Rappel prévu pour le ") +
        d.toLocaleDateString(DE ? "de-CH" : "fr-CH", { day: "numeric", month: "long", year: "numeric" }) +
        (DE ? " (Hinweis 2 Wochen vorher). Öffnen Sie die heruntergeladene Datei, um sie in Ihren Kalender einzutragen."
            : " (alerte 2 semaines avant). Ouvrez le fichier téléchargé pour l'ajouter à votre agenda.");
      rResult.classList.add("show");
    }
    var esc = function (s) { return s.replace(/\\/g, "\\\\").replace(/([,;])/g, "\\$1").replace(/\n/g, "\\n"); };

    rType.addEventListener("change", function () {
      var m = rType.options[rType.selectedIndex].getAttribute("data-months");
      if (m) rInterval.value = m;
      updateGoogle();
    });
    [rDate, rInterval, rCar].forEach(function (el) { el.addEventListener("input", updateGoogle); el.addEventListener("change", updateGoogle); });
    rGoogle.addEventListener("click", function (e) {
      var d = dueDate();
      if (!d) { e.preventDefault(); rDate.focus(); rDate.reportValidity && rDate.reportValidity(); return; }
      showResult(d);
    });
    reminder.addEventListener("submit", function (e) {
      e.preventDefault();
      var d = dueDate();
      if (!d) { rDate.focus(); return; }
      var next = new Date(d); next.setDate(d.getDate() + 1);
      var t = texts(), now = new Date();
      var stamp = now.getUTCFullYear() + pad(now.getUTCMonth() + 1) + pad(now.getUTCDate()) + "T" + pad(now.getUTCHours()) + pad(now.getUTCMinutes()) + "00Z";
      var ics = [
        "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Marotta Garage//Rappel//FR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
        "BEGIN:VEVENT",
        "UID:" + stamp + "-" + Math.random().toString(36).slice(2) + "@marottagarage.ch",
        "DTSTAMP:" + stamp,
        "DTSTART;VALUE=DATE:" + ymd(d), "DTEND;VALUE=DATE:" + ymd(next),
        "SUMMARY:" + esc(t.title), "DESCRIPTION:" + esc(t.details), "LOCATION:" + esc(t.location),
        "URL:https://marottagarage.ch/",
        "BEGIN:VALARM", "TRIGGER:-P14D", "ACTION:DISPLAY", "DESCRIPTION:" + esc(t.title), "END:VALARM",
        "END:VEVENT", "END:VCALENDAR"
      ].join("\r\n");
      var a = document.createElement("a");
      a.href = "data:text/calendar;charset=utf-8," + encodeURIComponent(ics);
      a.download = DE ? "erinnerung-marotta-garage.ics" : "rappel-marotta-garage.ics";
      document.body.appendChild(a); a.click(); a.remove();
      showResult(d);
    });
  }

  /* ---------- Demande de reprise : prépare un e-mail ---------- */
  var tradein = document.getElementById("tradein-form");
  if (tradein) {
    tradein.addEventListener("submit", function (e) {
      e.preventDefault();
      var lines = [];
      Array.prototype.forEach.call(tradein.querySelectorAll("input, select, textarea"), function (f) {
        var v = (f.value || "").trim();
        if (!v) return;
        var label = tradein.querySelector('label[for="' + f.id + '"]');
        lines.push((label ? label.textContent : f.name) + " : " + v);
      });
      var brand = document.getElementById("t-brand").value.trim(), model = document.getElementById("t-model").value.trim();
      var subject = (DE ? "Anfrage Eintauschschätzung · " : "Demande d'estimation de reprise · ") + brand + " " + model;
      var body = (DE ? "Guten Tag,\n\nich möchte eine Schätzung für den Eintausch meines Autos:\n\n"
                     : "Bonjour,\n\nJe souhaite une estimation de reprise pour ma voiture :\n\n") +
        lines.join("\n") + (DE ? "\n\n(Fotos im Anhang)\n\nFreundliche Grüsse" : "\n\n(Photos en pièces jointes)\n\nMeilleures salutations");
      location.href = "mailto:" + EMAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    });
  }

  /* ---------- Volant du logo : il tourne, et 3 clics = klaxon ---------- */
  var wheel = document.querySelector(".logo-wheel");
  var logo = document.querySelector(".logo");
  if (wheel && logo) {
    var clicks = 0, clickTimer = null, audio = null;
    function honk() {
      try {
        audio = audio || new (window.AudioContext || window.webkitAudioContext)();
        var t0 = audio.currentTime;
        [[0, 0.16], [0.24, 0.42]].forEach(function (b) {
          var g = audio.createGain(), f = audio.createBiquadFilter();
          f.type = "lowpass"; f.frequency.value = 1800;
          g.gain.setValueAtTime(0.0001, t0 + b[0]);
          g.gain.exponentialRampToValueAtTime(0.25, t0 + b[0] + 0.02);
          g.gain.setValueAtTime(0.25, t0 + b[1] - 0.03);
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + b[1]);
          [370, 466].forEach(function (hz) {
            var o = audio.createOscillator();
            o.type = "sawtooth"; o.frequency.value = hz;
            o.connect(f); o.start(t0 + b[0]); o.stop(t0 + b[1] + 0.02);
          });
          f.connect(g); g.connect(audio.destination);
        });
      } catch (e) {}
      var r = wheel.getBoundingClientRect(), bubble = document.createElement("span");
      bubble.className = "honk-bubble";
      bubble.textContent = DE ? "HUP HUP!" : "TUUT TUUT !";
      bubble.style.left = (r.right + 6) + "px";
      bubble.style.top = (r.top - 4) + "px";
      document.body.appendChild(bubble);
      setTimeout(function () { bubble.remove(); }, 1200);
      wheel.classList.remove("honk"); void wheel.offsetWidth; wheel.classList.add("honk");
    }
    wheel.addEventListener("click", function (e) {
      e.preventDefault();
      clicks++;
      clearTimeout(clickTimer);
      wheel.classList.remove("spin", "honk"); void wheel.offsetWidth; wheel.classList.add("spin");
      if (clicks >= 3) { clicks = 0; honk(); return; }
      var home = logo.getAttribute("href");
      clickTimer = setTimeout(function () {
        clicks = 0;
        if (location.pathname !== home) location.href = home;
      }, 650);
    });
  }

  /* ---------- Ombre de l'en-tête au défilement ---------- */
  if (header) {
    var onScroll = function () { header.classList.toggle("scrolled", window.scrollY > 10); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Apparition des blocs au défilement ---------- */
  // On n'anime que ce qui est encore sous l'écran au chargement, pour ne jamais
  // faire clignoter le haut de la page.
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.add("js");
  if (reduce || !("IntersectionObserver" in window)) return;

  var targets = document.querySelectorAll(
    ".section-head, .card, .split > *, .info-grid > *, .cta .container > *, .strengths li, .prose > *, .reviews > *"
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
    var index = Array.prototype.indexOf.call(el.parentNode.children, el);
    el.style.transitionDelay = Math.min(index, 4) * 0.1 + "s";
    el.classList.add("reveal");
    observer.observe(el);
  });

  // Filet de sécurité : si l'observateur rate un bloc, on l'affiche au défilement
  window.addEventListener("scroll", function () {
    var pending = document.querySelectorAll(".reveal:not(.in)");
    for (var i = 0; i < pending.length; i++) {
      if (pending[i].getBoundingClientRect().top < window.innerHeight) pending[i].classList.add("in");
    }
  }, { passive: true });
})();
