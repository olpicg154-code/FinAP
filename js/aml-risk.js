function getScore(val) {
    const low = ["UA","PL","DE","US","GB"];
    const medium = ["TR","AE","CY"];
    const high = ["VG","PA"];

    if (low.includes(val)) return 10;
    if (medium.includes(val)) return 30;
    if (high.includes(val)) return 60;

    if (val === "low") return 10;
    if (val === "medium") return 30;
    if (val === "high") return 60;

    return 0;
}

function calculateRisk() {
    const country = document.getElementById("country").value;
    const amount = Number(document.getElementById("amount").value) || 0;
    const client = document.getElementById("client").value;

    const countryScore = getScore(country);
    const clientScore = getScore(client);

    let amountScore = 0;
    if (amount > 100000) amountScore = 40;
    else if (amount > 50000) amountScore = 25;
    else if (amount > 10000) amountScore = 10;
    else amountScore = 5;

    const total = countryScore + clientScore + amountScore;

    let level = "Низький";
    let cssClass = "low";

    if (total > 70) {
        level = "Високий";
        cssClass = "high";
    } else if (total > 40) {
        level = "Середній";
        cssClass = "medium";
    }

    const result = document.getElementById("riskResult");
    const details = document.getElementById("riskDetails");
    const box = document.querySelector(".result-box");

    result.textContent = level;
    result.className = "result-value risk-" + cssClass;

    box.classList.remove("low","medium","high");
    box.classList.add(cssClass);

    details.textContent =
        "Країна: " + countryScore +
        " | Сума: " + amountScore +
        " | Клієнт: " + clientScore +
        " | Бал: " + total;
}

if(document.getElementById("country")){
document.getElementById("country").addEventListener("change", calculateRisk);
document.getElementById("amount").addEventListener("input", calculateRisk);
document.getElementById("client").addEventListener("change", calculateRisk);
}

