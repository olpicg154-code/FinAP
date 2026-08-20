const fs = require("fs");
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