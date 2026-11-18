# WeatherNow — City Weather Dashboard

A polished, responsive weather dashboard interface created for **SkillMe Internship · Web Development · Week 1**.

> **Week 1 scope:** This version focuses on the static HTML/CSS layout with sample data. Live weather search and API integration are intentionally planned for later weeks.

## Preview

The dashboard includes a dark navigation rail, city search form, featured current-weather panel, seven forecast cards, and compact weather highlights.

## Week 1 deliverables

- [x] Static weather dashboard with sample data
- [x] Accessible city search form with a visible accessible label
- [x] Current-weather card with city, temperature, conditions, wind speed and humidity
- [x] Seven forecast cards sharing the `.forecast-card` CSS class
- [x] Git repository with at least three commits
- [x] Responsive layout and horizontally scrollable forecast row on small screens
- [ ] Add your own screenshot or 30–60 second screen recording before submission

## Built with

- HTML5 — semantic structure and accessible form controls
- CSS3 — custom properties, Flexbox, Grid, responsive media queries and focus states
- Vanilla JavaScript — small Week 1 form validation/demo message
- Google Fonts — DM Sans and Manrope

## Run locally

1. Download or clone this repository.
2. Open the project folder in VS Code.
3. Open `index.html` in your browser, or use the **Live Server** extension.

No package installation or API key is required.

## Project structure

```text
WeatherNow_Week1/
├── index.html
├── style.css
├── script.js
└── README.md
```

## Design and implementation notes

- All visual styling is kept in `style.css`; there are no inline styles in the HTML.
- Shared design tokens (colours, radius and shadow) are defined in `:root`.
- The forecast uses one reusable `.forecast-card` class for all seven days.
- The forecast strip uses horizontal overflow on narrow screens.
- The search input has an associated accessible label, keyboard focus styling and a live status message.
- Weather values are illustrative sample values, not live observations.

## Roadmap

| Week | Planned enhancement |
|---|---|
| 1 | Static layout with sample weather data |
| 2 | Render weather cards from JavaScript objects and add °C/°F toggle |
| 3 | Integrate Open-Meteo geocoding and forecast APIs |
| 4 | Saved cities, localStorage, accessibility polish and deployment |

## Credits

Created as an internship learning project for the SkillMe Web Development track.
