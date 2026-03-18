// PARTICLES CONFIGURATION (Star / Network Theme)
particlesJS("particles-js", {
  particles: {
    number: { value: 70, density: { enable: true, value_area: 800 } },
    color: { value: ["#00f3ff", "#ff5e00", "#0037ff"] },
    shape: { type: "circle" },
    opacity: { value: 0.6, random: true, anim: { enable: true, speed: 1, opacity_min: 0.1, sync: false } },
    size: { value: 3, random: true },
    line_linked: { enable: true, distance: 150, color: "#00f3ff", opacity: 0.2, width: 1 },
    move: { enable: true, speed: 1.5, direction: "none", random: false, straight: false, out_mode: "out", bounce: false }
  },
  interactivity: {
    detect_on: "canvas",
    events: {
      onhover: { enable: true, mode: "grab" },
      onclick: { enable: true, mode: "push" },
      resize: true
    },
    modes: {
      grab: { distance: 140, line_linked: { opacity: 0.6 } },
      push: { particles_nb: 4 }
    }
  },
  retina_detect: true
});

// CUSTOM CURSOR GLOW 
document.addEventListener("mousemove", (e) => {
  const cursor = document.getElementById("cursor");
  if(cursor) {
    cursor.style.left = e.clientX + "px";
    cursor.style.top = e.clientY + "px";
  }
});

// NAVBAR BLUR ON SCROLL
window.addEventListener("scroll", () => {
    const nav = document.getElementById("navbar");
    if(nav) {
      if (window.scrollY > 50) {
          nav.classList.add("scrolled");
      } else {
          nav.classList.remove("scrolled");
      }
    }
});

// COUNTDOWN TIMER (April 2, 2026)
const eventDate = new Date("April 2, 2026 09:00:00").getTime();

setInterval(() => {
  let now = new Date().getTime();
  let gap = eventDate - now;

  let d = Math.floor(gap / (1000 * 60 * 60 * 24));
  let h = Math.floor((gap % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  let m = Math.floor((gap % (1000 * 60 * 60)) / (1000 * 60));
  let s = Math.floor((gap % (1000 * 60)) / 1000);

  // Add leading zero
  d = d < 10 ? "0" + d : d;
  h = h < 10 ? "0" + h : h;
  m = m < 10 ? "0" + m : m;
  s = s < 10 ? "0" + s : s;

  if (document.getElementById("days")) {
      document.getElementById("days").innerText = d;
      document.getElementById("hours").innerText = h;
      document.getElementById("minutes").innerText = m;
      document.getElementById("seconds").innerText = s;
  }
}, 1000);
