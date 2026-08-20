const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const IMAGES_DIR = path.join(__dirname, "images");

app.use("/images", express.static(IMAGES_DIR));

app.get("/api/images", (req, res) => {
    try {
        const files = fs.readdirSync(IMAGES_DIR);

        const images = files.filter(file =>
            file.endsWith(".jpg") ||
            file.endsWith(".png") ||
            file.endsWith(".jpeg") ||
            file.endsWith(".webp")
        );

        res.json(images);
    } catch (err) {
        res.status(500).json({ error: "Cannot read images folder" });
    }
});

app.listen(3000, () => {
    console.log("FinAP Image Server running on http://localhost:3000");
});
