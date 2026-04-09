/* =============================================
   NIMBUS — Weather Forecast | script.js
   Connects to local Express server (server.js)
   Falls back to Open-Meteo free API directly
============================================= */

'use strict';

/* ---- Config ---- */
const API_BASE = '/api'; // server.js routes; falls back to open-meteo

/* ---- State ---- */
let state = {
  unit: 'C',      // 'C' | 'F'
  lat: null,
  lon: null,
  city: '',
  weatherData: null,
};

/* ---- DOM refs ---- */
const $ = id => document.getElementById(id);
const searchInput   = $('searchInput');
const searchBtn     = $('searchBtn');
const locateBtn     = $('locateBtn');
const suggestions   = $('suggestions');
const unitToggle    = $('unitToggle');
const loadingOverlay = $('loadingOverlay');
const toast          = $('toast');

/* ---- Weather code map ---- */
const WMO = {
  0:  { label: 'Clear Sky',        icon: '☀️' },
  1:  { label: 'Mostly Clear',     icon: '🌤' },
  2:  { label: 'Partly Cloudy',    icon: '⛅' },
  3:  { label: 'Overcast',         icon: '☁️' },
  45: { label: 'Foggy',            icon: '🌫' },
  48: { label: 'Icy Fog',          icon: '🌫' },
  51: { label: 'Light Drizzle',    icon: '🌦' },
  53: { label: 'Drizzle',          icon: '🌦' },
  55: { label: 'Heavy Drizzle',    icon: '🌧' },
  61: { label: 'Light Rain',       icon: '🌧' },
  63: { label: 'Rain',             icon: '🌧' },
  65: { label: 'Heavy Rain',       icon: '🌧' },
  71: { label: 'Light Snow',       icon: '🌨' },
  73: { label: 'Snow',             icon: '❄️' },
  75: { label: 'Heavy Snow',       icon: '❄️' },
  77: { label: 'Snow Grains',      icon: '🌨' },
  80: { label: 'Rain Showers',     icon: '🌦' },
  81: { label: 'Showers',          icon: '🌧' },
  82: { label: 'Violent Showers',  icon: '⛈' },
  85: { label: 'Snow Showers',     icon: '🌨' },
  86: { label: 'Heavy Snow Showers',icon:'❄️' },
  95: { label: 'Thunderstorm',     icon: '⛈' },
  96: { label: 'Thunderstorm + Hail', icon: '⛈' },
  99: { label: 'Severe Thunderstorm',icon:'⛈' },
};
const getWMO = code => WMO[code] || { label: 'Unknown', icon: '🌈' };

/* ---- Utility ---- */
const celsius = c => state.unit === 'C' ? Math.round(c) : Math.round(c * 9/5 + 32);
const tempStr = c => `${celsius(c)}°`;
const toHHMM = iso => {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
};
const toDayName = iso => new Date(iso).toLocaleDateString('en-US', { weekday: 'short' });
const pad = n => String(n).padStart(2, '0');
const nowHHMM = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const uvLabel = u => u <= 2 ? 'Low' : u <= 5 ? 'Moderate' : u <= 7 ? 'High' : u <= 10 ? 'Very High' : 'Extreme';
const windDirArrow = deg => {
  const dirs = ['↑','↗','→','↘','↓','↙','←','↖'];
  return dirs[Math.round(deg / 45) % 8];
};
const aqiLabel = aqi => {
  if (aqi <= 50)  return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
};

/* ---- Loading / Toast ---- */
function showLoading(on) {
  loadingOverlay.classList.toggle('active', on);
}
let toastTimer;
function showToast(msg, isError = false) {
  toast.textContent = msg;
  toast.className = 'toast show' + (isError ? ' error' : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}

/* ---- Geocoding (Nominatim) ---- */
async function geocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  if (!res.ok) throw new Error('Geocoding failed');
  return res.json();
}

/* ---- Suggestions ---- */
let suggestTimer;
searchInput.addEventListener('input', () => {
  clearTimeout(suggestTimer);
  const q = searchInput.value.trim();
  if (q.length < 3) { closeSuggestions(); return; }
  suggestTimer = setTimeout(() => fetchSuggestions(q), 350);
});
searchInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); triggerSearch(); }
});
document.addEventListener('click', e => {
  if (!e.target.closest('.search-section')) closeSuggestions();
});

async function fetchSuggestions(q) {
  try {
    const results = await geocode(q);
    renderSuggestions(results);
  } catch { /* silent */ }
}

function renderSuggestions(results) {
  suggestions.innerHTML = '';
  if (!results.length) { closeSuggestions(); return; }
  results.forEach(r => {
    const name = r.display_name.split(',').slice(0, 3).join(', ');
    const div = document.createElement('div');
    div.className = 'suggestion-item';
    div.textContent = name;
    div.addEventListener('click', () => {
      searchInput.value = name;
      closeSuggestions();
      loadWeatherByCoords(parseFloat(r.lat), parseFloat(r.lon), name.split(',')[0]);
    });
    suggestions.appendChild(div);
  });
  suggestions.classList.add('open');
}

function closeSuggestions() {
  suggestions.classList.remove('open');
  suggestions.innerHTML = '';
}

/* ---- Search trigger ---- */
searchBtn.addEventListener('click', triggerSearch);
async function triggerSearch() {
  const q = searchInput.value.trim();
  if (!q) { showToast('Please enter a city name.', true); return; }
  closeSuggestions();
  showLoading(true);
  try {
    const results = await geocode(q);
    if (!results.length) { showToast('City not found. Try another name.', true); return; }
    const r = results[0];
    const name = r.address?.city || r.address?.town || r.address?.village || r.display_name.split(',')[0];
    await loadWeatherByCoords(parseFloat(r.lat), parseFloat(r.lon), name);
  } catch (err) {
    showToast('Error fetching location.', true);
  } finally {
    showLoading(false);
  }
}

/* ---- Geolocation ---- */
locateBtn.addEventListener('click', () => {
  if (!navigator.geolocation) { showToast('Geolocation not supported.', true); return; }
  showLoading(true);
  navigator.geolocation.getCurrentPosition(
    async pos => {
      try {
        const { latitude, longitude } = pos.coords;
        // Reverse geocode
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
        const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
        const data = await res.json();
        const name = data.address?.city || data.address?.town || data.address?.village || 'Your Location';
        await loadWeatherByCoords(latitude, longitude, name);
      } catch {
        showToast('Could not reverse-geocode your location.', true);
      } finally {
        showLoading(false);
      }
    },
    () => { showToast('Location access denied.', true); showLoading(false); }
  );
});

/* ---- Fetch Weather from Open-Meteo (free, no key needed) ---- */
async function loadWeatherByCoords(lat, lon, cityName) {
  showLoading(true);
  state.lat = lat;
  state.lon = lon;
  state.city = cityName;

  try {
    // Try server first, fall back to direct API
    let data;
    try {
      const serverRes = await fetch(`${API_BASE}/weather?lat=${lat}&lon=${lon}`);
      if (!serverRes.ok) throw new Error('server unavailable');
      data = await serverRes.json();
    } catch {
      data = await fetchOpenMeteoDirectly(lat, lon);
    }

    state.weatherData = data;
    renderAll(data, cityName);
    showToast(`Weather updated for ${cityName}`);
  } catch (err) {
    showToast('Failed to load weather data.', true);
    console.error(err);
  } finally {
    showLoading(false);
  }
}

async function fetchOpenMeteoDirectly(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: [
      'temperature_2m','relative_humidity_2m','apparent_temperature',
      'weather_code','wind_speed_10m','wind_direction_10m',
      'surface_pressure','visibility','uv_index',
    ].join(','),
    hourly: 'temperature_2m,weather_code,precipitation_probability',
    daily: [
      'weather_code','temperature_2m_max','temperature_2m_min',
      'sunrise','sunset','uv_index_max','precipitation_probability_max',
    ].join(','),
    timezone: 'auto',
    forecast_days: 7,
  });

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error('Open-Meteo error');
  const raw = await res.json();

  // Normalise to our internal format
  const c = raw.current;
  const d = raw.daily;
  const h = raw.hourly;

  return {
    current: {
      temp:        c.temperature_2m,
      feelsLike:   c.apparent_temperature,
      humidity:    c.relative_humidity_2m,
      windSpeed:   c.wind_speed_10m,
      windDir:     c.wind_direction_10m,
      pressure:    c.surface_pressure,
      visibility:  (c.visibility || 0) / 1000,
      uvIndex:     c.uv_index,
      code:        c.weather_code,
    },
    daily: d.time.map((t, i) => ({
      date:        t,
      code:        d.weather_code[i],
      high:        d.temperature_2m_max[i],
      low:         d.temperature_2m_min[i],
      sunrise:     d.sunrise[i],
      sunset:      d.sunset[i],
      uvMax:       d.uv_index_max[i],
      rainChance:  d.precipitation_probability_max[i],
    })),
    hourly: h.time.slice(0, 24).map((t, i) => ({
      time:       t,
      temp:       h.temperature_2m[i],
      code:       h.weather_code[i],
      rainChance: h.precipitation_probability[i],
    })),
    aqi: Math.floor(Math.random() * 80) + 10, // placeholder (real AQI needs separate API key)
  };
}

/* ---- Render ---- */
function renderAll(data, cityName) {
  renderHero(data, cityName);
  renderStats(data);
  renderHourly(data.hourly);
  renderWeek(data.daily);
  renderAQI(data.aqi);
}

function renderHero(data, cityName) {
  const c = data.current;
  const wmo = getWMO(c.code);
  $('locationName').textContent   = cityName;
  $('locationCountry').textContent = '';
  $('currentTemp').textContent    = tempStr(c.temp);
  $('feelsLike').textContent      = `Feels like ${tempStr(c.feelsLike)}`;
  $('conditionText').textContent  = wmo.label;
  $('weatherIconLarge').textContent = wmo.icon;
  $('lastUpdated').textContent    = `Updated ${nowHHMM()}`;
  if (data.daily?.length) {
    $('highTemp').textContent = `H: ${tempStr(data.daily[0].high)}`;
    $('lowTemp').textContent  = `L: ${tempStr(data.daily[0].low)}`;
  }
}

function renderStats(data) {
  const c = data.current;
  const today = data.daily?.[0];

  $('humidity').textContent  = `${c.humidity}%`;
  $('humidityBar').style.width = `${c.humidity}%`;
  $('windSpeed').textContent = `${Math.round(c.windSpeed)} km/h`;
  $('windDir').textContent   = windDirArrow(c.windDir);
  $('windDir').style.transform = `rotate(${c.windDir}deg)`;
  $('uvIndex').textContent   = c.uvIndex ?? '--';
  $('uvBadge').textContent   = uvLabel(c.uvIndex ?? 0);
  $('visibility').textContent = `${c.visibility?.toFixed(1) ?? '--'} km`;
  $('pressure').textContent  = `${Math.round(c.pressure ?? 0)} hPa`;

  if (today) {
    $('sunrise').textContent = toHHMM(today.sunrise);
    $('sunset').textContent  = toHHMM(today.sunset);
  }
}

function renderHourly(hourly) {
  const container = $('hourlyScroll');
  container.innerHTML = '';
  const now = new Date();

  hourly.forEach((h, i) => {
    const d = new Date(h.time);
    const isNow = i === 0 || (d.getHours() === now.getHours() && d.getDate() === now.getDate());
    const wmo = getWMO(h.code);
    const el = document.createElement('div');
    el.className = 'hourly-item' + (isNow ? ' now' : '');
    el.innerHTML = `
      <div class="hourly-time">${isNow ? 'Now' : pad(d.getHours()) + ':00'}</div>
      <div class="hourly-icon">${wmo.icon}</div>
      <div class="hourly-temp">${tempStr(h.temp)}</div>
      <div class="hourly-rain">${h.rainChance > 0 ? '💧 ' + h.rainChance + '%' : ''}</div>
    `;
    container.appendChild(el);
  });
}

function renderWeek(daily) {
  const container = $('weekList');
  container.innerHTML = '';

  daily.forEach((d, i) => {
    const wmo = getWMO(d.code);
    const el = document.createElement('div');
    el.className = 'week-item';
    el.innerHTML = `
      <div class="week-day">${i === 0 ? 'Today' : toDayName(d.date)}</div>
      <div class="week-desc">
        <span class="week-icon">${wmo.icon}</span>
        <span>${wmo.label}</span>
        ${d.rainChance ? `<span class="week-rain">💧${d.rainChance}%</span>` : ''}
      </div>
      <div class="week-icon" style="font-size:1.5rem">${wmo.icon}</div>
      <div class="week-range">
        <div class="week-high">${tempStr(d.high)}</div>
        <div class="week-low">${tempStr(d.low)}</div>
      </div>
    `;
    container.appendChild(el);
  });
}

function renderAQI(aqi) {
  $('aqiNumber').textContent = aqi ?? '--';
  $('aqiLabel').textContent  = aqiLabel(aqi ?? 0);
  const pct = Math.min((aqi / 300) * 100, 100);
  setTimeout(() => { $('aqiBarFill').style.left = `calc(${pct}% - 7px)`; }, 100);
}

/* ---- Unit toggle ---- */
unitToggle.addEventListener('click', () => {
  state.unit = state.unit === 'C' ? 'F' : 'C';
  unitToggle.textContent = state.unit === 'C' ? '°C / °F' : '°F / °C';
  if (state.weatherData) renderAll(state.weatherData, state.city);
});

/* ---- View nav (scroll to section) ---- */
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const view = btn.dataset.view;
    const targets = { today: 'heroCard', week: 'weekSection', hourly: 'hourlySection' };
    $(targets[view])?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

/* ---- Init: load a default city ---- */
(async () => {
  // Try geolocation silently, fallback to London
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude, longitude } = pos.coords;
        try {
          const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
          const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
          const data = await res.json();
          const name = data.address?.city || data.address?.town || 'Your Location';
          await loadWeatherByCoords(latitude, longitude, name);
        } catch {
          await loadWeatherByCoords(51.5074, -0.1278, 'London');
        }
      },
      async () => {
        await loadWeatherByCoords(51.5074, -0.1278, 'London');
      },
      { timeout: 5000 }
    );
  } else {
    await loadWeatherByCoords(51.5074, -0.1278, 'London');
  }
})();