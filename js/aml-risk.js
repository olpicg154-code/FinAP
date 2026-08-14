const country = document.getElementById("country");
const client = document.getElementById("clientType");
const pep = document.getElementById("pep");
const amount = document.getElementById("amount");
const operation = document.getElementById("operation");

const result = document.getElementById("riskResult");
const text = document.getElementById("riskText");
const breakdown = document.getElementById("riskBreakdown");
const scoreEl = document.getElementById("riskScore");
const adviceEl = document.getElementById("riskAdvice");


// країни
function getCountryScore(val) {

    const low = ["UA","PL","DE","US","GB"];
    const medium = ["TR","AE","CY"];
    const high = ["VG","PA"];

    if (low.includes(val)) return {score:10, label:"низький ризик країни"};
    if (medium.includes(val)) return {score:30, label:"середній ризик країни"};
    if (high.includes(val)) return {score:60, label:"високий ризик країни"};

    return {score:0, label:""};
}


// універсальна
function getScore(val) {
    if (val === "low") return 10;
    if (val === "medium") return 30;
    if (val === "high") return 60;
    return Number(val) || 0;
}


function calculateRisk() {

    let score = 0;
    let details = [];

    // країна
    const c = getCountryScore(country.value);
    score += c.score;
    if (c.score) details.push(`+${c.score} країна (${c.label})`);

    // клієнт
    const clientScore = getScore(client.value);
    score += clientScore;
    if (clientScore) details.push(`+${clientScore} тип клієнта`);

    // операція
    const opScore = getScore(operation.value);
    score += opScore;
    if (opScore) details.push(`+${opScore} тип операції`);

    // PEP
    const pepScore = Number(pep.value);
    score += pepScore;
    if (pepScore) details.push(`+${pepScore} PEP`);

    // сума
    const amt = Number(amount.value);

    if (amt > 100000) {
        score += 40;
        details.push("+40 велика сума");
    }
    else if (amt > 50000) {
        score += 25;
        details.push("+25 середня сума");
    }
    else if (amt > 10000) {
        score += 10;
        details.push("+10 підвищена сума");
    }


    let level = "";
    let description = "";
    let advice = "";

    if (score >= 100) {
        level = "HIGH RISK";
        result.style.color = "#ff4d4d";
        description = "Потрібна посилена перевірка (EDD)";
        advice = "Рекомендується: EDD, перевірка джерела коштів, санкційний скринінг";
    }
    else if (score >= 50) {
        level = "MEDIUM RISK";
        result.style.color = "#ffb84d";
        description = "Рекомендується додатковий контроль";
        advice = "Рекомендується: додаткові документи, моніторинг операцій";
    }
    else {
        level = "LOW RISK";
        result.style.color = "#65d68b";
        description = "Стандартна перевірка (CDD)";
        advice = "Рекомендується: стандартний KYC / CDD";
    }

    result.textContent = level;
    text.textContent = description;

    // 🔥 score
    scoreEl.textContent = `${score} / 200`;

    // 🔥 пояснення
    breakdown.innerHTML = details.length
        ? details.join("<br>")
        : "Немає факторів ризику";

    // 🔥 рекомендація
    adviceEl.textContent = advice;
}


document.querySelectorAll("select, input")
    .forEach(el => el.addEventListener("input", calculateRisk));
