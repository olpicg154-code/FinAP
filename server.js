const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
app.use(cors());

// 🔵 1. САЙТ (все з C:\FinAP)
app.use(express.static(path.join(__dirname)));

// 🔵 2. RSS PROXY (стабільний)
app.get("/rss", async (req, res) => {
  try {
    const response = await fetch("https://finap.com.ua/feed/");
    const data = await response.text();

    res.setHeader("Content-Type", "application/xml");
    res.send(data);
  } catch (e) {
    res.status(500).send("RSS error");
  }
});

// 🔵 3. SERVER START
app.listen(3000, () => {
  console.log("FINAP SERVER RUNNING http://localhost:3000");
});