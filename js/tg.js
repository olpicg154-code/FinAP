document.addEventListener("DOMContentLoaded", async () => {

    const btn = document.createElement("a");
    btn.href = "https://t.me/finap_channel";
    btn.target = "_blank";
    btn.className = "tg-btn";

    document.body.appendChild(btn);

    let lastRead = localStorage.getItem("finap_last_news") || 0;

    async function updateBadge() {
        try {
            const res = await fetch("news.json");
            const data = await res.json();

            const unread = data.length - lastRead;

            if (unread > 0) {
                btn.innerText = `Telegram +${unread}`;
            } else {
                btn.innerText = "Telegram";
            }

        } catch (e) {
            btn.innerText = "Telegram";
        }
    }

    updateBadge();

    btn.addEventListener("click", () => {
        fetch("news.json")
            .then(r => r.json())
            .then(data => {
                localStorage.setItem("finap_last_news", data.length);
                btn.innerText = "Telegram";
            });
    });

});