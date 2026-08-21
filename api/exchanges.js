const {
    queryOverpassWithRetries,
    readCache,
    writeCache,
    parseElementsToPlaces,
    LION
} = require("../lib/map-api");

module.exports = async function handler(
    req,
    res
) {
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

    try {

        const data =
            await queryOverpassWithRetries(
                query
            );

        const osmPlaces =
            parseElementsToPlaces(
                data.elements || [],
                "Обмінник"
            );

        const places = [
            ...osmPlaces,
            ...LION
        ];

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
                osmCount:
                    osmPlaces.length,
                lionCount:
                    LION.length,
                places
            });

    } catch (error) {

        console.error(
            "Vercel exchanges error:",
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

        return res
            .status(200)
            .json({
                success: true,
                count:
                    LION.length,
                osmCount:
                    0,
                lionCount:
                    LION.length,
                places:
                    LION,
                warning:
                    "OpenStreetMap тимчасово недоступний"
            });
    }
};
