let seen = new Set();

async function loadFinapRSS() {
  try {
    const res = await fetch('http://localhost:3000/rss' + "?t=" + Date.now(, { cache: "no-store" }));
    const xmlText = await res.text();

    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlText, 'text/xml');

    const items = [...xml.querySelectorAll('item')];
    const track = document.querySelector('.finap-track');

    if (!track) return;

    items.forEach(item => {
      const title = item.querySelector('title')?.textContent || '';

      if (seen.has(title)) return;
      seen.add(title);

      const el = document.createElement('div');
      el.className = 'finap-item';
      el.textContent = '📰 ' + title;

      console.log("NEW ITEM"); track.appendChild(el);
    });

  } catch (e) {
    console.error('RSS error', e);
  }
}

loadFinapRSS();
setInterval(loadFinapRSS, 15000);











