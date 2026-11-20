// ================================================
// ClimaVista - Week 3: Live weather with Open-Meteo
// Weather API: https://open-meteo.com/ (no API key)
// ================================================
"use strict";

let unit = "C";
let currentWeatherData = null;
let forecastWeatherData = [];
let lastSearchCity = "Pune";
let activeRequest = false;

const currentCard = document.querySelector("#current-weather-card");
const forecastTrack = document.querySelector(".forecast-track");
const searchForm = document.querySelector("#city-search");
const cityInput = document.querySelector("#city-input");
const searchFeedback = document.querySelector("#search-feedback");
const searchButton = document.querySelector("#search-button");
const unitButtons = document.querySelectorAll(".unit-button");

function toFahrenheit(c) { return Math.round((c * 9 / 5) + 32); }
function formatTemperature(celsius) {
    const value = unit === "C" ? Math.round(celsius) : toFahrenheit(celsius);
    return `${value}°${unit}`;
}

// WMO weather interpretation codes used by Open-Meteo.
function getWeatherDetails(code) {
    if (code === 0) return { condition: "Clear sky", key: "sunny", emoji: "☀️" };
    if ([1, 2].includes(code)) return { condition: code === 1 ? "Mainly clear" : "Partly cloudy", key: "cloudy", emoji: "🌤️" };
    if (code === 3) return { condition: "Overcast", key: "cloudy", emoji: "☁️" };
    if ([45, 48].includes(code)) return { condition: "Fog", key: "cloudy", emoji: "🌫️" };
    if ([51, 53, 55, 56, 57].includes(code)) return { condition: "Drizzle", key: "rain", emoji: "🌦️" };
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { condition: "Rain", key: "rain", emoji: "🌧️" };
    if ([71, 73, 75, 77, 85, 86].includes(code)) return { condition: "Snow", key: "cloudy", emoji: "❄️" };
    if ([95, 96, 99].includes(code)) return { condition: "Thunderstorm", key: "rain", emoji: "⛈️" };
    return { condition: "Variable conditions", key: "cloudy", emoji: "🌤️" };
}
function getWeatherEmoji(condition) {
    if (typeof condition === "number") return getWeatherDetails(condition).emoji;
    const normalized = String(condition).toLowerCase();
    if (normalized.includes("thunder") || normalized.includes("storm")) return "⛈️";
    if (normalized.includes("snow")) return "❄️";
    if (normalized.includes("rain") || normalized.includes("drizzle") || normalized.includes("shower")) return "🌧️";
    if (normalized.includes("fog")) return "🌫️";
    if (normalized.includes("cloud") || normalized.includes("overcast")) return "☁️";
    if (normalized.includes("sun") || normalized.includes("clear")) return "☀️";
    return "🌤️";
}
function getConditionTheme(key) {
    if (key === "rain" || key === "rainy") return "weather-rainy";
    if (key === "cloudy") return "weather-cloudy";
    return "weather-sunny";
}
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
}
function formatLocalDate(dateString, options) {
    // Noon avoids date shifts when parsing a date-only API value.
    return new Date(`${dateString}T12:00:00`).toLocaleDateString("en-IN", options);
}
function setFeedback(message, type = "info") {
    if (!searchFeedback) return;
    searchFeedback.textContent = message;
    searchFeedback.classList.add("visible");
    searchFeedback.dataset.state = type;
}
function clearFeedback() {
    if (!searchFeedback) return;
    searchFeedback.textContent = "";
    searchFeedback.classList.remove("visible");
    delete searchFeedback.dataset.state;
}
function setLoading(loading) {
    activeRequest = loading;
    if (searchButton) {
        searchButton.disabled = loading;
        searchButton.setAttribute("aria-busy", String(loading));
        const label = searchButton.querySelector("span:first-child");
        if (label) label.textContent = loading ? "Loading..." : "Search city";
    }
    if (cityInput) cityInput.disabled = loading;
}

// Indian state names are not consistently returned by city-focused geocoding.
// For a state search, use its capital as a clearly-labelled representative point.
const INDIA_STATE_CAPITALS = {
    "andhra pradesh": "Amaravati", "arunachal pradesh": "Itanagar",
    "assam": "Dispur", "bihar": "Patna", "chhattisgarh": "Raipur",
    "goa": "Panaji", "gujarat": "Gandhinagar", "haryana": "Chandigarh",
    "himachal pradesh": "Shimla", "jharkhand": "Ranchi", "karnataka": "Bengaluru",
    "kerala": "Thiruvananthapuram", "madhya pradesh": "Bhopal",
    "maharashtra": "Mumbai", "manipur": "Imphal", "meghalaya": "Shillong",
    "mizoram": "Aizawl", "nagaland": "Kohima", "odisha": "Bhubaneswar",
    "punjab": "Chandigarh", "rajasthan": "Jaipur", "sikkim": "Gangtok",
    "tamil nadu": "Chennai", "telangana": "Hyderabad", "tripura": "Agartala",
    "uttar pradesh": "Lucknow", "uttarakhand": "Dehradun", "west bengal": "Kolkata"
};
const INDIA_STATE_COORDINATES = {
    "goa": {
        capital: "Panaji",
        latitude: 15.4909,
        longitude: 73.8278
    },
    "kerala": {
        capital: "Thiruvananthapuram",
        latitude: 8.5241,
        longitude: 76.9366
    },
    "meghalaya": {
        capital: "Shillong",
        latitude: 25.5788,
        longitude: 91.8933
    },
    "maharashtra": {
        capital: "Mumbai",
        latitude: 19.0760,
        longitude: 72.8777
    },
    "karnataka": {
        capital: "Bengaluru",
        latitude: 12.9716,
        longitude: 77.5946
    },
    "tamil nadu": {
        capital: "Chennai",
        latitude: 13.0827,
        longitude: 80.2707
    },
    "west bengal": {
        capital: "Kolkata",
        latitude: 22.5726,
        longitude: 88.3639
    }
};
// API call 1: city name -> latitude/longitude.
async function getCoordinates(city) {
    const normalize = value =>
        String(value || "").trim().toLowerCase();

    const requestedName = normalize(city);

    // Handle supported Indian state searches directly.
    const state = INDIA_STATE_COORDINATES[requestedName];

    if (state) {
        return {
            name: state.capital,
            displayName: `${capitalizeWords(city)} (Capital: ${state.capital})`,
            displayRegion: `${state.capital}, ${capitalizeWords(city)}, India`,
            admin1: capitalizeWords(city),
            country: "India",
            latitude: state.latitude,
            longitude: state.longitude
        };
    }

    // Normal city geocoding.
    const url =
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=10&language=en&format=json`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Unable to look up this location. Please try again.");
    }

    const data = await response.json();

    if (!Array.isArray(data.results) || !data.results.length) {
        return null;
    }

    const exactMatches = data.results.filter(
        place => normalize(place.name) === requestedName
    );

    if (!exactMatches.length) {
        return null;
    }

    const place = exactMatches.sort(
        (a, b) => (b.population || 0) - (a.population || 0)
    )[0];

    return {
        ...place,
        displayName: capitalizeWords(place.name),
        displayRegion: [
            place.admin1,
            place.country
        ].filter(Boolean).map(capitalizeWords).join(", ")
    };
}

// API call 2: coordinates -> current conditions and seven-day forecast.
async function getWeather(lat, lon) {
    const params = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,pressure_msl,cloud_cover",
        hourly: "visibility,uv_index",
        daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset",
        timezone: "auto",
        forecast_days: "7"
    });
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
    if (!response.ok) throw new Error("Weather information is temporarily unavailable. Please try again.");
    return response.json();
}

function nearestHourlyValue(times, values, currentTime) {
    if (!Array.isArray(times) || !Array.isArray(values) || !times.length) return null;
    let bestIndex = 0;
    let bestDistance = Infinity;
    const target = new Date(currentTime).getTime();
    times.forEach((time, index) => {
        const distance = Math.abs(new Date(time).getTime() - target);
        if (distance < bestDistance) { bestDistance = distance; bestIndex = index; }
    });
    return values[bestIndex] ?? null;
}
function formatClockTime(value) {
    if (!value) return "--:--";
    // Open-Meteo returns sunrise/sunset in the selected location's local time.
    // Format the clock portion directly so the browser timezone cannot shift it.
    const match = String(value).match(/T(\d{2}):(\d{2})/);
    if (!match) return "--:--";
    let hour = Number(match[1]);
    const minute = match[2];
    const suffix = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${String(hour).padStart(2, "0")}:${minute} ${suffix}`;
}

// Convert Open-Meteo's JSON response into the same data shape used by renderers.
function mapWeatherResponse(place, data) {
    const current = data.current;
    const daily = data.daily;
    const currentDetails = getWeatherDetails(current.weather_code);
    const regionParts = [place.admin1, place.country].filter(Boolean);
    const region = regionParts.join(", ") || place.country || "Selected location";
    const currentVisibility = nearestHourlyValue(data.hourly?.time, data.hourly?.visibility, current.time);
    const currentUV = nearestHourlyValue(data.hourly?.time, data.hourly?.uv_index, current.time);

    const mappedCurrent = {
        city: place.displayName || place.name,
        region: place.displayRegion || region,
        latitude: Number(place.latitude),
        longitude: Number(place.longitude),
        temperature: current.temperature_2m,
        feelsLike: current.apparent_temperature,
        condition: currentDetails.condition,
        conditionKey: currentDetails.key,
        summary: `${currentDetails.condition} in ${place.name}${place.displayName && place.displayName !== place.name ? `, the capital weather point for ${place.displayName.split(" (Capital:")[0]}` : ""}. Weather information provided by Open-Meteo.`,
        humidity: current.relative_humidity_2m,
        windSpeed: Math.round(current.wind_speed_10m),
        uvIndex: currentUV == null ? "—" : Math.round(currentUV),
        uvLabel: currentUV == null ? "Unavailable" : currentUV >= 6 ? "High" : currentUV >= 3 ? "Moderate" : "Low",
        visibility: currentVisibility == null ? "—" : (currentVisibility / 1000).toFixed(1),
        pressure: current.pressure_msl == null ? "—" : Math.round(current.pressure_msl),
        cloudCover: current.cloud_cover == null ? "—" : current.cloud_cover,
        date: current.time.slice(0, 10)
    };
    const mappedDaily = daily.time.map((date, index) => {
        const details = getWeatherDetails(daily.weather_code[index]);
        return {
            date,
            condition: details.condition,
            conditionKey: details.key,
            high: daily.temperature_2m_max[index],
            low: daily.temperature_2m_min[index],
            rain: daily.precipitation_probability_max?.[index] ?? 0
        };
    });
    return {
        current: mappedCurrent,
        daily: mappedDaily,
        sunrise: daily.sunrise?.[0],
        sunset: daily.sunset?.[0],
        daylight: daily.sunrise?.[0] && daily.sunset?.[0] ? (new Date(daily.sunset[0]) - new Date(daily.sunrise[0])) / 60000 : null,
        rainChance: daily.precipitation_probability_max?.[0] ?? 0
    };
}

function formatCoordinate(value, axis) {
    if (value == null || !Number.isFinite(Number(value))) return "Coordinates unavailable";
    const number = Number(value);
    const direction = axis === "lat" ? (number >= 0 ? "N" : "S") : (number >= 0 ? "E" : "W");
    return `${Math.abs(number).toFixed(2)}° ${direction}`;
}

function renderCurrent(data) {
    if (!currentCard) return;
    const emoji = getWeatherEmoji(data.condition);
    const formattedDate = formatLocalDate(data.date, { weekday: "long", day: "numeric", month: "long" });
    currentCard.innerHTML = `
      <div class="current-main">
        <div class="current-location"><span class="location-pin" aria-hidden="true">⌖</span><div>
          <h3 id="current-city">${escapeHTML(data.city)}</h3>
          <p><span id="current-location">${escapeHTML(data.region)}</span><span aria-hidden="true">·</span><time id="weather-date">${formattedDate}</time></p>
          <p class="coordinate-line" id="current-coordinates" aria-label="City coordinates">${formatCoordinate(data.latitude, "lat")} · ${formatCoordinate(data.longitude, "lon")}</p>
        </div></div>
        <div class="temperature-row">
          <div class="temperature" id="current-temperature" aria-label="${formatTemperature(data.temperature)}"><span id="current-temperature-value">${formatTemperature(data.temperature)}</span></div>
          <div class="condition-block"><div class="weather-symbol" aria-hidden="true">${emoji}</div><div>
            <strong id="weather-condition">${escapeHTML(data.condition)}</strong><span id="feels-like">Feels like ${formatTemperature(data.feelsLike)}</span>
          </div></div>
        </div>
        <p class="weather-summary" id="weather-summary">${escapeHTML(data.summary)}</p>
      </div>
      <div class="current-art" aria-hidden="true"><div class="sun-glow"></div><div class="sun-disc"></div><div class="cloud cloud-one"></div><div class="cloud cloud-two"></div>
        <div class="art-caption">${data.conditionKey === "rain" ? "RAINY SKIES" : data.conditionKey === "cloudy" ? "CLOUDY SKIES" : "CLEAR SKIES"}<br><span>LIVE WEATHER SNAPSHOT</span></div>
      </div>
      <div class="current-bottom">
        <div class="current-stat"><span class="stat-icon" aria-hidden="true">💧</span><div><span>HUMIDITY</span><strong>${data.humidity}<small>%</small></strong></div></div>
        <div class="stat-divider" aria-hidden="true"></div>
        <div class="current-stat"><span class="stat-icon" aria-hidden="true">↗</span><div><span>WIND SPEED</span><strong>${data.windSpeed}<small> km/h</small></strong></div></div>
        <div class="stat-divider" aria-hidden="true"></div>
        <div class="current-stat"><span class="stat-icon" aria-hidden="true">☀️</span><div><span>UV INDEX</span><strong>${data.uvIndex}<small> · ${escapeHTML(data.uvLabel)}</small></strong></div></div>
        <div class="stat-divider" aria-hidden="true"></div>
        <div class="current-stat"><span class="stat-icon" aria-hidden="true">◷</span><div><span>VISIBILITY</span><strong>${data.visibility}<small> km</small></strong></div></div>
      </div>`;
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
        const dayName = formatLocalDate(day.date, { weekday: "short" }).toUpperCase();
        const dateLabel = formatLocalDate(day.date, { day: "numeric", month: "short" });
        return `<article class="forecast-card ${index === 0 ? "today" : ""}" role="listitem">
          <div class="forecast-day">${dayName}${index === 0 ? '<span class="today-label">TODAY</span>' : ""}</div>
          <div class="forecast-date">${dateLabel}</div><div class="forecast-icon" aria-hidden="true">${getWeatherEmoji(day.condition)}</div>
          <div class="forecast-condition">${escapeHTML(day.condition)}</div>
          <div class="forecast-temperatures"><strong>${formatTemperature(day.high)}</strong><span>${formatTemperature(day.low)}</span></div>
          <div class="forecast-rain">☂ <span>${day.rain}%</span></div></article>`;
    }).join("");
    const caption = document.querySelector("#forecast-caption");
    if (caption && days.length) caption.textContent = `${formatLocalDate(days[0].date, { weekday: "long" })} – ${formatLocalDate(days[days.length - 1].date, { weekday: "long" })}`;
}
function renderHighlights(data) {
    const sunrise = document.querySelector("#sunrise-value");
    const sunset = document.querySelector("#sunset-value");
    const rain = document.querySelector("#rain-chance-value");
    if (sunrise) sunrise.textContent = formatClockTime(data.sunrise);
    if (sunset) sunset.textContent = formatClockTime(data.sunset);
    if (rain) rain.innerHTML = `${data.rainChance}<small>%</small>`;
}
function renderExtraInsights(data) {
    const pressure = document.querySelector("#pressure-value");
    const clouds = document.querySelector("#cloud-cover-value");
    const daylight = document.querySelector("#daylight-value");
    const recommendation = document.querySelector("#weather-recommendation");
    const recommendationTitle = document.querySelector("#recommendation-title");
    const recommendationText = document.querySelector("#recommendation-text");
    if (pressure) pressure.innerHTML = data.current.pressure === "—" ? "—" : `${data.current.pressure}<small> hPa</small>`;
    if (clouds) clouds.innerHTML = data.current.cloudCover === "—" ? "—" : `${data.current.cloudCover}<small>%</small>`;
    if (daylight) {
        if (data.daylight == null || !Number.isFinite(data.daylight)) daylight.textContent = "—";
        else { const hours = Math.floor(data.daylight / 60); const minutes = Math.round(data.daylight % 60); daylight.textContent = `${hours}h ${minutes}m`; }
    }
    const now = new Date();
    const sunrise = data.sunrise ? new Date(data.sunrise) : null;
    const sunset = data.sunset ? new Date(data.sunset) : null;
    let progress = 0;
    if (sunrise && sunset && sunset > sunrise) progress = Math.max(0, Math.min(100, ((now - sunrise) / (sunset - sunrise)) * 100));
    const progressBar = document.querySelector("#daylight-progress");
    const progressLabel = document.querySelector("#daylight-progress-label");
    if (progressBar) progressBar.style.width = `${progress}%`;
    if (progressLabel) progressLabel.textContent = now < sunrise ? "Before sunrise" : now > sunset ? "After sunset" : `${Math.round(progress)}% of daylight elapsed`;

    let title = "Enjoy your day";
    let message = "Check the latest conditions before heading out.";
    const condition = String(data.current.condition).toLowerCase();
    if (condition.includes("rain") || condition.includes("drizzle") || condition.includes("thunder")) {
        title = "Keep an umbrella handy"; message = `Rain chance today is ${data.rainChance}%. Consider carrying an umbrella when going outside.`;
    } else if (Number(data.current.temperature) >= 32 || Number(data.current.uvIndex) >= 6) {
        title = "Stay cool and sun-safe"; message = "It may feel hot or sunny. Drink water, seek shade and consider sun protection.";
    } else if (Number(data.current.temperature) <= 12) {
        title = "Dress for cooler weather"; message = "Temperatures are on the cooler side. Consider carrying an extra layer.";
    } else if (Number(data.current.cloudCover) >= 80) {
        title = "Mostly cloudy conditions"; message = "Cloud cover is high. Keep an eye on changing conditions during the day.";
    }
    if (recommendationTitle) recommendationTitle.textContent = title;
    if (recommendationText) recommendationText.textContent = message;
    if (recommendation) recommendation.dataset.condition = condition;
}

function updateUnitButtons() {
    unitButtons.forEach(button => {
        const selected = button.dataset.unit === unit;
        button.classList.toggle("active", selected);
        button.setAttribute("aria-pressed", String(selected));
    });
}
function renderDashboard() {
    if (!currentWeatherData) return;
    renderCurrent(currentWeatherData);
    renderForecast(forecastWeatherData);
    updateUnitButtons();
}
unitButtons.forEach(button => button.addEventListener("click", () => {
    unit = button.dataset.unit;
    renderDashboard();
}));

function capitalizeWords(text) {
    return String(text || "")
        .toLowerCase()
        .replace(/\b[a-z]/g, char => char.toUpperCase());
}

async function searchCity(city) {
    if (activeRequest) return;
    setLoading(true);
    setFeedback(`Searching for ${city}...`, "loading");
    try {
        const place = await getCoordinates(city);
        if (!place) {
            setFeedback(`City not found: ${city}. Check the spelling and try another city.`, "error");
            return;
        }
        const rawWeather = await getWeather(place.latitude, place.longitude);
        console.log("Open-Meteo weather response:", rawWeather);
        const mapped = mapWeatherResponse(place, rawWeather);
        currentWeatherData = mapped.current;
        forecastWeatherData = mapped.daily;
        lastSearchCity = place.name;
        renderDashboard();
        renderHighlights(mapped);
        renderExtraInsights(mapped);
        setFeedback(`Live weather loaded for ${mapped.current.city}, ${mapped.current.region}.`, "success");
        const sourceTag = document.querySelector("#data-source-tag");
        if (sourceTag) sourceTag.innerHTML = '<span aria-hidden="true"></span> LIVE WEATHER';
        const miniNote = document.querySelector("#mini-note");
        if (miniNote) miniNote.textContent = "Powered by Open-Meteo";
        const hint = document.querySelector("#search-hint");
        if (hint) hint.innerHTML = '<span class="hint-spark" aria-hidden="true">✦</span> Live weather from Open-Meteo <span class="hint-separator">·</span> Updated when you search';
    } catch (error) {
        console.error("Weather request failed:", error);
        const message = error instanceof TypeError
            ? "Unable to connect. Please check your internet connection and try again."
            : (error.message || "Something went wrong. Please try again.");
        setFeedback(message, "error");
    } finally {
        setLoading(false);
    }
}
if (searchForm && cityInput) {
    searchForm.addEventListener("submit", event => {
        event.preventDefault();
        const city = cityInput.value.trim();
        if (!city) {
            setFeedback("Please enter a city name before searching.", "error");
            cityInput.focus();
            return;
        }
        searchCity(city);
    });
    cityInput.addEventListener("input", () => { if (searchFeedback?.classList.contains("visible")) clearFeedback(); });
}

// Dynamic greeting, date and day/night theme based on browser local time.
function updateTimeTheme(hour) {
    const classes = ["time-dawn", "time-morning", "time-afternoon", "time-evening", "time-night"];
    document.body.classList.remove(...classes);
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
    if (greetingElement) greetingElement.textContent = greeting;
    const formatted = now.toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long" }).toUpperCase();
    ["#current-date", "#topbar-date"].forEach(selector => {
        const element = document.querySelector(selector);
        if (element) { element.textContent = formatted; element.dateTime = now.toISOString(); }
    });
}
function updateClock() {
    const clock = document.querySelector("#current-time");
    if (clock) clock.textContent = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
}
const navLinks = document.querySelectorAll(".side-nav .nav-link");
const sections = [document.querySelector("#overview"), document.querySelector("#forecast"), document.querySelector("#highlights")].filter(Boolean);
function setActiveLink(sectionId) {
    navLinks.forEach(link => {
        const active = link.getAttribute("href") === `#${sectionId}`;
        link.classList.toggle("active", active);
        if (active) link.setAttribute("aria-current", "location"); else link.removeAttribute("aria-current");
    });
}
function updateActiveNavigation() {
    const position = window.scrollY + window.innerHeight * 0.3;
    let activeSection = "overview";
    sections.forEach(section => { if (section.getBoundingClientRect().top + window.scrollY <= position) activeSection = section.id; });
    setActiveLink(activeSection);
}
navLinks.forEach(link => link.addEventListener("click", () => setActiveLink(link.getAttribute("href").slice(1))));
window.addEventListener("scroll", updateActiveNavigation, { passive: true });
window.addEventListener("resize", updateActiveNavigation);

// Start with a live Pune forecast instead of the Week 2 sample data.
updateGreetingAndDate();
updateClock();
updateActiveNavigation();
searchCity("Pune");
setInterval(updateClock, 1000);
setInterval(updateGreetingAndDate, 60 * 1000);
