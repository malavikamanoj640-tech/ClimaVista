// Week 1: this page intentionally uses sample weather data.
// Week 2 will move the dashboard content into JavaScript data objects.
const searchForm = document.querySelector("#city-search");
const cityInput = document.querySelector("#city-input");
const searchFeedback = document.querySelector("#search-feedback");

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const city = cityInput.value.trim();

  if (!city) {
    searchFeedback.textContent = "Please enter a city name to continue.";
    searchFeedback.classList.add("visible");
    cityInput.focus();
    return;
  }

  searchFeedback.textContent = `“${city}” noted — live city search will be added in Week 3.`;
  searchFeedback.classList.add("visible");
});
