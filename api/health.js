module.exports = function handler(
    req,
    res
) {
    res.status(200).json({
        success: true,
        service:
            "FinAP Map API",
        status:
            "online"
    });
};
