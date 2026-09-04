const slides = Array.from(document.querySelectorAll(".slide"));
const current = document.querySelector("#current");
const total = document.querySelector("#total");
const progress = document.querySelector("#progress-bar");
const prev = document.querySelector("#prev");
const next = document.querySelector("#next");

const STAGE_WIDTH = 1600;
const STAGE_HEIGHT = 900;

function fitStage() {
  const root = document.documentElement;
  const isCompact = window.innerWidth <= 860;

  if (isCompact) {
    root.style.setProperty("--stage-scale", "1");
    root.style.setProperty("--stage-visual-width", window.innerWidth + "px");
    root.style.setProperty("--stage-visual-height", window.innerHeight + "px");
    return;
  }

  const safeX = window.innerWidth < 1400 ? 40 : 64;
  const safeY = window.innerHeight < 820 ? 32 : 48;
  const availableWidth = Math.max(320, window.innerWidth - safeX * 2);
  const availableHeight = Math.max(240, window.innerHeight - safeY * 2);
  const scale = Math.min(availableWidth / STAGE_WIDTH, availableHeight / STAGE_HEIGHT);

  root.style.setProperty("--stage-scale", scale.toFixed(4));
  root.style.setProperty("--stage-visual-width", (STAGE_WIDTH * scale) + "px");
  root.style.setProperty("--stage-visual-height", (STAGE_HEIGHT * scale) + "px");
}
let index = 0;

total.textContent = String(slides.length);

function showSlide(target) {
  index = Math.max(0, Math.min(slides.length - 1, target));
  slides.forEach((slide, slideIndex) => {
    slide.classList.toggle("active", slideIndex === index);
  });
  current.textContent = String(index + 1);
  progress.style.width = `${((index + 1) / slides.length) * 100}%`;
  document.body.dataset.slide = String(index + 1);
}

function nextSlide() {
  showSlide(index + 1);
}

function prevSlide() {
  showSlide(index - 1);
}

prev.addEventListener("click", prevSlide);
next.addEventListener("click", nextSlide);

document.addEventListener("keydown", (event) => {
  if (["ArrowRight", "PageDown", " ", "Enter"].includes(event.key)) {
    event.preventDefault();
    nextSlide();
  }
  if (["ArrowLeft", "PageUp", "Backspace"].includes(event.key)) {
    event.preventDefault();
    prevSlide();
  }
  if (event.key === "Home") {
    event.preventDefault();
    showSlide(0);
  }
  if (event.key === "End") {
    event.preventDefault();
    showSlide(slides.length - 1);
  }
  if (event.key.toLowerCase() === "f") {
    event.preventDefault();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }
});

let touchStartX = 0;
let touchStartY = 0;

document.addEventListener("touchstart", (event) => {
  touchStartX = event.changedTouches[0].screenX;
  touchStartY = event.changedTouches[0].screenY;
}, { passive: true });

document.addEventListener("touchend", (event) => {
  const dx = event.changedTouches[0].screenX - touchStartX;
  const dy = event.changedTouches[0].screenY - touchStartY;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
    dx < 0 ? nextSlide() : prevSlide();
  }
}, { passive: true });

fitStage();
window.addEventListener("resize", fitStage);
document.addEventListener("fullscreenchange", fitStage);
showSlide(0);
