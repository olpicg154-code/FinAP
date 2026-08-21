// ============================================================
// FINAP SERVER
// Карта Рівного + FATF + НБУ
// ============================================================

const express = require("express");
const fs = require("fs");
const path = require("path");
const { setTimeout: wait } = require("timers/promises");

const app = express();

const PORT =
    process.env.PORT || 3000;


// ============================================================
// OVERPASS
// ============================================================

const OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter"
];


// ============================================================
// CACHE
// ============================================================

const CACHE_DIR =
    path.join(__dirname, "data");

if (
    !fs.existsSync(CACHE_DIR)
) {
    fs.mkdirSync(
        CACHE_DIR,
        {
            recursive: true
        }
    );
}

const CACHE_TTL =
    12 * 60 * 60;


// ============================================================
// STATIC
// ============================================================

app.use(
    express.static(".")
);


// ============================================================
// GENERIC FETCH WITH TIMEOUT
// ============================================================

async function fetchWithTimeout(
    url,
    options = {},
    timeout = 12000
) {

    const controller =
        new AbortController();

    const timer =
        setTimeout(
            () =>
                controller.abort(),
            timeout
        );

    try {

        const response =
            await fetch(
                url,
                {
                    ...options,
                    signal:
                        controller.signal
                }
            );

        clearTimeout(timer);

        return response;

    } catch (error) {

        clearTimeout(timer);

        throw error;
    }
}


// ============================================================
// OVERPASS QUERY WITH RETRIES
// ============================================================

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
            const endpoint of
            OVERPASS_ENDPOINTS
        ) {

            try {

                const response =
                    await fetchWithTimeout(
                        endpoint,
                        {
                            method:
                                "POST",

                            headers: {
                                "Content-Type":
                                    "application/x-www-form-urlencoded",

                                "User-Agent":
                                    "FinAP-Rivne-Map/1.0"
                            },

                            body:
                                "data=" +
                                encodeURIComponent(
                                    query
                                )
                        },
                        12000
                    );

                if (
                    !response.ok
                ) {

                    throw new Error(
                        `${endpoint} HTTP ${response.status}`
                    );
                }

                return await response.json();

            } catch (error) {

                lastError =
                    error;
            }
        }

        if (
            attempt < tries
        ) {

            await wait(
                backoff * attempt
            );
        }
    }

    throw (
        lastError ||
        new Error(
            "Overpass unavailable"
        )
    );
}


// ============================================================
// CACHE HELPERS
// ============================================================

function readCache(
    filename
) {

    const file =
        path.join(
            CACHE_DIR,
            filename
        );

    if (
        !fs.existsSync(file)
    ) {
        return null;
    }

    try {

        const raw =
            fs.readFileSync(
                file,
                "utf8"
            );

        const object =
            JSON.parse(
                raw
            );

        const now =
            Math.floor(
                Date.now() / 1000
            );

        if (
            object._ts &&
            now - object._ts <
                CACHE_TTL
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

    const object = {
        _ts:
            Math.floor(
                Date.now() / 1000
            ),

        data
    };

    try {

        fs.writeFileSync(
            file,
            JSON.stringify(
                object
            ),
            "utf8"
        );

    } catch (error) {

        console.warn(
            "Cache write failed:",
            error.message
        );
    }
}


// ============================================================
// OSM PARSER
// ============================================================

function parseElementsToPlaces(
    elements,
    fallbackName
) {

    return (
        elements || []
    )
        .map(
            element => {

                const lat =
                    element.lat ??
                    element.center?.lat;

                const lon =
                    element.lon ??
                    element.center?.lon;

                const tags =
                    element.tags ||
                    {};

                if (
                    typeof lat !==
                        "number" ||
                    typeof lon !==
                        "number"
                ) {

                    return null;
                }

                return {

                    id:
                        element.id,

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
                        .filter(
                            Boolean
                        )
                        .join(
                            ", "
                        ),

                    lat,
                    lon,

                    source:
                        "OpenStreetMap"
                };
            }
        )
        .filter(
            Boolean
        );
}


// ============================================================
// BANKS API
// ============================================================

app.get(
    "/api/banks",
    async (req, res) => {

        const cacheName =
            "cache_banks.json";

        const query = `
            [out:json][timeout:30];

            (
                node["amenity"="bank"]
                (50.57,26.15,50.68,26.38);

                way["amenity"="bank"]
                (50.57,26.15,50.68,26.38);

                relation["amenity"="bank"]
                (50.57,26.15,50.68,26.38);
            );

            out center tags;
        `;

        try {

            const data =
                await queryOverpassWithRetries(
                    query
                );

            const places =
                parseElementsToPlaces(
                    data.elements ||
                    [],
                    "Банк"
                );

            writeCache(
                cacheName,
                places
            );

            res.json({

                success:
                    true,

                count:
                    places.length,

                places
            });

        } catch (error) {

            console.error(
                "BANK API error:",
                error.message
            );

            const cached =
                readCache(
                    cacheName
                );

            if (cached) {

                return res.json({

                    success:
                        true,

                    count:
                        cached.length,

                    places:
                        cached,

                    warning:
                        "Повернено кешовані дані"
                });
            }

            res.status(
                502
            ).json({

                success:
                    false,

                error:
                    "Не вдалося отримати банки з OpenStreetMap"
            });
        }
    }
);


// ============================================================
// EXCHANGES API
// ============================================================

app.get(
    "/api/exchanges",
    async (req, res) => {

        const cacheName =
            "cache_exchanges.json";

        const query = `
            [out:json][timeout:30];

            (
                node["amenity"="bureau_de_change"]
                (50.57,26.15,50.68,26.38);

                way["amenity"="bureau_de_change"]
                (50.57,26.15,50.68,26.38);

                relation["amenity"="bureau_de_change"]
                (50.57,26.15,50.68,26.38);
            );

            out center tags;
        `;

        const lion = [

            {
                name:
                    "LION KURS",

                address:
                    "Рівне, вул. Кулика і Гудачека, 23",

                lat:
                    50.625864,

                lon:
                    26.200237,

                source:
                    "LION"
            },

            {
                name:
                    "LION KURS",

                address:
                    "Рівне, вул. Соборна, 17",

                lat:
                    50.61859,

                lon:
                    26.25272,

                source:
                    "LION"
            },

            {
                name:
                    "LION KURS",

                address:
                    "Рівне, вул. Василя Червонія, 16",

                lat:
                    50.6294,

                lon:
                    26.272404,

                source:
                    "LION"
            },

            {
                name:
                    "LION KURS",

                address:
                    "Рівне, вул. Чорновола, 98а",

                lat:
                    50.595306,

                lon:
                    26.257934,

                source:
                    "LION"
            },

            {
                name:
                    "LION KURS",

                address:
                    "Рівне, вул. Княгині Ольги, 1",

                lat:
                    50.616909,

                lon:
                    26.26508,

                source:
                    "LION"
            }
        ];

        try {

            const data =
                await queryOverpassWithRetries(
                    query
                );

            const osmPlaces =
                parseElementsToPlaces(
                    data.elements ||
                    [],
                    "Обмінник"
                );

            const places = [
                ...osmPlaces,
                ...lion
            ];

            writeCache(
                cacheName,
                places
            );

            res.json({

                success:
                    true,

                count:
                    places.length,

                osmCount:
                    osmPlaces.length,

                lionCount:
                    lion.length,

                places
            });

        } catch (error) {

            console.error(
                "EXCHANGES API error:",
                error.message
            );

            const cached =
                readCache(
                    cacheName
                );

            if (cached) {

                return res.json({

                    success:
                        true,

                    count:
                        cached.length,

                    osmCount:
                        cached.filter(
                            item =>
                                item.source ===
                                "OpenStreetMap"
                        ).length,

                    lionCount:
                        cached.filter(
                            item =>
                                item.source ===
                                "LION"
                        ).length,

                    places:
                        cached,

                    warning:
                        "Повернено кешовані дані"
                });
            }

            return res.json({

                success:
                    true,

                count:
                    lion.length,

                osmCount:
                    0,

                lionCount:
                    lion.length,

                places:
                    lion,

                warning:
                    "OpenStreetMap тимчасово недоступний"
            });
        }
    }
);


// ============================================================
// HEALTH
// ============================================================

app.get(
    "/api/health",
    (req, res) => {

        res.json({

            success:
                true,

            service:
                "FinAP Map API",

            status:
                "online"
        });
    }
);


// ============================================================
// NEWS HELPERS
// ============================================================

function decodeXml(
    value = ""
) {

    return String(value)

        .replaceAll(
            "&amp;",
            "&"
        )

        .replaceAll(
            "&lt;",
            "<"
        )

        .replaceAll(
            "&gt;",
            ">"
        )

        .replaceAll(
            "&quot;",
            '"'
        )

        .replaceAll(
            "&#39;",
            "'"
        )

        .replaceAll(
            "&#x27;",
            "'"
        );
}


function parseSourceRss(
    xml,
    sourceName
) {

    const items = [];

    const blocks =
        xml.match(
            /<item>[\s\S]*?<\/item>/gi
        ) || [];

    for (
        const block of
        blocks
    ) {

        const titleMatch =
            block.match(
                /<title>([\s\S]*?)<\/title>/i
            );

        const linkMatch =
            block.match(
                /<link>([\s\S]*?)<\/link>/i
            );

        const dateMatch =
            block.match(
                /<pubDate>([\s\S]*?)<\/pubDate>/i
            );

        if (
            !titleMatch ||
            !linkMatch
        ) {

            continue;
        }

        const title =
            decodeXml(
                titleMatch[1]
            )
            .replace(
                /<[^>]+>/g,
                " "
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim();

        const url =
            decodeXml(
                linkMatch[1]
            ).trim();

        const dateText =
            dateMatch
                ? decodeXml(
                    dateMatch[1]
                ).trim()
                : "";

        const publishedAt =
            Date.parse(
                dateText
            );

        if (
            !title ||
            !url
        ) {

            continue;
        }

        if (
            !Number.isFinite(
                publishedAt
            )
        ) {

            continue;
        }

        /*
         * Тільки останні 24 години.
         */

        const age =
            Date.now() -
            publishedAt;

        if (
            age < 0 ||
            age >
                24 *
                60 *
                60 *
                1000
        ) {

            continue;
        }

        items.push({

            id:
                `${sourceName}:${url}:${publishedAt}`,

            title,

            url,

            publishedAt,

            source:
                sourceName
        });
    }

    /*
     * Видаляємо дублікати.
     */

    const unique = [];

    const seen =
        new Set();

    for (
        const item of
        items
    ) {

        if (
            seen.has(
                item.url
            )
        ) {

            continue;
        }

        seen.add(
            item.url
        );

        unique.push(
            item
        );
    }

    /*
     * Найсвіжіші першими.
     */

    unique.sort(
        (
            a,
            b
        ) =>
            b.publishedAt -
            a.publishedAt
    );

    return unique;
}


async function getGoogleNewsRss(
    query,
    language,
    country,
    edition
) {

    const url =
        "https://news.google.com/rss/search" +
        "?q=" +
        encodeURIComponent(
            query
        ) +
        "&hl=" +
        encodeURIComponent(
            language
        ) +
        "&gl=" +
        encodeURIComponent(
            country
        ) +
        "&ceid=" +
        encodeURIComponent(
            edition
        );

    const response =
        await fetchWithTimeout(
            url,
            {
                headers: {

                    "User-Agent":
                        "Mozilla/5.0 FinAP News Monitor",

                    "Accept":
                        "application/rss+xml, application/xml, text/xml"
                }
            },
            12000
        );

    if (
        !response.ok
    ) {

        throw new Error(
            `Google News HTTP ${response.status}`
        );
    }

    return await response.text();
}


// ============================================================
// SOURCE NEWS
// FATF + NBU
// ============================================================

const SOURCE_NEWS_CACHE =
    new Map();


async function getSourceNews() {

    const result = {

        fatf: {

            success:
                false,

            count:
                0,

            news:
                [],

            officialUrl:
                "https://www.fatf-gafi.org/en/the-fatf/news.html"
        },

        nbu: {

            success:
                false,

            count:
                0,

            news:
                [],

            officialUrl:
                "https://bank.gov.ua/ua/news"
        }
    };


    // ========================================================
    // FATF — ДВА ЗАПИТИ
    // ========================================================

    try {

        const fatfQueries = [

            "site:fatf-gafi.org/en/news FATF",

            "site:fatf-gafi.org/en/publications FATF"

        ];

        const allFatf = [];

        for (
            const query of
            fatfQueries
        ) {

            try {

                const xml =
                    await getGoogleNewsRss(
                        query,
                        "en-US",
                        "US",
                        "US:en"
                    );

                const news =
                    parseSourceRss(
                        xml,
                        "FATF"
                    );

                allFatf.push(
                    ...news
                );

            } catch (error) {

                console.warn(
                    "FATF query failed:",
                    error.message
                );
            }
        }

        /*
         * Унікальні FATF новини.
         */

        const uniqueFatf = [];

        const seenFatf =
            new Set();

        for (
            const item of
            allFatf
        ) {

            const key =
                item.url ||
                item.id;

            if (
                seenFatf.has(
                    key
                )
            ) {

                continue;
            }

            seenFatf.add(
                key
            );

            uniqueFatf.push(
                item
            );
        }

        uniqueFatf.sort(
            (
                a,
                b
            ) =>
                b.publishedAt -
                a.publishedAt
        );

        result.fatf = {

            success:
                true,

            count:
                uniqueFatf.length,

            news:
                uniqueFatf.slice(
                    0,
                    20
                ),

            officialUrl:
                "https://www.fatf-gafi.org/en/the-fatf/news.html"
        };

    } catch (error) {

        console.error(
            "FATF source error:",
            error.message
        );
    }


    // ========================================================
    // NBU
    // ========================================================

    try {

        const xml =
            await getGoogleNewsRss(
                "site:bank.gov.ua/ua/news НБУ",
                "uk",
                "UA",
                "UA:uk"
            );

        const news =
            parseSourceRss(
                xml,
                "НБУ"
            );

        result.nbu = {

            success:
                true,

            count:
                news.length,

            news,

            officialUrl:
                "https://bank.gov.ua/ua/news"
        };

    } catch (error) {

        console.error(
            "NBU source error:",
            error.message
        );
    }


    return result;
}


// ============================================================
// SOURCE NEWS API
// Кеш 10 хвилин
// ============================================================

app.get(
    "/api/source-news",
    async (req, res) => {

        try {

            const now =
                Date.now();

            const cached =
                SOURCE_NEWS_CACHE.get(
                    "sources"
                );

            if (
                cached &&
                now -
                    cached.time <
                    10 *
                    60 *
                    1000
            ) {

                return res.json(
                    cached.data
                );
            }

            const sources =
                await getSourceNews();

            const data = {

                success:
                    true,

                generatedAt:
                    new Date()
                        .toISOString(),

                checkedEvery:
                    "10 minutes",

                sources
            };

            SOURCE_NEWS_CACHE.set(
                "sources",
                {
                    time:
                        now,

                    data
                }
            );

            res.setHeader(
                "Cache-Control",
                "no-store"
            );

            res.json(
                data
            );

        } catch (error) {

            console.error(
                "SOURCE NEWS API ERROR:",
                error
            );

            res.status(
                502
            ).json({

                success:
                    false,

                error:
                    "Не вдалося перевірити джерела новин"
            });
        }
    }
);


// ============================================================
// START
// ============================================================

app.listen(
    PORT,
    () => {

        console.log(
            `FinAP server running on http://localhost:${PORT}`
        );

    }
);