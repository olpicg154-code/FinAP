function getCountryScore(c) {
    if (["UA","PL","DE","US","GB"].includes(c)) return 10;
    if (["TR","AE","CY"].includes(c)) return 30;
    if (["VG","PA"].includes(c)) return 60;
    return 0;
}

function calculateTransaction() {

    const amount = Number(document.getElementById("amount").value) || 0;
    const country = document.getElementById("country").value;
    const client = document.getElementById("client").value;
    const frequency = document.getElementById("frequency").value;

    let score = 0;

    score += getCountryScore(country);

    if (client === "risk") score += 30;
    if (client === "pep") score += 60;

    if (frequency === "medium") score += 20;
    if (frequency === "high") score += 40;

    if (amount > 100000) score += 40;
    else if (amount > 50000) score += 25;
    else if (amount > 10000) score += 10;
    else score += 5;

    let status = "ДОЗВОЛЕНО";
    let cls = "low";

    if (score > 90) {
        status = "ВІДХИЛЕНО";
        cls = "high";
    } else if (score > 50) {
        status = "ПЕРЕВІРКА";
        cls = "medium";
    }

    const el = document.getElementById("status");
    const box = document.querySelector(".result-box");
    const details = document.getElementById("details");

    el.textContent = status;
    el.className = "result-value risk-" + cls;

    box.classList.remove("low","medium","high");
    box.classList.add(cls);

    details.textContent = "Ризиковий бал: " + score;
}

if(document.getElementById("amount")){
document.getElementById("amount").addEventListener("input", calculateTransaction);
document.getElementById("country").addEventListener("change", calculateTransaction);
document.getElementById("client").addEventListener("change", calculateTransaction);
document.getElementById("frequency").addEventListener("change", calculateTransaction);
}



