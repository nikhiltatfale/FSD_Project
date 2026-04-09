/**
 * NIMBUS — Weather Forecast | server.js
 *
 * Lightweight Express server that:
 *  1. Serves the static frontend (index.html, style.css, script.js)
 *  2. Proxies weather data from Open-Meteo (no API key required)
 *  3. Proxies Air Quality data from Open-Meteo AQ API
 *  4. Handles geocoding via Nominatim (for server-side search)
 *
 * Usage:
 *   npm install express node-fetch cors
 *   node server.js
 *
 * Open http://localhost:3000 in your browser.
 */

'use strict';

const express  = require('express');
const cors     = require('cors');
const path     = require('path');

// node-fetch v3 is ESM-only; use dynamic import or install v2:
// npm install node-fetch@2
const fetch = (...args) =>
  import('node-fetch').then(({ default: f }) => f(...args));

const app  = express();
const PORT = process.env.PORT || 3000;

/* ---------- Middleware ---------- */
app.use(cors());
app.use(express.json());

// Serve static files from the same directory as server.js
app.use(express.static(path.join(__dirname)));

/* ---------- Helper ---------- */
async function safeFetch(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, { signal: controller.signal, ...options });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`Upstream ${res.status}: ${res.statusText}`);
    return res.json();
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

/* ---------- Routes ---------- */

/**
 * GET /api/weather?lat=XX&lon=YY
 *
 * Returns combined current + hourly + daily weather data
 * from Open-Meteo's free forecast API.
 */
app.get('/api/weather', async (req, res) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'lat and lon query parameters are required.' });
  }

  const params = new URLSearchParams({
    latitude:  lat,
    longitude: lon,
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'weather_code',
      'wind_speed_10m',
      'wind_direction_10m',
      'surface_pressure',
      'visibility',
      'uv_index',
    ].join(','),
    hourly: 'temperature_2m,weather_code,precipitation_probability',
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'sunrise',
      'sunset',
      'uv_index_max',
      'precipitation_probability_max',
    ].join(','),
    timezone:      'auto',
    forecast_days: 7,
  });

  try {
    const raw = await safeFetch(`https://api.open-meteo.com/v1/forecast?${params}`);

    const c = raw.current;
    const d = raw.daily;
    const h = raw.hourly;

    // Fetch AQI in parallel
    let aqi = null;
    try {
      const aqiParams = new URLSearchParams({
        latitude:  lat,
        longitude: lon,
        current:   'us_aqi',
        timezone:  'auto',
      });
      const aqiRaw = await safeFetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${aqiParams}`);
      aqi = aqiRaw?.current?.us_aqi ?? null;
    } catch { /* AQI is optional */ }

    const payload = {
      current: {
        temp:       c.temperature_2m,
        feelsLike:  c.apparent_temperature,
        humidity:   c.relative_humidity_2m,
        windSpeed:  c.wind_speed_10m,
        windDir:    c.wind_direction_10m,
        pressure:   c.surface_pressure,
        visibility: (c.visibility || 0) / 1000, // metres → km
        uvIndex:    c.uv_index,
        code:       c.weather_code,
      },
      daily: d.time.map((t, i) => ({
        date:       t,
        code:       d.weather_code[i],
        high:       d.temperature_2m_max[i],
        low:        d.temperature_2m_min[i],
        sunrise:    d.sunrise[i],
        sunset:     d.sunset[i],
        uvMax:      d.uv_index_max[i],
        rainChance: d.precipitation_probability_max[i],
      })),
      hourly: h.time.slice(0, 24).map((t, i) => ({
        time:       t,
        temp:       h.temperature_2m[i],
        code:       h.weather_code[i],
        rainChance: h.precipitation_probability[i],
      })),
      aqi,
    };

    res.json(payload);
  } catch (err) {
    console.error('[/api/weather]', err.message);
    res.status(502).json({ error: 'Failed to fetch weather data.', detail: err.message });
  }
});

/**
 * GET /api/geocode?q=cityName
 *
 * Server-side geocoding via Nominatim (avoids CORS on some clients).
 */
app.get('/api/geocode', async (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).json({ error: 'q parameter is required.' });

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1`;
    const data = await safeFetch(url, {
      headers: {
        'User-Agent': 'Nimbus-Weather-App/1.0 (contact@nimbus.example.com)',
        'Accept-Language': 'en',
      },
    });
    res.json(data);
  } catch (err) {
    console.error('[/api/geocode]', err.message);
    res.status(502).json({ error: 'Geocoding failed.', detail: err.message });
  }
});

/**
 * GET /api/reverse?lat=XX&lon=YY
 *
 * Reverse geocode lat/lon to a city name.
 */
app.get('/api/reverse', async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: 'lat and lon required.' });

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
    const data = await safeFetch(url, {
      headers: {
        'User-Agent': 'Nimbus-Weather-App/1.0 (contact@nimbus.example.com)',
        'Accept-Language': 'en',
      },
    });
    const name = data.address?.city || data.address?.town || data.address?.village || 'Unknown';
    res.json({ name, raw: data });
  } catch (err) {
    console.error('[/api/reverse]', err.message);
    res.status(502).json({ error: 'Reverse geocoding failed.', detail: err.message });
  }
});

/**
 * GET /api/health
 * Simple health-check endpoint.
 */
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/* ---------- Catch-all: serve index.html for any unknown route ---------- */
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

/* ---------- Error handler ---------- */
app.use((err, _req, res, _next) => {
  console.error('[Unhandled Error]', err);
  res.status(500).json({ error: 'Internal server error.' });
});

/* ---------- Start ---------- */
app.listen(PORT, () => {
  console.log(`\n🌤  Nimbus Weather Server running on http://localhost:${PORT}\n`);
});

module.exports = app; // export for testing