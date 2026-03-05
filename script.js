const api_key = "debd019c9c544159a8a8b7c20b850bcb";

const cityInput = document.getElementById("city_input");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const loader = document.getElementById("loadingOverlay");

let chart;
let currentUnit = "metric";
let currentCityData = null;

/* ================= ICON FUNCTION ================= */
function getWeatherIcon(condition) {
  switch (condition) {
    case "Clear": return "fa-sun";
    case "Clouds": return "fa-cloud";
    case "Rain": return "fa-cloud-rain";
    case "Drizzle": return "fa-cloud-rain";
    case "Thunderstorm": return "fa-bolt";
    case "Snow": return "fa-snowflake";
    case "Mist":
    case "Haze":
    case "Fog": return "fa-smog";
    default: return "fa-cloud";
  }
}

/* ================= FORMAT TIME ================= */
function formatTime(timestamp, timezone) {
  const date = new Date((timestamp + timezone) * 1000);
  return date.toUTCString().match(/(\d{2}:\d{2})/)[0];
}

/* ================= LOADER ================= */
function showLoader() { loader.classList.add("active"); }
function hideLoader() { loader.classList.remove("active"); }

/* ================= MAIN WEATHER ================= */
function getWeatherDetails(name, lat, lon, country) {

  showLoader();
  currentCityData = { name, lat, lon, country };

  const WEATHER_API =
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${currentUnit}&appid=${api_key}`;

  const FORECAST_API =
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${currentUnit}&appid=${api_key}`;

  const AIR_API =
    `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${api_key}`;

  /* ===== CURRENT WEATHER ===== */
  fetch(WEATHER_API)
    .then(res => res.json())
    .then(data => {

      const unitSymbol = currentUnit === "metric" ? "°C" : "°F";

      document.getElementById("currentTemp").innerText =
        data.main.temp.toFixed(1) + unitSymbol;

      document.getElementById("weatherDesc").innerText =
        data.weather[0].description;

      /* 🔥 DYNAMIC NOW ICON */
      const iconClass = getWeatherIcon(data.weather[0].main);
      document.getElementById("weatherIcon").outerHTML =
        `<i id="weatherIcon" class="fa-solid ${iconClass} fa-4x"></i>`;

      document.getElementById("currentDate").innerText =
        new Date().toDateString();

      document.getElementById("currentCity").innerText =
        `${name}, ${country}`;

      document.getElementById("sunriseTime").innerText =
        formatTime(data.sys.sunrise, data.timezone);

      document.getElementById("sunsetTime").innerText =
        formatTime(data.sys.sunset, data.timezone);

      document.getElementById("humidityVal").innerText =
        data.main.humidity + "%";

      document.getElementById("pressureVal").innerText =
        data.main.pressure + " hPa";

      document.getElementById("visibilityVal").innerText =
        (data.visibility / 1000).toFixed(1) + " km";

      document.getElementById("windspeedVal").innerText =
        data.wind.speed + (currentUnit === "metric" ? " m/s" : " mph");

      document.getElementById("feelsVal").innerText =
        data.main.feels_like.toFixed(1) + unitSymbol;
    });

  /* ===== AIR QUALITY ===== */
  fetch(AIR_API)
    .then(res => res.json())
    .then(data => {

      const aqi = data.list[0].main.aqi;
      const comp = data.list[0].components;
      const aqiEl = document.getElementById("aqiStatus");

      let status = "Good";
      let className = "good";

      if (aqi === 3) {
        status = "Average";
        className = "average";
      } else if (aqi >= 4) {
        status = "Poor";
        className = "poor";
      }

      aqiEl.innerText = status;
      aqiEl.className = "air-index " + className;

      document.getElementById("pm2").innerText = comp.pm2_5;
      document.getElementById("pm10").innerText = comp.pm10;
      document.getElementById("so2").innerText = comp.so2;
      document.getElementById("co").innerText = comp.co;
      document.getElementById("no").innerText = comp.no;
      document.getElementById("no2").innerText = comp.no2;
      document.getElementById("nh3").innerText = comp.nh3;
      document.getElementById("o3").innerText = comp.o3;
    });

  /* ===== FORECAST ===== */
  fetch(FORECAST_API)
    .then(res => res.json())
    .then(data => {

      const unitSymbol = currentUnit === "metric" ? "°C" : "°F";

      /* Hourly */
      const hourlyContainer =
        document.querySelector(".hourly-forecast");
      hourlyContainer.innerHTML = "";

      data.list.slice(0, 6).forEach(item => {

        const date = new Date(item.dt_txt);
        let hour = date.getHours();
        const ampm = hour >= 12 ? "PM" : "AM";
        hour = hour % 12 || 12;

        const iconClass = getWeatherIcon(item.weather[0].main);

        hourlyContainer.innerHTML += `
          <div class="card">
            <p>${hour} ${ampm}</p>
            <i class="fa-solid ${iconClass} fa-2x"></i>
            <p>${item.main.temp.toFixed(1)}${unitSymbol}</p>
          </div>
        `;
      });

      /* 5 Days */
      const dayContainer =
        document.querySelector(".day-forecast");
      dayContainer.innerHTML = "";

      const dailyMap = {};

      data.list.forEach(item => {
        const date = item.dt_txt.split(" ")[0];
        if (!dailyMap[date]) dailyMap[date] = item;
      });

      Object.keys(dailyMap).slice(1, 6).forEach(day => {

        const item = dailyMap[day];
        const iconClass = getWeatherIcon(item.weather[0].main);
        

        dayContainer.innerHTML += `
          <div class="forecast-item">
            <p>${new Date(day).toDateString().slice(0, 3)}</p>
            <i class="fa-solid ${iconClass}"></i>
            <p>${item.main.temp.toFixed(1)}${unitSymbol}</p>
          </div>
        `;
      });

      /* Trend */
      const temps = data.list.slice(0, 8)
        .map(item => item.main.temp.toFixed(1));

      const labels = data.list.slice(0, 8)
        .map(item => new Date(item.dt_txt).getHours());

      if (chart) chart.destroy();

      chart = new Chart(
        document.getElementById("tempChart"),
        {
          type: "line",
          data: {
            labels: labels,
            datasets: [{
              label: currentUnit === "metric" ? "Temperature °C" : "Temperature °F",
              data: temps,
              borderColor: "#38bdf8",
              tension: 0.4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
          }
        }
      );

      hideLoader();
      setWeatherBackground(data.weather[0].main);
        pageFadeEffect();
    });
}

/* ================= SEARCH ================= */
function getCityCoordinates() {

  const cityName = cityInput.value.trim();
  if (!cityName) return alert("Enter city name");

  const GEO_API =
    `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${api_key}`;

  fetch(GEO_API)
    .then(res => res.json())
    .then(data => {

      if (!data.length) {
        alert("City not found");
        return;
      }

      const { name, lat, lon, country } = data[0];
      getWeatherDetails(name, lat, lon, country);
      cityInput.value = "";
    });
}

/* ================= LOCATION ================= */
function getUserCoordinates() {
  navigator.geolocation.getCurrentPosition(position => {
    const { latitude, longitude } = position.coords;
    getWeatherDetails("Your Location", latitude, longitude, "");
  });
}

/* ================= UNIT TOGGLE ================= */
document.getElementById("unitToggle").addEventListener("click", () => {

  if (currentUnit === "metric") {
    currentUnit = "imperial";
    document.getElementById("unitToggle").innerText = "°C";
  } else {
    currentUnit = "metric";
    document.getElementById("unitToggle").innerText = "°F";
  }

  if (currentCityData) {
    getWeatherDetails(
      currentCityData.name,
      currentCityData.lat,
      currentCityData.lon,
      currentCityData.country
    );
  }
});

/* ================= EVENTS ================= */
searchBtn.addEventListener("click", getCityCoordinates);
locationBtn.addEventListener("click", getUserCoordinates);
cityInput.addEventListener("keyup", e => {
  if (e.key === "Enter") getCityCoordinates();
});

window.addEventListener("load", getUserCoordinates);

function setWeatherBackground(condition) {

  document.body.classList.remove(
    "clear", "clouds", "rain", "snow", "thunderstorm"
  );

  switch (condition) {
    case "Clear":
      document.body.classList.add("clear");
      break;
    case "Clouds":
      document.body.classList.add("clouds");
      break;
    case "Rain":
    case "Drizzle":
      document.body.classList.add("rain");
      break;
    case "Snow":
      document.body.classList.add("snow");
      break;
    case "Thunderstorm":
      document.body.classList.add("thunderstorm");
      break;
  }
}
function pageFadeEffect(){

  const container = document.querySelector(".container");

  container.classList.add("fade-out");

  setTimeout(()=>{
    container.classList.remove("fade-out");
    container.classList.add("fade-in");

    setTimeout(()=>{
      container.classList.remove("fade-in");
    },300);

  },150);
}