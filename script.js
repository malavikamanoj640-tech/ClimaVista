// ==========================================
// ClimaVista - Week 2: JavaScript-rendered weather
// All temperatures are stored in Celsius.
// ==========================================

"use strict";

// Weather data is kept separate from the HTML presentation.
// Edit these values to change what appears after refreshing the page.
const sampleWeather = {
    current: {
        city: "Pune",
        region: "Maharashtra, India",
        temperature: 28,
        feelsLike: 30,
        condition: "Mostly sunny",
        conditionKey: "sunny",
        summary: "A bright and pleasant day. Great weather to get out and make the most of it.",
        humidity: 62,
        windSpeed: 12,
        uvIndex: 6,
        uvLabel: "High",
        visibility: 10,
        date: new Date().toISOString().slice(0, 10)
    },
    daily: [
        { date: dateOffset(0), condition: "Sunny", conditionKey: "sunny", high: 29, low: 19, rain: 0 },
        { date: dateOffset(1), condition: "Partly cloudy", conditionKey: "cloudy", high: 28, low: 18, rain: 5 },
        { date: dateOffset(2), condition: "Clear", conditionKey: "sunny", high: 30, low: 19, rain: 0 },
        { date: dateOffset(3), condition: "Cloudy", conditionKey: "cloudy", high: 27, low: 18, rain: 10 },
        { date: dateOffset(4), condition: "Light rain", conditionKey: "rain", high: 26, low: 19, rain: 35 },
        { date: dateOffset(5), condition: "Partly cloudy", conditionKey: "cloudy", high: 28, low: 20, rain: 10 },
        { date: dateOffset(6), condition: "Sunny", conditionKey: "sunny", high: 29, low: 19, rain: 0 }
    ]
};

// Create YYYY-MM-DD date strings relative to today.
function dateOffset(offset) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + offset);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

let unit = "C";

const currentCard = document.querySelector("#current-weather-card");
const forecastTrack = document.querySelector(".forecast-track");
const searchForm = document.querySelector("#city-search");
const cityInput = document.querySelector("#city-input");
const searchFeedback = document.querySelector("#search-feedback");
const unitButtons = document.querySelectorAll(".unit-button");

function toFahrenheit(c) {
    return Math.round((c * 9 / 5) + 32);
}

function formatTemperature(celsius) {
    const value = unit === "C" ? Math.round(celsius) : toFahrenheit(celsius);
    return `${value}°${unit}`;
}

function getWeatherEmoji(condition) {
    const normalized = String(condition).toLowerCase();

    if (normalized.includes("rain") || normalized.includes("shower")) return "🌧️";
    if (normalized.includes("thunder") || normalized.includes("storm")) return "⛈️";
    if (normalized.includes("snow")) return "❄️";
    if (normalized.includes("cloud")) return "☁️";
    if (normalized.includes("partly")) return "🌤️";
    if (normalized.includes("wind")) return "💨";
    if (normalized.includes("sun") || normalized.includes("clear")) return "☀️";

    return "🌤️";
}

function getConditionTheme(conditionKey) {
    if (conditionKey === "rain" || conditionKey === "rainy") return "weather-rainy";
    if (conditionKey === "cloudy") return "weather-cloudy";
    return "weather-sunny";
}

function renderCurrent(data) {
    if (!currentCard) return;

    const emoji = getWeatherEmoji(data.condition);
    const currentDate = new Date(`${data.date}T12:00:00`);
    const formattedDate = currentDate.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long"
    });

    currentCard.innerHTML = `
        <div class="current-main">
            <div class="current-location">
                <span class="location-pin" aria-hidden="true">⌖</span>
                <div>
                    <h3 id="current-city">${escapeHTML(data.city)}</h3>
                    <p>
                        <span id="current-location">${escapeHTML(data.region)}</span>
                        <span aria-hidden="true">·</span>
                        <time id="weather-date">${formattedDate}</time>
                    </p>
                </div>
            </div>

            <div class="temperature-row">
                <div class="temperature" id="current-temperature" aria-label="${formatTemperature(data.temperature)}">
                    <span id="current-temperature-value">${formatTemperature(data.temperature)}</span>
                </div>

                <div class="condition-block">
                    <div class="weather-symbol" aria-hidden="true">${emoji}</div>
                    <div>
                        <strong id="weather-condition">${escapeHTML(data.condition)}</strong>
                        <span id="feels-like">Feels like ${formatTemperature(data.feelsLike)}</span>
                    </div>
                </div>
            </div>

            <p class="weather-summary" id="weather-summary">${escapeHTML(data.summary)}</p>
        </div>

        <div class="current-art" aria-hidden="true">
            <div class="sun-glow"></div>
            <div class="sun-disc"></div>
            <div class="cloud cloud-one"></div>
            <div class="cloud cloud-two"></div>
            <div class="art-caption">
                ${data.conditionKey === "rain" ? "RAINY SKIES" : data.conditionKey === "cloudy" ? "CLOUDY SKIES" : "CLEAR SKIES"}<br>
                <span>YOUR WEATHER SNAPSHOT</span>
            </div>
        </div>

        <div class="current-bottom">
            <div class="current-stat">
                <span class="stat-icon" aria-hidden="true">💧</span>
                <div><span>HUMIDITY</span><strong>${data.humidity}<small>%</small></strong></div>
            </div>
            <div class="stat-divider" aria-hidden="true"></div>
            <div class="current-stat">
                <span class="stat-icon" aria-hidden="true">↗</span>
                <div><span>WIND SPEED</span><strong>${data.windSpeed}<small> km/h</small></strong></div>
            </div>
            <div class="stat-divider" aria-hidden="true"></div>
            <div class="current-stat">
                <span class="stat-icon" aria-hidden="true">☀️</span>
                <div><span>UV INDEX</span><strong>${data.uvIndex}<small> · ${escapeHTML(data.uvLabel)}</small></strong></div>
            </div>
            <div class="stat-divider" aria-hidden="true"></div>
            <div class="current-stat">
                <span class="stat-icon" aria-hidden="true">◷</span>
                <div><span>VISIBILITY</span><strong>${data.visibility}<small> km</small></strong></div>
            </div>
        </div>
    `;

    const theme = getConditionTheme(data.conditionKey);
    currentCard.classList.remove("weather-sunny", "weather-cloudy", "weather-rainy");
    currentCard.classList.add(theme);
    document.body.classList.remove("weather-page-sunny", "weather-page-cloudy", "weather-page-rainy");
    document.body.classList.add(theme.replace("weather-", "weather-page-"));

    const miniTemperature = document.querySelector("#mini-temperature");
    const miniIcon = document.querySelector("#mini-weather-icon");
    const miniCity = document.querySelector("#mini-city");

    if (miniTemperature) miniTemperature.textContent = formatTemperature(data.temperature);
    if (miniIcon) miniIcon.textContent = emoji;
    if (miniCity) miniCity.textContent = `${data.city}, ${data.region}`;
}

function renderForecast(days) {
    if (!forecastTrack) return;

    forecastTrack.innerHTML = days.map((day, index) => {
        const date = new Date(`${day.date}T12:00:00`);
        const dayName = date.toLocaleDateString("en-IN", { weekday: "short" }).toUpperCase();
        const dateLabel = date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
        const emoji = getWeatherEmoji(day.condition);

        return `
            <article class="forecast-card ${index === 0 ? "today" : ""}" role="listitem">
                <div class="forecast-day">
                    ${dayName}
                    ${index === 0 ? '<span class="today-label">TODAY</span>' : ""}
                </div>
                <div class="forecast-date">${dateLabel}</div>
                <div class="forecast-icon" aria-hidden="true">${emoji}</div>
                <div class="forecast-condition">${escapeHTML(day.condition)}</div>
                <div class="forecast-temperatures">
                    <strong>${formatTemperature(day.high)}</strong>
                    <span>${formatTemperature(day.low)}</span>
                </div>
                <div class="forecast-rain">☂ <span>${day.rain}%</span></div>
            </article>
        `;
    }).join("");

    const caption = document.querySelector("#forecast-caption");
    if (caption && days.length) {
        const first = new Date(`${days[0].date}T12:00:00`);
        const last = new Date(`${days[days.length - 1].date}T12:00:00`);
        const firstName = first.toLocaleDateString("en-IN", { weekday: "long" });
        const lastName = last.toLocaleDateString("en-IN", { weekday: "long" });
        caption.textContent = `${firstName} – ${lastName}`;
    }
}

// Escape user-entered text before inserting it into HTML.
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function renderDashboard() {
    renderCurrent(sampleWeather.current);
    renderForecast(sampleWeather.daily);
    updateUnitButtons();
}

function updateUnitButtons() {
    unitButtons.forEach((button) => {
        const selected = button.dataset.unit === unit;
        button.classList.toggle("active", selected);
        button.setAttribute("aria-pressed", String(selected));
    });
}

unitButtons.forEach((button) => {
    button.addEventListener("click", () => {
        unit = button.dataset.unit;
        renderDashboard();
    });
});

// Search is a local demonstration: it changes the city label while retaining
// the sample weather values. No external weather service is connected.
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

        sampleWeather.current.city = city;
        sampleWeather.current.region = "Sample weather preview";
        renderCurrent(sampleWeather.current);
        searchFeedback.textContent = `Showing sample weather for ${city}. Live weather data is not connected yet.`;
        searchFeedback.classList.add("visible");
    });

    cityInput.addEventListener("input", () => {
        if (cityInput.value.trim() && searchFeedback.classList.contains("visible")) {
            searchFeedback.textContent = "";
            searchFeedback.classList.remove("visible");
        }
    });
}

// Dynamic greeting, date, and sky appearance based on the local time.
function updateTimeTheme(hour) {
    const timeThemes = ["time-dawn", "time-morning", "time-afternoon", "time-evening", "time-night"];
    document.body.classList.remove(...timeThemes);

    let theme = "time-night";
    if (hour >= 5 && hour < 7) theme = "time-dawn";
    else if (hour >= 7 && hour < 11) theme = "time-morning";
    else if (hour >= 11 && hour < 16) theme = "time-afternoon";
    else if (hour >= 16 && hour < 19) theme = "time-evening";

    document.body.classList.add(theme);
}

function updateGreetingAndDate() {
    const now = new Date();
    const hour = now.getHours();
    updateTimeTheme(hour);
    let greeting = "Good night";

    if (hour >= 5 && hour < 12) greeting = "Good morning";
    else if (hour >= 12 && hour < 17) greeting = "Good afternoon";
    else if (hour >= 17 && hour < 21) greeting = "Good evening";

    const greetingElement = document.querySelector("#greeting-text");
    const dateElement = document.querySelector("#current-date");

    if (greetingElement) greetingElement.textContent = greeting;
    if (dateElement) {
        dateElement.textContent = now.toLocaleDateString("en-IN", {
            weekday: "long", day: "2-digit", month: "long"
        }).toUpperCase();
        dateElement.dateTime = now.toISOString();
    }
}

// Active sidebar navigation.
const navLinks = document.querySelectorAll(".side-nav .nav-link");
const sections = [
    document.querySelector("#overview"),
    document.querySelector("#forecast"),
    document.querySelector("#highlights")
].filter(Boolean);

function setActiveLink(sectionId) {
    navLinks.forEach((link) => {
        const active = link.getAttribute("href") === `#${sectionId}`;
        link.classList.toggle("active", active);
        if (active) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
    });
}

navLinks.forEach((link) => {
    link.addEventListener("click", () => setActiveLink(link.getAttribute("href").slice(1)));
});

function updateActiveNavigation() {
    const position = window.scrollY + window.innerHeight * 0.3;
    let activeSection = "overview";
    sections.forEach((section) => {
        if (section.getBoundingClientRect().top + window.scrollY <= position) {
            activeSection = section.id;
        }
    });
    setActiveLink(activeSection);
}

window.addEventListener("scroll", updateActiveNavigation, { passive: true });
window.addEventListener("resize", updateActiveNavigation);

// Initial render.
renderDashboard();
updateGreetingAndDate();
updateActiveNavigation();


// LIVE DIGITAL CLOCK
function updateClock() {
    const clockElement = document.getElementById("current-time");

    if (!clockElement) return;

    const now = new Date();

    clockElement.textContent = now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
    });
}

// Update immediately and every second
updateClock();
setInterval(updateClock, 1000);
