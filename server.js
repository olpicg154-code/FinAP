// server.js (FinAP) — кеш + ретраї для Overpass
const express = require("express");
const fs = require("fs");
const path = require("path");
const { setTimeout: wait } = require("timers/promises");

const app = express();
const PORT = process.env.PORT || 3000;

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter"
];

const CACHE_DIR = path.join(__dirname, "data");
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

const CACHE_TTL = 12 * 60 * 60; // 12 годин

app.use(express.static("."));

async function fetchWithTimeout(url, opts = {}, timeout = 12000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

async function queryOverpassWithRetries(query, tries = 3, backoff = 800) {
  let lastErr = null;
  for (let attempt = 1; attempt <= tries; attempt++) {
    for (const endpoint of OVERPASS_ENDPOINTS) {
      try {
        const res = await fetchWithTimeout(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "FinAP-Rivne-Map/1.0"
          },
          body: "data=" + encodeURIComponent(query)
        }, 12000);
        if (!res.ok) throw new Error(`${endpoint} HTTP ${res.status}`);
        return await res.json();
      } catch (err) {
        lastErr = err;
        // спробуємо інший endpoint
      }
    }
    if (attempt < tries) await wait(backoff * attempt);
  }
  throw lastErr || new Error("Overpass unavailable");
}

function readCache(filename) {
  const p = path.join(CACHE_DIR, filename);
  if (!fs.existsSync(p)) return null;
  try {
    const raw = fs.readFileSync(p, "utf8");
    const obj = JSON.parse(raw);
    const now = Math.floor(Date.now() / 1000);
    if (obj._ts && (now - obj._ts) < CACHE_TTL) return obj.data;
    return null;
  } catch (e) {
    return null;
  }
}

function writeCache(filename, data) {
  const p = path.join(CACHE_DIR, filename);
  const obj = { _ts: Math.floor(Date.now() / 1000), data };
  try {
    fs.writeFileSync(p, JSON.stringify(obj), "utf8");
  } catch (e) {
    console.warn("Cache write failed", e);
  }
}

function parseElementsToPlaces(elements, fallbackName) {
  return (elements || []).map(el => {
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    const tags = el.tags || {};
    if (typeof lat !== "number" || typeof lon !== "number") return null;
    return {
      id: el.id,
      name: tags.name || tags.brand || tags.operator || fallbackName,
      address: [tags["addr:street"], tags["addr:housenumber"]].filter(Boolean).join(", "),
      lat,
      lon,
      source: "OpenStreetMap"
    };
  }).filter(Boolean);
}

/* ==================== BANKS API ==================== */
app.get("/api/banks", async (req, res) => {
  const cacheName = "cache_banks.json";

  const query = `
    [out:json][timeout:30];
    (
      node["amenity"="bank"](50.57,26.15,50.68,26.38);
      way["amenity"="bank"](50.57,26.15,50.68,26.38);
      relation["amenity"="bank"](50.57,26.15,50.68,26.38);
    );
    out center tags;
  `;

  try {
    const data = await queryOverpassWithRetries(query);
    const places = parseElementsToPlaces(data.elements || [], "Банк");
    writeCache(cacheName, places);
    res.json({ success: true, count: places.length, places });
  } catch (err) {
    console.error("BANK API error:", err.message || err);
    const cached = readCache(cacheName);
    if (cached) {
      return res.json({ success: true, count: cached.length, places: cached, warning: "Повернено кешовані дані (Overpass тимчасово недоступний)" });
    }
    res.status(502).json({ success: false, error: "Не вдалося отримати банки з OpenStreetMap" });
  }
});

/* ==================== EXCHANGES API ==================== */
app.get("/api/exchanges", async (req, res) => {
  const cacheName = "cache_exchanges.json";

  const query = `
    [out:json][timeout:30];
    (
      node["amenity"="bureau_de_change"](50.57,26.15,50.68,26.38);
      way["amenity"="bureau_de_change"](50.57,26.15,50.68,26.38);
      relation["amenity"="bureau_de_change"](50.57,26.15,50.68,26.38);
    );
    out center tags;
  `;

  const lion = [
    { name: "LION KURS", address: "Рівне, вул. Кулика і Гудачека, 23", lat: 50.625864, lon: 26.200237, source: "LION" },
    { name: "LION KURS", address: "Рівне, вул. Соборна, 17", lat: 50.61859, lon: 26.25272, source: "LION" },
    { name: "LION KURS", address: "Рівне, вул. Василя Червонія, 16", lat: 50.6294, lon: 26.272404, source: "LION" },
    { name: "LION KURS", address: "Рівне, вул. Чорновола, 98а", lat: 50.595306, lon: 26.257934, source: "LION" },
    { name: "LION KURS", address: "Рівне, вул. Княгині Ольги, 1", lat: 50.616909, lon: 26.26508, source: "LION" }
  ];

  try {
    const data = await queryOverpassWithRetries(query);
    const osmPlaces = parseElementsToPlaces(data.elements || [], "Обмінник");
    const places = [...osmPlaces, ...lion];
    writeCache(cacheName, places);
    res.json({ success: true, count: places.length, osmCount: osmPlaces.length, lionCount: lion.length, places });
  } catch (err) {
    console.error("EXCHANGES API error:", err.message || err);
    const cached = readCache(cacheName);
    if (cached) {
      return res.json({ success: true, count: cached.length, osmCount: (cached.filter(p => p.source === "OpenStreetMap").length), lionCount: (cached.filter(p => p.source === "LION").length), places: cached, warning: "Повернено кешовані дані (Overpass тимчасово недоступний)" });
    }
    // якщо OSM впав — повертаємо хоча б LION
    return res.json({ success: true, count: lion.length, osmCount: 0, lionCount: lion.length, places: lion, warning: "OpenStreetMap тимчасово недоступний — повернено LION" });
  }
});

/* health */
app.get("/api/health", (req, res) => {
  res.json({ success: true, service: "FinAP Map API", status: "online" });
});

app.listen(PORT, () => console.log(`FinAP server running on http://localhost:${PORT}`));