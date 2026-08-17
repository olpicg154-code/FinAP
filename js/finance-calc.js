function calculateFinance() {

    const amount = Number(document.getElementById("amount").value) || 0;
    const rate = Number(document.getElementById("rate").value) || 0;
    const months = Number(document.getElementById("months").value) || 0;
    const type = document.getElementById("type").value;

    if (!amount || !rate || !months) return;

    let result = 0;
    let details = "";

    if (type === "loan") {
        const monthlyRate = rate / 100 / 12;
        const payment = amount * monthlyRate / (1 - Math.pow(1 + monthlyRate, -months));
        result = payment.toFixed(2);
        details = "Щомісячний платіж";
    } else {
        result = (amount * (1 + (rate / 100) * (months / 12))).toFixed(2);
        details = "Сума з відсотками";
    }

    document.getElementById("resultValue").textContent = result + " $";
    document.getElementById("resultDetails").textContent = details;
}

if(document.getElementById("amount")){
document.getElementById("amount").addEventListener("input", calculateFinance);
document.getElementById("rate").addEventListener("input", calculateFinance);
document.getElementById("months").addEventListener("input", calculateFinance);
document.getElementById("type").addEventListener("change", calculateFinance);
}

