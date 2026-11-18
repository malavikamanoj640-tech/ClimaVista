// ==========================================
// ClimaVista - Week 1 JavaScript
// Static dashboard interactions and date display
// ==========================================

"use strict";

// ==========================================
// City Search Preview
// ==========================================

const searchForm = document.querySelector("#city-search");
const cityInput = document.querySelector("#city-input");
const searchFeedback = document.querySelector("#search-feedback");

if (searchForm && cityInput && searchFeedback) {
    searchForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const city = cityInput.value.trim();

        if (!city) {
            searchFeedback.textContent = "Please enter a city name.";
            searchFeedback.classList.add("visible");
            cityInput.focus();
            return;
        }

        // Week 1 uses a front-end preview only. No weather API is connected.
        searchFeedback.textContent =
            `Search preview received for "${city}". Live weather search will be added in a later week.`;

        searchFeedback.classList.add("visible");
    });

    cityInput.addEventListener("input", () => {
        if (cityInput.value.trim() && searchFeedback.classList.contains("visible")) {
            searchFeedback.classList.remove("visible");
            searchFeedback.textContent = "";
        }
    });
}

// ==========================================
// Dynamic Greeting and Date
// ==========================================

function updateGreetingAndDate() {
    const now = new Date();
    const greetingElement = document.querySelector("#greeting-text");
    const dateElement = document.querySelector("#current-date");
    const weatherDateElement = document.querySelector("#weather-date");

    const hour = now.getHours();
    let greeting = "Good night";

    if (hour >= 5 && hour < 12) {
        greeting = "Good morning";
    } else if (hour >= 12 && hour < 17) {
        greeting = "Good afternoon";
    } else if (hour >= 17 && hour < 21) {
        greeting = "Good evening";
    }

    if (greetingElement) {
        greetingElement.textContent = greeting;
    }

    if (dateElement) {
        const formattedDate = new Intl.DateTimeFormat("en-IN", {
            weekday: "long",
            day: "2-digit",
            month: "long"
        }).format(now);

        dateElement.textContent = formattedDate.toUpperCase();
        dateElement.dateTime = now.toISOString();
    }

    if (weatherDateElement) {
        const formattedWeatherDate = new Intl.DateTimeFormat("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long"
        }).format(now);

        weatherDateElement.textContent = formattedWeatherDate;
        weatherDateElement.dateTime = now.toISOString();
    }
}

// Keep the seven forecast day labels aligned with the current calendar date.
// Temperatures and conditions remain illustrative Week 1 sample data.
function updateForecastDayLabels() {
    const forecastDays = document.querySelectorAll("[data-forecast-day]");
    const today = new Date();

    forecastDays.forEach((dayElement, index) => {
        const forecastDate = new Date(today);
        forecastDate.setDate(today.getDate() + index);

        const dayLabel = new Intl.DateTimeFormat("en", {
            weekday: "short"
        }).format(forecastDate).toUpperCase();

        // Preserve the TODAY badge inside the first forecast card.
        const firstTextNode = Array.from(dayElement.childNodes).find(
            (node) => node.nodeType === Node.TEXT_NODE
        );

        if (firstTextNode) {
            firstTextNode.nodeValue = `${dayLabel} `;
        } else {
            dayElement.textContent = dayLabel;
        }
    });

    const caption = document.querySelector("#forecast-caption");
    if (caption && forecastDays.length > 0) {
        const lastDate = new Date(today);
        lastDate.setDate(today.getDate() + forecastDays.length - 1);

        const firstDay = new Intl.DateTimeFormat("en", {
            weekday: "long"
        }).format(today);

        const lastDay = new Intl.DateTimeFormat("en", {
            weekday: "long"
        }).format(lastDate);

        caption.textContent = `${firstDay} – ${lastDay}`;
    }
}

// ==========================================
// Active Sidebar Navigation
// ==========================================

const navLinks = document.querySelectorAll(".side-nav .nav-link");
const sections = [
    document.querySelector("#overview"),
    document.querySelector("#forecast"),
    document.querySelector("#highlights")
].filter(Boolean);

function setActiveLink(sectionId) {
    navLinks.forEach((link) => {
        const isActive = link.getAttribute("href") === `#${sectionId}`;

        link.classList.toggle("active", isActive);

        if (isActive) {
            link.setAttribute("aria-current", "location");
        } else {
            link.removeAttribute("aria-current");
        }
    });
}

navLinks.forEach((link) => {
    link.addEventListener("click", () => {
        const targetId = link.getAttribute("href").slice(1);
        setActiveLink(targetId);
    });
});

function updateActiveNavigation() {
    const scrollPosition = window.scrollY + window.innerHeight * 0.30;
    let activeSection = "overview";

    sections.forEach((section) => {
        const sectionTop = section.getBoundingClientRect().top + window.scrollY;

        if (sectionTop <= scrollPosition) {
            activeSection = section.id;
        }
    });

    setActiveLink(activeSection);
}

window.addEventListener("scroll", updateActiveNavigation, { passive: true });
window.addEventListener("resize", updateActiveNavigation);

// ==========================================
// Initialize dashboard
// ==========================================

updateGreetingAndDate();
updateForecastDayLabels();
updateActiveNavigation();
