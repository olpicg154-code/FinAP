const country = document.getElementById("country");
const amount = document.getElementById("amount");
const client = document.getElementById("client");

const result = document.getElementById("riskResult");
const details = document.getElementById("riskDetails");


function getCountryScore(val) {
    const low = ["UA","PL","DE","US","GB"];
    const medium = ["TR","AE","CY"];
    const high = ["VG","PA"];

    if (low.includes(val)) return 10;
    if (medium.includes(val)) return 30;
    if (high.includes(val)) return 60;

    return 0;
}

function getClientScore(val) {
    if (val === "low") return 10;
    if (val === "medium") return 30;
    if (val === "high") return 60;
    return 0;
}

function getAmountScore(val) {
    if (val > 100000) return 60;
    if (val > 50000) return 40;
    if (val > 10000) return 20;
    return 5;
}

function calculate() {

    const c = getCountryScore(country.value);
    const a = getAmountScore(Number(amount.value));
    const cl = getClientScore(client.value);

    const total = c + a + cl;

    let level = "Низький";
    if (total > 80) level = "Високий";
    else if (total > 40) level = "Середній";

    result.textContent = level;

    details.textContent =
        `Країна: ${c} | Сума: ${a} | Клієнт: ${cl} | Бал: ${total}`;
}

document.querySelectorAll("input, select")
    .forEach(el => el.addEventListener("input", calculate));

calculate();
