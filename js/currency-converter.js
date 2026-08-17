function convertCurrency() {

    const amountEl = document.getElementById("amount");
    const fromEl = document.getElementById("from");
    const toEl = document.getElementById("to");
    const resultEl = document.getElementById("result");

    if (!amountEl || !fromEl || !toEl || !resultEl) return;

    const amount = Number(amountEl.value) || 0;
    const from = fromEl.value;
    const to = toEl.value;

    if (!amount) {
        resultEl.textContent = "--";
        return;
    }

    // 💰 ФІКСОВАНІ КУРСИ (стабільні)
    const rates = {
        USD: 1,
        EUR: 0.92,
        UAH: 41
    };

    const usd = amount / rates[from];
    const result = usd * rates[to];

    if (isNaN(result)) {
        resultEl.textContent = "Помилка";
        return;
    }

    resultEl.textContent = result.toFixed(2) + " " + to;
}

if (document.getElementById("amount")) {
    document.getElementById("amount").addEventListener("input", convertCurrency);
    document.getElementById("from").addEventListener("change", convertCurrency);
    document.getElementById("to").addEventListener("change", convertCurrency);
}
