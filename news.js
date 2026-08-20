<<<<<<< HEAD
﻿const fs = require("fs");
const axios = require("axios");
const cheerio = require("cheerio");

const URL = "https://finap.com.ua/novini/";

async function loadNews() {
    try {
        const { data } = await axios.get(URL);
        const $ = cheerio.load(data);

        let news = [];

        // 🔥 універсальний захват статей
        $("article, .elementor-post, .post").each((i, el) => {

            const title = $(el).find("h2, h3, .elementor-post__title a").first().text().trim();
            const link = $(el).find("a").first().attr("href");

            if (title && link) {
                news.push({
                    title,
                    link,
                    date: new Date().toISOString()
                });
            }
        });

        // якщо fallback не спрацював
        if (news.length === 0) {
            $(".elementor-post__title a").each((i, el) => {
                news.push({
                    title: $(el).text().trim(),
                    link: $(el).attr("href"),
                    date: new Date().toISOString()
                });
            });
        }

        fs.writeFileSync("news.json", JSON.stringify(news, null, 2), "utf8");

        console.log("NEWS UPDATED ✔", news.length);

    } catch (err) {
        console.log("NEWS ERROR:", err.message);
    }
}

loadNews();
=======
﻿const Parser = require("rss-parser");
const fs = require("fs");

const parser = new Parser();

const sources = [
  "https://bank.gov.ua/rss/news",
  "https://minfin.com.ua/ua/rss/",
  "https://liga.net/news/rss.xml"
];

const keywords = ["банк", "НБУ", "подат", "санкц"];

function isRelevant(title = "") {
  return keywords.some(k => title.toLowerCase().includes(k));
}

(async () => {
  let all = [];

  for (const url of sources) {
    try {
      const feed = await parser.parseURL(url);

      for (const item of feed.items || []) {
        if (isRelevant(item.title)) {
          all.push({
            title: item.title,
            link: item.link,
            date: item.pubDate,
            isNew: true
          });
        }
      }

    } catch (e) {
      console.log("RSS error:", url);
    }
  }

  all = all.slice(0, 10);

  fs.writeFileSync("news.json", JSON.stringify(all, null, 2));

  console.log("NEWS UPDATED ✔");
})();
>>>>>>> 7714e4a5777fb4cc092dfa7e7a2333b3d03ee75e
