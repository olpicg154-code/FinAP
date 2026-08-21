const {
    queryOverpassWithRetries,
    readCache,
    writeCache,
    parseElementsToPlaces
} = require("../lib/map-api");

module.exports = async function handler(
    req,
    res
) {
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
                data.elements || [],
                "Банк"
            );

        writeCache(
            cacheName,
            places
        );

        return res
            .status(200)
            .json({
                success: true,
                count:
                    places.length,
                places
            });

    } catch (error) {

        console.error(
            "Vercel banks error:",
            error.message
        );

        const cached =
            readCache(
                cacheName
            );

        if (cached) {

            return res
                .status(200)
                .json({
                    success: true,
                    count:
                        cached.length,
                    places:
                        cached,
                    warning:
                        "Повернено кешовані дані"
                });
        }

        return res
            .status(502)
            .json({
                success: false,
                error:
                    "Не вдалося отримати банки з OpenStreetMap"
            });
    }
};
