
// ==========================================
// WeatherNow - Week 1 JavaScript
// ==========================================

// City search elements
const searchForm = document.querySelector("#city-search");
const cityInput = document.querySelector("#city-input");
const searchFeedback = document.querySelector("#search-feedback");

// Sidebar navigation elements
const navLinks = document.querySelectorAll(".side-nav .nav-link");

// Navigation sections
const sections = [
  document.querySelector("#overview"),
  document.querySelector("#forecast"),
  document.querySelector("#highlights")
];

// ==========================================
// City Search Preview
// ==========================================

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const city = cityInput.value.trim();

  if (!city) {
    searchFeedback.textContent =
      "Please enter a city name to continue.";

    searchFeedback.classList.add("visible");
    cityInput.focus();
    return;
  }

  searchFeedback.textContent =
    `“${city}” noted — live city search will be added in Week 3.`;

  searchFeedback.classList.add("visible");
});

// ==========================================
// Active Sidebar Navigation
// ==========================================

function setActiveLink(sectionId) {
  navLinks.forEach((link) => {
    const isActive =
      link.getAttribute("href") === `#${sectionId}`;

    link.classList.toggle("active", isActive);

    if (isActive) {
      link.setAttribute("aria-current", "location");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

// Highlight the clicked navigation item immediately
navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    const sectionId = link.getAttribute("href").slice(1);
    setActiveLink(sectionId);
  });
});

// Detect the section currently being viewed
function updateActiveNavigation() {
  const scrollPosition =
    window.scrollY + window.innerHeight * 0.30;

  let activeSection = "overview";

  sections.forEach((section) => {
    if (!section) return;

    const sectionTop =
      section.getBoundingClientRect().top + window.scrollY;

    if (sectionTop <= scrollPosition) {
      activeSection = section.id;
    }
  });

  setActiveLink(activeSection);
}

// Update navigation while scrolling
window.addEventListener("scroll", updateActiveNavigation, {
  passive: true
});

window.addEventListener("resize", updateActiveNavigation);

// Initial navigation state
updateActiveNavigation();



/* ==========================================
   Dynamic Time-Based Greeting
========================================== */

function updateGreeting() {
  const greetingText = document.querySelector("#greeting-text");
  const currentHour = new Date().getHours();

  let greeting;

  if (currentHour >= 5 && currentHour < 12) {
    greeting = "Good morning";
  } else if (currentHour >= 12 && currentHour < 17) {
    greeting = "Good afternoon";
  } else if (currentHour >= 17 && currentHour < 21) {
    greeting = "Good evening";
  } else {
    greeting = "Good night";
  }

  greetingText.textContent = greeting;
}

updateGreeting();
