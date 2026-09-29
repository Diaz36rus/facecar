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

function readProgress() {
  const max = document.documentElement.scrollHeight - innerHeight;
  roll.style.setProperty("--read", max > 0 ? String(Math.min(1, scrollY / max)) : "0");
}

markVisible();
readProgress();
requestAnimationFrame(markVisible);
addEventListener("scroll", markVisible, { passive: true });
addEventListener("scroll", readProgress, { passive: true });
addEventListener("resize", readProgress);
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

const face = document.getElementById("hero-face");
const slotIn = document.querySelector(".logo-slot-in");
const slot = document.querySelector(".logo-slot");
const lamp = document.querySelector(".lamp");

function setLit(on, ignite = false) {
  face.classList.toggle("is-lit", on);
  face.classList.toggle("is-dark", !on);
  face.classList.toggle("is-relit", on && ignite);
  if (slot) slot.setAttribute("aria-pressed", String(on));
}

function placeLight() {
  if (!face || !slot) return;
  const car = slot.getBoundingClientRect();
  const box = (face.querySelector(".headlight") || face).getBoundingClientRect();
  face.style.setProperty("--car-x", `${car.left + car.width / 2 - box.left}px`);
}

placeLight();
window.addEventListener("resize", placeLight);

if (slot) {
  slot.addEventListener("click", () => {
    placeLight();
    setLit(face.classList.contains("is-dark"), true);
  });
  slot.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    slot.click();
  });
}

if (!reduced && slotIn && slot) {
  slotIn.addEventListener("animationend", (event) => {
    if (event.animationName !== "logo-drive") return;
    slotIn.style.animation = "none";
    slotIn.style.transform = "none";
  });
  slot.addEventListener("animationend", (event) => {
    if (event.animationName !== "logo-open") return;
    slot.style.overflow = "visible";
    placeLight();
  });
  if (lamp) {
    lamp.addEventListener("animationend", (event) => {
      if (event.animationName !== "lamp-reveal") return;
      if (!face.classList.contains("is-dark")) setLit(true);
    });
  }
} else if (reduced) {
  setLit(true);
}

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

let dragMoved = false;

track.addEventListener("pointerdown", (event) => {
  if (event.pointerType !== "mouse" || event.button !== 0) return;
  event.preventDefault();
  dragToken += 1;
  dragging = true;
  dragMoved = false;
  startX = event.clientX;
  startScroll = track.scrollLeft;
  track.classList.add("is-drag");
  track.setPointerCapture(event.pointerId);
});

track.addEventListener("pointermove", (event) => {
  if (!dragging) return;
  event.preventDefault();
  if (Math.abs(event.clientX - startX) > 6) dragMoved = true;
  track.scrollLeft = startScroll - (event.clientX - startX);
});

function endDrag() {
  if (!dragging) return;
  dragging = false;
  settle();
}

track.addEventListener("pointerup", endDrag);
track.addEventListener("pointercancel", endDrag);

const toastEl = document.getElementById("toast");
let toastTimer = 0;

function toast(text) {
  if (!toastEl) return;
  (document.querySelector("dialog[open]") || document.body).append(toastEl);
  toastEl.textContent = text;
  toastEl.classList.add("is-on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("is-on"), 2800);
}

function copyText(text) {
  const copied = copyFallback(text);
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text).then(() => true, () => copied);
  }
  return Promise.resolve(copied);
}

function copyFallback(text) {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.cssText = "position:fixed;opacity:0;pointer-events:none";
  const active = document.activeElement;
  (document.querySelector("dialog[open]") || document.body).append(area);
  area.focus({ preventScroll: true });
  area.select();
  area.setSelectionRange(0, text.length);
  let ok = false;
  try { ok = document.execCommand("copy"); } catch { ok = false; }
  area.remove();
  if (active && typeof active.focus === "function") active.focus({ preventScroll: true });
  return ok;
}

function openDialog(dialog) {
  if (!dialog || typeof dialog.showModal !== "function") return false;
  closeMenu();
  if (!dialog.open) dialog.showModal();
  document.body.classList.add("lock");
  return true;
}

document.querySelectorAll("dialog").forEach((dialog) => {
  dialog.addEventListener("close", () => {
    if (!document.querySelector("dialog[open]")) document.body.classList.remove("lock");
  });
  dialog.querySelectorAll("[data-close]").forEach((btn) => btn.addEventListener("click", () => dialog.close()));
});

const order = document.getElementById("order");
const orderForm = document.getElementById("order-form");
const chipsBox = document.getElementById("order-chips");
const sendWa = document.getElementById("send-wa");
const sendTg = document.getElementById("send-tg");
const ORDER_KEY = "facecar-order";

if (order && orderForm && chipsBox) {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(ORDER_KEY)) || {}; } catch { saved = {}; }
  const picked = new Set(Array.isArray(saved.services) ? saved.services : []);

  document.querySelectorAll(".band h2").forEach((heading) => {
    const name = heading.textContent.trim();
    const chip = document.createElement("label");
    chip.className = "chip";
    const box = document.createElement("input");
    box.type = "checkbox";
    box.name = "service";
    box.value = name;
    box.checked = picked.has(name);
    const text = document.createElement("span");
    text.textContent = name;
    chip.append(box, text);
    chipsBox.append(chip);
  });

  ["name", "phone", "car", "note"].forEach((field) => {
    orderForm.elements[field].value = saved[field] || "";
  });

  const formatPhone = (value) => {
    let digits = value.replace(/\D/g, "");
    if (digits.length === 11 && digits[0] === "8") digits = "7" + digits.slice(1);
    if (digits.length === 10 && digits[0] === "9") digits = "7" + digits;
    if (digits.length !== 11 || digits[0] !== "7") return value.trim();
    return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9)}`;
  };

  const phoneInput = orderForm.elements.phone;
  phoneInput.addEventListener("blur", () => {
    phoneInput.value = formatPhone(phoneInput.value);
    syncOrder();
  });

  const orderData = () => {
    const data = new FormData(orderForm);
    const field = (key) => String(data.get(key) || "").trim();
    return {
      services: data.getAll("service").map(String),
      name: field("name"),
      phone: formatPhone(field("phone")),
      car: field("car"),
      note: field("note"),
    };
  };

  const orderText = () => {
    const { services, name, phone, car, note } = orderData();
    const lines = ["Здравствуйте! Заявка с сайта FaceCar."];
    if (name) lines.push(`Имя: ${name}`);
    if (phone) lines.push(`Телефон: ${phone}`);
    if (car) lines.push(`Автомобиль: ${car}`);
    if (services.length) lines.push(`Услуги: ${services.join(", ")}`);
    if (note) lines.push(`Комментарий: ${note}`);
    return lines.join("\n");
  };

  const syncOrder = () => {
    const text = encodeURIComponent(orderText());
    sendWa.href = "https://wa.me/79202202000?text=" + text;
    sendTg.href = "https://t.me/+79202202000?text=" + text;
    try { localStorage.setItem(ORDER_KEY, JSON.stringify(orderData())); } catch { /* private mode */ }
  };

  orderForm.addEventListener("input", syncOrder);
  orderForm.addEventListener("submit", (event) => event.preventDefault());

  sendTg.addEventListener("click", () => {
    copyText(orderText()).then((ok) => {
      if (ok) toast("Текст заявки появится в чате. Если нет — он скопирован, просто вставьте");
    });
  });

  order.addEventListener("click", (event) => {
    if (event.target === order) order.close();
  });

  document.querySelectorAll("[data-order]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const service = btn.dataset.order;
      if (service) {
        orderForm.querySelectorAll("input[name='service']").forEach((box) => {
          if (box.value === service) box.checked = true;
        });
      }
      syncOrder();
      if (!openDialog(order)) location.href = sendWa.href;
    });
  });

  syncOrder();
}

const lightbox = document.getElementById("lightbox");
const shots = [...track.querySelectorAll(".card")];

if (lightbox && shots.length) {
  const lbImg = document.getElementById("lb-img");
  const lbCap = document.getElementById("lb-cap");
  const lbCount = document.getElementById("lb-count");
  const pad = (n) => String(n).padStart(2, "0");
  let current = 0;

  const show = (index) => {
    current = (index + shots.length) % shots.length;
    const img = shots[current].querySelector("img");
    const caption = shots[current].querySelector("p");
    lbImg.src = img.currentSrc || img.src;
    lbImg.alt = img.alt;
    lbCap.replaceChildren(...(caption ? [...caption.cloneNode(true).childNodes] : []));
    lbCount.textContent = `${pad(current + 1)} / ${pad(shots.length)}`;
  };

  shots.forEach((card, index) => {
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    const title = card.querySelector("b");
    card.setAttribute("aria-label", `Открыть фото${title ? ": " + title.textContent : ""}`);
    card.dataset.index = String(index);
    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      show(index);
      openDialog(lightbox);
    });
  });

  track.addEventListener("click", (event) => {
    if (dragMoved) {
      dragMoved = false;
      return;
    }
    let card = event.target.closest(".card");
    if (!card && event.clientX) card = document.elementFromPoint(event.clientX, event.clientY)?.closest(".card");
    if (!card) return;
    show(Number(card.dataset.index));
    openDialog(lightbox);
  });

  lightbox.querySelector(".lb-prev").addEventListener("click", () => show(current - 1));
  lightbox.querySelector(".lb-next").addEventListener("click", () => show(current + 1));

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox || event.target.classList.contains("lb-stage")) lightbox.close();
  });

  lightbox.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") show(current - 1);
    if (event.key === "ArrowRight") show(current + 1);
  });

  let swipeX = null;
  lightbox.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "mouse") swipeX = event.clientX;
  });
  lightbox.addEventListener("pointerup", (event) => {
    if (swipeX === null) return;
    const dx = event.clientX - swipeX;
    swipeX = null;
    if (Math.abs(dx) > 45) show(current + (dx < 0 ? 1 : -1));
  });
}

const openNow = document.getElementById("open-now");

const hourRows = [...document.querySelectorAll(".hours > div")];
const WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_NAMES = ["в воскресенье", "в понедельник", "во вторник", "в среду", "в четверг", "в пятницу", "в субботу"];
const SCHEDULE = [null, [9, 19], [9, 19], [9, 19], [9, 19], [9, 19], [9, 15]];
const hh = (h) => `${String(h).padStart(2, "0")}:00`;

function updateOpenNow() {
  if (!openNow) return;
  let day;
  let now;
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Moscow",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date());
    const get = (type) => parts.find((part) => part.type === type).value;
    day = WEEK.indexOf(get("weekday"));
    now = Number(get("hour")) * 60 + Number(get("minute"));
  } catch {
    return;
  }
  if (day < 0) return;

  hourRows.forEach((row, index) => {
    const rowDays = index === 0 ? [1, 2, 3, 4, 5] : index === 1 ? [6] : [0];
    row.classList.toggle("is-today", rowDays.includes(day));
  });

  const today = SCHEDULE[day];
  const isOpen = Boolean(today) && now >= today[0] * 60 && now < today[1] * 60;
  let text;
  if (isOpen) {
    text = `Сейчас открыто, до ${hh(today[1])}`;
  } else if (today && now < today[0] * 60) {
    text = `Сейчас закрыто, откроемся в ${hh(today[0])}`;
  } else {
    let ahead = 1;
    while (!SCHEDULE[(day + ahead) % 7]) ahead += 1;
    const next = (day + ahead) % 7;
    const when = ahead === 1 ? "завтра" : DAY_NAMES[next];
    text = `Сейчас закрыто, откроемся ${when} в ${hh(SCHEDULE[next][0])}`;
  }
  openNow.classList.toggle("is-open", isOpen);
  openNow.querySelector("span").textContent = text;
  openNow.hidden = false;
}

updateOpenNow();
setInterval(updateOpenNow, 60000);
