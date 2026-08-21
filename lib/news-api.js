const {
    fetchWithTimeout
} = require("./map-api");

function decodeXml(value = "") {
    return String(value)
        .replaceAll("&amp;", "&")
        .replaceAll("&lt;", "<")
        .replaceAll("&gt;", ">")
        .replaceAll("&quot;", '"')
        .replaceAll("&#39;", "'")
        .replaceAll("&#x27;", "'");
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
        const block of blocks
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
            !url ||
            !Number.isFinite(
                publishedAt
            )
        ) {
            continue;
        }

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

    const unique = [];
    const seen = new Set();

    for (
        const item of items
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

    unique.sort(
        (a, b) =>
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
        encodeURIComponent(query) +
        "&hl=" +
        encodeURIComponent(language) +
        "&gl=" +
        encodeURIComponent(country) +
        "&ceid=" +
        encodeURIComponent(edition);

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

    if (!response.ok) {
        throw new Error(
            `Google News HTTP ${response.status}`
        );
    }

    return await response.text();
}

async function resolveNewsUrl(url) {
    try {
        const response =
            await fetchWithTimeout(
                url,
                {
                    method: "GET",
                    redirect: "follow",
                    headers: {
                        "User-Agent":
                            "Mozilla/5.0 FinAP News Monitor"
                    }
                },
                10000
            );

        return (
            response.url ||
            url
        );
    } catch {
        return url;
    }
}

async function getFiuNews() {
    const response =
        await fetchWithTimeout(
            "https://fiu.gov.ua/news.rss",
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

    if (!response.ok) {
        throw new Error(
            `FIU RSS HTTP ${response.status}`
        );
    }

    const xml =
        await response.text();

    return parseSourceRss(
        xml,
        "Держфінмоніторинг"
    );
}

async function getSourceNews() {
    const result = {
        fatf: {
            success: true,
            count: 0,
            news: [],
            officialUrl:
                "https://www.fatf-gafi.org/en/the-fatf/news.html"
        },

        nbu: {
            success: true,
            count: 0,
            news: [],
            officialUrl:
                "https://bank.gov.ua/ua/news"
        },

        fiu: {
            success: true,
            count: 0,
            news: [],
            officialUrl:
                "https://fiu.gov.ua/"
        },

        mof: {
            success: true,
            count: 0,
            news: [],
            officialUrl:
                "https://www.mof.gov.ua/uk/news"
        },

        tax: {
            success: true,
            count: 0,
            news: [],
            officialUrl:
                "https://www.tax.gov.ua/media-tsentr/novini"
        }
    };

    /*
     * FATF
     */
    try {
        const queries = [
            "site:fatf-gafi.org/en/news FATF",
            "site:fatf-gafi.org/en/publications FATF"
        ];

        const all = [];

        for (
            const query of queries
        ) {
            try {
                const xml =
                    await getGoogleNewsRss(
                        query,
                        "en-US",
                        "US",
                        "US:en"
                    );

                all.push(
                    ...parseSourceRss(
                        xml,
                        "FATF"
                    )
                );
            } catch {
                // Один запит може не пройти — другий спробуємо.
            }
        }

        const seen = new Set();

        result.fatf.news =
            all.filter(item => {
                const key =
                    item.url || item.id;

                if (
                    seen.has(key)
                ) {
                    return false;
                }

                seen.add(key);

                return true;
            });

        result.fatf.count =
            result.fatf.news.length;

    } catch (error) {
        result.fatf.success = false;
        result.fatf.error =
            error.message;
    }

    /*
     * NBU
     */
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

        await Promise.all(
            news.map(
                async item => {
                    item.url =
                        await resolveNewsUrl(
                            item.url
                        );
                }
            )
        );

        result.nbu.news = news;
        result.nbu.count =
            news.length;

    } catch (error) {
        result.nbu.success = false;
        result.nbu.error =
            error.message;
    }

    /*
     * FIU
     */
    try {
        const news =
            await getFiuNews();

        result.fiu.news =
            news;

        result.fiu.count =
            news.length;

    } catch (error) {
        result.fiu.success = false;
        result.fiu.error =
            error.message;
    }

    /*
     * Мінфін
     */
    try {
        const xml =
            await getGoogleNewsRss(
                "site:mof.gov.ua/uk/news Мінфін",
                "uk",
                "UA",
                "UA:uk"
            );

        const news =
            parseSourceRss(
                xml,
                "Мінфін"
            );

        await Promise.all(
            news.map(
                async item => {
                    item.url =
                        await resolveNewsUrl(
                            item.url
                        );
                }
            )
        );

        result.mof.news =
            news;

        result.mof.count =
            news.length;

    } catch (error) {
        result.mof.success = false;
        result.mof.error =
            error.message;
    }

    /*
     * ДПС
     */
    try {
        const xml =
            await getGoogleNewsRss(
                "site:tax.gov.ua/media-tsentr/novini ДПС",
                "uk",
                "UA",
                "UA:uk"
            );

        const news =
            parseSourceRss(
                xml,
                "ДПС"
            );

        await Promise.all(
            news.map(
                async item => {
                    item.url =
                        await resolveNewsUrl(
                            item.url
                        );
                }
            )
        );

        result.tax.news =
            news;

        result.tax.count =
            news.length;

    } catch (error) {
        result.tax.success = false;
        result.tax.error =
            error.message;
    }

    return result;
}

async function getSanctionsNews() {
    const result = {
        rnbo: {
            success: true,
            count: 0,
            news: [],
            officialUrl:
                "https://drs.nsdc.gov.ua/"
        },

        ofac: {
            success: true,
            count: 0,
            news: [],
            officialUrl:
                "https://ofac.treasury.gov/recent-actions/sanctions-list-updates"
        },

        eu: {
            success: true,
            count: 0,
            news: [],
            officialUrl:
                "https://finance.ec.europa.eu/eu-and-world/sanctions-restrictive-measures/overview-sanctions-and-related-resources_en"
        }
    };

    /*
     * РНБО
     */
    try {
        const xml =
            await getGoogleNewsRss(
                "site:rnbo.gov.ua санкції",
                "uk",
                "UA",
                "UA:uk"
            );

        const news =
            parseSourceRss(
                xml,
                "РНБО"
            );

        await Promise.all(
            news.map(
                async item => {
                    item.url =
                        await resolveNewsUrl(
                            item.url
                        );
                }
            )
        );

        result.rnbo.news =
            news;

        result.rnbo.count =
            news.length;

    } catch (error) {
        result.rnbo.success = false;
        result.rnbo.error =
            error.message;
    }

    /*
     * OFAC
     */
    try {
        const xml =
            await getGoogleNewsRss(
                "site:ofac.treasury.gov/recent-actions sanctions",
                "en-US",
                "US",
                "US:en"
            );

        const news =
            parseSourceRss(
                xml,
                "OFAC"
            );

        await Promise.all(
            news.map(
                async item => {
                    item.url =
                        await resolveNewsUrl(
                            item.url
                        );
                }
            )
        );

        result.ofac.news =
            news;

        result.ofac.count =
            news.length;

    } catch (error) {
        result.ofac.success = false;
        result.ofac.error =
            error.message;
    }

    /*
     * EU
     */
    try {
        const xml =
            await getGoogleNewsRss(
                "site:finance.ec.europa.eu sanctions restrictive measures",
                "en-US",
                "EU",
                "EU:en"
            );

        const news =
            parseSourceRss(
                xml,
                "EU"
            );

        await Promise.all(
            news.map(
                async item => {
                    item.url =
                        await resolveNewsUrl(
                            item.url
                        );
                }
            )
        );

        result.eu.news =
            news;

        result.eu.count =
            news.length;

    } catch (error) {
        result.eu.success = false;
        result.eu.error =
            error.message;
    }

    return result;
}

module.exports = {
    getSourceNews,
    getSanctionsNews
};
