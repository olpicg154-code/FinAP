const {
    getSourceNews
} = require("../lib/news-api");

let cache = null;
let cacheTime = 0;

const CACHE_MS =
    10 * 60 * 1000;

module.exports = async function handler(
    req,
    res
) {
    try {

        const now = Date.now();

        if (
            cache &&
            now - cacheTime < CACHE_MS
        ) {
            return res
                .status(200)
                .json(cache);
        }

        const sources =
            await getSourceNews();

        cache = {
            success: true,
            generatedAt:
                new Date().toISOString(),
            checkedEvery:
                "10 minutes",
            sources
        };

        cacheTime = now;

        res.setHeader(
            "Cache-Control",
            "no-store"
        );

        return res
            .status(200)
            .json(cache);

    } catch (error) {

        console.error(
            "Vercel source-news error:",
            error
        );

        return res
            .status(502)
            .json({
                success: false,
                error:
                    "Не вдалося перевірити джерела новин"
            });
    }
};
