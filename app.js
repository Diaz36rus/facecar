document.documentElement.classList.add("js");

const roll = document.getElementById("roll");
const toggle = roll.querySelector(".roll-toggle");
const peel = document.querySelector(".peel");
const links = [...roll.querySelectorAll("a[href^='#']")];
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const spy = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const id = "#" + entry.target.id;
    links.forEach((link) => link.classList.toggle("is-on", link.getAttribute("href") === id));
  });
}, { rootMargin: "0px 0px -60% 0px" });

document.querySelectorAll("main section, .hero").forEach((section) => {
  if (section.id) spy.observe(section);
});

const reveal = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add("is-in");
  });
}, { threshold: 0.28 });

document.querySelectorAll(".band").forEach((band) => reveal.observe(band));

function markVisible() {
  document.querySelectorAll(".band").forEach((band) => {
    const box = band.getBoundingClientRect();
    if (box.top < innerHeight * 0.9 && box.bottom > innerHeight * 0.1) band.classList.add("is-in");
  });
}

markVisible();
requestAnimationFrame(markVisible);
addEventListener("scroll", markVisible, { passive: true });
addEventListener("load", markVisible);

function closeMenu() {
  roll.classList.remove("is-open");
  toggle.setAttribute("aria-expanded", "false");
  toggle.textContent = "меню";
  document.body.classList.remove("lock");
}

toggle.addEventListener("click", () => {
  const open = roll.classList.toggle("is-open");
  toggle.setAttribute("aria-expanded", String(open));
  toggle.textContent = open ? "закрыть" : "меню";
  document.body.classList.toggle("lock", open);
  if (open) roll.querySelector("#roll-nav a").focus();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});

links.forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    closeMenu();
    if (reduced) {
      target.scrollIntoView();
      return;
    }
    peel.classList.remove("go");
    void peel.offsetWidth;
    peel.classList.add("go");
    window.setTimeout(() => target.scrollIntoView(), 300);
  });
});

const slotIn = document.querySelector(".logo-slot-in");
const slot = document.querySelector(".logo-slot");
if (!reduced && slotIn && slot) {
  slotIn.addEventListener("animationend", (event) => {
    if (event.animationName !== "logo-drive") return;
    slotIn.style.animation = "none";
    slotIn.style.transform = "none";
  });
  slot.addEventListener("animationend", (event) => {
    if (event.animationName !== "logo-open") return;
    slot.style.overflow = "visible";
  });
}

const hero = document.querySelector(".hero");
hero.addEventListener("pointermove", (event) => {
  const box = hero.getBoundingClientRect();
  hero.style.setProperty("--mx", ((event.clientX - box.left) / box.width) * 100 + "%");
  hero.style.setProperty("--my", ((event.clientY - box.top) / box.height) * 100 + "%");
});

const track = document.getElementById("track");
const bay = document.querySelector(".bay");
let dragging = false;
let startX = 0;
let startScroll = 0;
let dragToken = 0;

function meter() {
  const max = track.scrollWidth - track.clientWidth;
  bay.style.setProperty("--p", max > 0 ? String(track.scrollLeft / max) : "0");
}

track.addEventListener("scroll", meter, { passive: true });
meter();

track.addEventListener("dragstart", (event) => event.preventDefault());

function settle() {
  const cards = [...track.querySelectorAll(".card")];
  const edge = track.getBoundingClientRect().left;
  let best = cards[0];
  let bestDist = Infinity;
  cards.forEach((card) => {
    const dist = Math.abs(card.getBoundingClientRect().left - edge);
    if (dist < bestDist) {
      bestDist = dist;
      best = card;
    }
  });
  if (!best) {
    track.classList.remove("is-drag");
    return;
  }
  const left = best.getBoundingClientRect().left - edge + track.scrollLeft;
  const token = dragToken;
  if (Math.abs(track.scrollLeft - left) < 2) {
    track.classList.remove("is-drag");
    return;
  }
  const finish = () => {
    if (token !== dragToken) return;
    if (Math.abs(track.scrollLeft - left) > 2) return;
    track.classList.remove("is-drag");
    track.removeEventListener("scroll", finish);
  };
  track.addEventListener("scroll", finish);
  track.scrollTo({ left, behavior: "smooth" });
}

track.addEventListener("pointerdown", (event) => {
  if (event.pointerType !== "mouse" || event.button !== 0) return;
  event.preventDefault();
  dragToken += 1;
  dragging = true;
  startX = event.clientX;
  startScroll = track.scrollLeft;
  track.classList.add("is-drag");
  track.setPointerCapture(event.pointerId);
});

track.addEventListener("pointermove", (event) => {
  if (!dragging) return;
  event.preventDefault();
  track.scrollLeft = startScroll - (event.clientX - startX);
});

function endDrag() {
  if (!dragging) return;
  dragging = false;
  settle();
}

track.addEventListener("pointerup", endDrag);
track.addEventListener("pointercancel", endDrag);
