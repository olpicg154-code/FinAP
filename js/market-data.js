async function fetchRates(date = "") {

    const url = date
        ? `https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?date=${date}&json`
        : `https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json`;

    const res = await fetch(url);

    if (!res.ok) {
        throw new Error(`NBU API error: ${res.status}`);
    }

    const data = await res.json();

    const get = (cc) => {
        const item = data.find(x => x.cc === cc);
        return item ? Number(item.rate) : null;
    };

    return {
        usd: get("USD"),
        eur: get("EUR")
    };
}


// ======================
// FORMAT DATE
// ======================

function formatDate(d) {

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");

    return `${yyyy}${mm}${dd}`;
}


// ======================
// PREVIOUS RATES
// ======================

async function getPreviousRates(todayRates) {

    const d = new Date();

    for (let i = 1; i <= 5; i++) {

        d.setDate(d.getDate() - 1);

        try {

            const prev = await fetchRates(formatDate(d));

            if (
                prev.usd !== null &&
                prev.eur !== null
            ) {
                return prev;
            }

        } catch (error) {

            console.warn("FinAP: previous rate unavailable", error);

        }
    }

    return todayRates;
}


// ======================
// TREND
// ======================

function getTrendText(value) {

    if (value > 0) return "зростання за добу";
    if (value < 0) return "зниження за добу";

    return "без змін";
}


// ======================
// RENDER
// ======================

function renderRates({ usd, eur, usdChange, eurChange }) {

    const usdRateEl = document.getElementById("usdRate");
    const eurRateEl = document.getElementById("eurRate");

    const usdChangeEl = document.getElementById("usdChange");
    const eurChangeEl = document.getElementById("eurChange");

    if (!usdRateEl || !eurRateEl) {

        console.error("FinAP: currency elements not found");

        return;
    }


    // Курс за 1 одиницю валюти

    usdRateEl.textContent = usd.toFixed(2);

    eurRateEl.textContent = eur.toFixed(2);


    function setChange(el, value) {

        if (!el) return;

        el.classList.remove("up", "down");

        if (value > 0) {

            el.classList.add("up");

            el.textContent =
                "+" + value.toFixed(2) +
                "% · " +
                getTrendText(value);

        } else if (value < 0) {

            el.classList.add("down");

            el.textContent =
                value.toFixed(2) +
                "% · " +
                getTrendText(value);

        } else {

            el.textContent = "0.00% · без змін";
        }
    }


    setChange(usdChangeEl, usdChange);

    setChange(eurChangeEl, eurChange);
}


// ======================
// MAIN
// ======================

async function updateMarketData() {

    console.log("FinAP: loading currency data...");

    try {

        // Спочатку отримуємо сьогоднішні курси

        const today = await fetchRates();

        console.log("FinAP: today rates:", today);


        if (
            today.usd === null ||
            today.eur === null
        ) {

            throw new Error("USD/EUR not found in NBU response");
        }


        // Одразу показуємо курси

        renderRates({
            usd: today.usd,
            eur: today.eur,
            usdChange: 0,
            eurChange: 0
        });


        // Потім шукаємо попередній курс

        const prev = await getPreviousRates(today);

        const usdChange =
            ((today.usd - prev.usd) / prev.usd) * 100;

        const eurChange =
            ((today.eur - prev.eur) / prev.eur) * 100;


        // Оновлюємо зміни

        renderRates({
            usd: today.usd,
            eur: today.eur,
            usdChange,
            eurChange
        });


        console.log("FinAP: currency data updated");

    } catch (error) {

        console.error(
            "FinAP: currency loading error:",
            error
        );

        const usdRateEl =
            document.getElementById("usdRate");

        const eurRateEl =
            document.getElementById("eurRate");

        if (usdRateEl)
            usdRateEl.textContent = "—";

        if (eurRateEl)
            eurRateEl.textContent = "—";
    }
}


// ======================
// START
// ======================

updateMarketData();
