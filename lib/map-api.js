const fs = require("fs");
const path = require("path");
const { setTimeout: wait } = require("timers/promises");

const OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter"
];

const CACHE_DIR = path.join(
    process.cwd(),
    "data"
);

const CACHE_TTL = 12 * 60 * 60;

if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, {
        recursive: true
    });
}

async function fetchWithTimeout(
    url,
    options = {},
    timeout = 12000
) {
    const controller = new AbortController();

    const timer = setTimeout(
        () => controller.abort(),
        timeout
    );

    try {
        const response = await fetch(
            url,
            {
                ...options,
                signal: controller.signal
            }
        );

        clearTimeout(timer);

        return response;
    } catch (error) {
        clearTimeout(timer);
        throw error;
    }
}

async function queryOverpassWithRetries(
    query,
    tries = 3,
    backoff = 800
) {
    let lastError = null;

    for (
        let attempt = 1;
        attempt <= tries;
        attempt++
    ) {
        for (
            const endpoint of OVERPASS_ENDPOINTS
        ) {
            try {
                const response =
                    await fetchWithTimeout(
                        endpoint,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type":
                                    "application/x-www-form-urlencoded",
                                "User-Agent":
                                    "FinAP-Rivne-Map/1.0"
                            },
                            body:
                                "data=" +
                                encodeURIComponent(query)
                        },
                        12000
                    );

                if (!response.ok) {
                    throw new Error(
                        `${endpoint} HTTP ${response.status}`
                    );
                }

                return await response.json();

            } catch (error) {
                lastError = error;
            }
        }

        if (attempt < tries) {
            await wait(
                backoff * attempt
            );
        }
    }

    throw (
        lastError ||
        new Error("Overpass unavailable")
    );
}

function readCache(filename) {
    const file = path.join(
        CACHE_DIR,
        filename
    );

    if (!fs.existsSync(file)) {
        return null;
    }

    try {
        const raw =
            fs.readFileSync(
                file,
                "utf8"
            );

        const object =
            JSON.parse(raw);

        const now =
            Math.floor(
                Date.now() / 1000
            );

        if (
            object._ts &&
            now - object._ts < CACHE_TTL
        ) {
            return object.data;
        }

        return null;
    } catch {
        return null;
    }
}

function writeCache(
    filename,
    data
) {
    const file =
        path.join(
            CACHE_DIR,
            filename
        );

    try {
        fs.writeFileSync(
            file,
            JSON.stringify({
                _ts:
                    Math.floor(
                        Date.now() / 1000
                    ),
                data
            }),
            "utf8"
        );
    } catch (error) {
        console.warn(
            "Cache write failed:",
            error.message
        );
    }
}

function parseElementsToPlaces(
    elements,
    fallbackName
) {
    return (elements || [])
        .map(element => {
            const lat =
                element.lat ??
                element.center?.lat;

            const lon =
                element.lon ??
                element.center?.lon;

            const tags =
                element.tags || {};

            if (
                typeof lat !== "number" ||
                typeof lon !== "number"
            ) {
                return null;
            }

            return {
                id: element.id,
                name:
                    tags.name ||
                    tags.brand ||
                    tags.operator ||
                    fallbackName,

                address:
                    [
                        tags["addr:street"],
                        tags["addr:housenumber"]
                    ]
                    .filter(Boolean)
                    .join(", "),

                lat,
                lon,

                source:
                    "OpenStreetMap"
            };
        })
        .filter(Boolean);
}

const LION = [
    {
        name: "LION KURS",
        address:
            "Рівне, вул. Кулика і Гудачека, 23",
        lat: 50.625864,
        lon: 26.200237,
        source: "LION"
    },
    {
        name: "LION KURS",
        address:
            "Рівне, вул. Соборна, 17",
        lat: 50.61859,
        lon: 26.25272,
        source: "LION"
    },
    {
        name: "LION KURS",
        address:
            "Рівне, вул. Василя Червонія, 16",
        lat: 50.6294,
        lon: 26.272404,
        source: "LION"
    },
    {
        name: "LION KURS",
        address:
            "Рівне, вул. Чорновола, 98а",
        lat: 50.595306,
        lon: 26.257934,
        source: "LION"
    },
    {
        name: "LION KURS",
        address:
            "Рівне, вул. Княгині Ольги, 1",
        lat: 50.616909,
        lon: 26.26508,
        source: "LION"
    }
];

module.exports = {
    fetchWithTimeout,
    queryOverpassWithRetries,
    readCache,
    writeCache,
    parseElementsToPlaces,
    LION
};
