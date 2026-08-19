const Parser = require("rss-parser");
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
