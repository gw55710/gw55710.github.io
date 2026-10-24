const form = document.querySelector("#weather-form");
const cityInput = document.querySelector("#city-input");
const searchButton = document.querySelector("#search-button");
const statusMessage = document.querySelector("#status-message");
const results = document.querySelector("#results");
const currentWeather = document.querySelector("#current-weather");
const hourlyList = document.querySelector("#hourly-list");
const forecastList = document.querySelector("#forecast-list");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const city = cityInput.value.trim();
  // Zostawiony Twój klucz API na sztywno zgodnie z zaleceniami
  const apiKey = "fac83554e3298ad834631b1d2988db4d";

  setLoading(true);
  showStatus("Pobieram aktualną pogodę i prognozę…");
  results.hidden = true;

  try {
    const [current, forecast] = await Promise.all([
      getCurrentWeather(city, apiKey),
      getForecast(city, apiKey)
    ]);

    console.log("Aktualna pogoda:", current);
    console.log("Prognoza na 5 dni:", forecast);

    renderCurrentWeather(current);
    renderHourlyForecast(forecast);
    renderForecast(forecast);

    results.hidden = false;
    showStatus("Prognoza jest gotowa.", "success");
  } catch (error) {
    showStatus(error.message, "error");
  } finally {
    setLoading(false);
  }
});

function getCurrentWeather(city, apiKey) {
  return new Promise((resolve, reject) => {
    const query = new URLSearchParams({
      q: city,
      appid: apiKey,
      units: "metric",
      lang: "pl"
    });
    const request = new XMLHttpRequest();
    request.open("GET", `https://api.openweathermap.org/data/2.5/weather?${query}`);
    request.timeout = 15000;

    request.onload = () => {
      let data;
      try {
        data = parseResponse(request.responseText);
      } catch (error) {
        reject(error);
        return;
      }
      if (request.status >= 200 && request.status < 300) {
        resolve(data);
      } else {
        reject(new Error(getApiError(data, request.status)));
      }
    };
    request.onerror = () => reject(new Error("Nie udało się połączyć z API pogody. Sprawdź połączenie internetowe."));
    request.ontimeout = () => reject(new Error("Serwer pogody nie odpowiedział na czas. Spróbuj ponownie."));
    request.send();
  });
}

async function getForecast(city, apiKey) {
  const query = new URLSearchParams({
    q: city,
    appid: apiKey,
    units: "metric",
    lang: "pl"
  });
  const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?${query}`);
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("Otrzymano nieprawidłową odpowiedź z serwera prognozy.");
  }

  if (!response.ok) {
    throw new Error(getApiError(data, response.status));
  }
  return data;
}

function parseResponse(responseText) {
  try {
    return JSON.parse(responseText);
  } catch {
    throw new Error("Otrzymano nieprawidłową odpowiedź z serwera pogody.");
  }
}

function getApiError(data, status) {
  if (status === 401) {
    return "Klucz API jest nieprawidłowy lub jeszcze nieaktywny. Sprawdź go i spróbuj ponownie.";
  }
  if (status === 404) {
    return "Nie znaleziono tej miejscowości. Spróbuj podać nazwę i kod kraju, np. Gdańsk, PL.";
  }
  return data?.message
    ? `API pogody: ${data.message}`
    : `Nie udało się pobrać pogody (błąd ${status}). Spróbuj ponownie.`;
}

function renderCurrentWeather(data) {
  const condition = data.weather[0];
  const weatherId = condition.id;
  const weatherType = weatherId >= 200 && weatherId < 600
    ? "rain"
    : weatherId >= 600 && weatherId < 700
      ? "snow"
      : weatherId >= 700 && weatherId < 800
        ? "mist"
        : weatherId === 800
          ? "clear"
          : "clouds";
  currentWeather.dataset.weather = weatherType;
  currentWeather.dataset.time = condition.icon.endsWith("n") ? "night" : "day";
  const icon = createWeatherIcon(condition.icon, condition.description, "current-icon");
  const primary = document.createElement("div");
  primary.className = "current-primary";

  const summary = document.createElement("div");
  const place = document.createElement("p");
  place.className = "current-place";
  place.textContent = `${data.name}${data.sys?.country ? `, ${data.sys.country}` : ""}`;
  const time = document.createElement("p");
  time.className = "current-time";
  time.textContent = `Aktualnie ${formatLocalTime(data.dt, data.timezone)}`;
  const description = document.createElement("p");
  description.className = "current-condition";
  description.textContent = condition.description;
  const temperature = document.createElement("p");
  temperature.className = "current-temperature";
  temperature.append(document.createTextNode(`${Math.round(data.main.temp)}`));
  const unit = document.createElement("span");
  unit.textContent = "°C";
  temperature.append(unit);
  summary.append(place, time, description, temperature);
  primary.append(icon, summary);

  const stats = document.createElement("div");
  stats.className = "weather-stats";
  stats.append(
    createStat("Temperatura odczuwalna", `${Math.round(data.main.feels_like)}°C`),
    createStat("Wilgotność", `${data.main.humidity}%`),
    createStat("Wiatr", `${formatNumber(data.wind.speed)} m/s`),
    createStat("Ciśnienie", `${data.main.pressure} hPa`)
  );

  currentWeather.replaceChildren(primary, stats);
}

function renderForecast(data) {
  const offset = data.city.timezone ?? 0;
  const days = new Map();

  for (const item of data.list) {
    const localDate = new Date((item.dt + offset) * 1000);
    const key = `${localDate.getUTCFullYear()}-${localDate.getUTCMonth()}-${localDate.getUTCDate()}`;
    if (!days.has(key)) {
      days.set(key, { date: localDate, entries: [] });
    }
    days.get(key).entries.push(item);
  }

  const cards = [...days.values()].slice(0, 5).map(({ date, entries }) => {
    const middayForecast = entries.reduce((closest, item) => {
      const hour = new Date((item.dt + offset) * 1000).getUTCHours();
      const closestHour = new Date((closest.dt + offset) * 1000).getUTCHours();
      return Math.abs(hour - 12) < Math.abs(closestHour - 12) ? item : closest;
    });
    const min = Math.min(...entries.map((item) => item.main.temp_min));
    const max = Math.max(...entries.map((item) => item.main.temp_max));
    const rain = Math.max(...entries.map((item) => item.pop ?? 0));
    return createForecastCard(date, middayForecast, min, max, rain);
  });

  forecastList.replaceChildren(...cards);
}

function renderHourlyForecast(data) {
  const now = Date.now() / 1000;
  const upcoming = data.list.filter((item) => item.dt > now).slice(0, 6);
  const cards = upcoming.map((item) => createHourlyCard(item, data.city.timezone ?? 0));
  hourlyList.replaceChildren(...cards);
}

function createHourlyCard(item, timezoneOffset) {
  const card = document.createElement("article");
  card.className = "hourly-card";
  const localTime = new Date((item.dt + timezoneOffset) * 1000);
  const time = document.createElement("p");
  time.className = "hourly-time";
  time.textContent = new Intl.DateTimeFormat("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC"
  }).format(localTime);
  const icon = createWeatherIcon(item.weather[0].icon, item.weather[0].description, "hourly-icon");
  const temperature = document.createElement("p");
  temperature.className = "hourly-temperature";
  temperature.textContent = `${Math.round(item.main.temp)}°`;
  const condition = document.createElement("p");
  condition.className = "hourly-condition";
  condition.textContent = item.weather[0].description;
  const rainChance = document.createElement("p");
  rainChance.className = "hourly-rain";
  rainChance.textContent = `Deszcz ${Math.round((item.pop ?? 0) * 100)}%`;
  card.append(time, icon, temperature, condition, rainChance);
  return card;
}

function createForecastCard(date, item, min, max, rain) {
  const card = document.createElement("article");
  card.className = "forecast-card";
  const day = document.createElement("p");
  day.className = "forecast-day";
  day.textContent = new Intl.DateTimeFormat("pl-PL", { weekday: "long" }).format(date);
  const dateLabel = document.createElement("p");
  dateLabel.className = "forecast-date";
  dateLabel.textContent = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short" }).format(date);
  const icon = createWeatherIcon(item.weather[0].icon, item.weather[0].description, "forecast-icon");
  const condition = document.createElement("p");
  condition.className = "forecast-condition";
  condition.textContent = item.weather[0].description;
  const temperatures = document.createElement("div");
  temperatures.className = "forecast-temps";
  const high = document.createElement("span");
  high.textContent = `${Math.round(max)}°`;
  const low = document.createElement("span");
  low.className = "forecast-low";
  low.textContent = `${Math.round(min)}°`;
  temperatures.append(high, low);
  const rainChance = document.createElement("p");
  rainChance.className = "forecast-rain";
  rainChance.textContent = `Deszcz ${Math.round(rain * 100)}%`;
  card.append(day, dateLabel, icon, condition, temperatures, rainChance);
  return card;
}

function createWeatherIcon(iconCode, description, className) {
  const icon = document.createElement("img");
  icon.className = className;
  icon.src = `https://openweathermap.org/img/wn/${encodeURIComponent(iconCode)}@2x.png`;
  icon.alt = description;
  icon.loading = "lazy";
  return icon;
}

function createStat(label, value) {
  const stat = document.createElement("div");
  stat.className = "stat";
  const statLabel = document.createElement("span");
  statLabel.className = "stat-label";
  statLabel.textContent = label;
  const statValue = document.createElement("span");
  statValue.className = "stat-value";
  statValue.textContent = value;
  stat.append(statLabel, statValue);
  return stat;
}

function formatNumber(value) {
  return new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 1 }).format(value);
}

function formatLocalTime(timestamp, timezoneOffset = 0) {
  const localDate = new Date((timestamp + timezoneOffset) * 1000);
  return new Intl.DateTimeFormat("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC"
  }).format(localDate);
}

function showStatus(message, kind = "") {
  statusMessage.textContent = message;
  statusMessage.dataset.kind = kind;
}

function setLoading(isLoading) {
  searchButton.disabled = isLoading;
  searchButton.querySelector("span").textContent = isLoading ? "Pobieranie…" : "Pogoda";
}
