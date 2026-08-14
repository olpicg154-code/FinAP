const oldInput = document.getElementById("oldValue");
const newInput = document.getElementById("newValue");

const result = document.getElementById("changeResult");
const text = document.getElementById("changeText");


function calculate() {

    const oldVal = Number(oldInput.value);
    const newVal = Number(newInput.value);

    if (!oldVal || !newVal) {
        result.textContent = "--";
        text.textContent = "Введіть дані";
        return;
    }

    const change = ((newVal - oldVal) / oldVal) * 100;

    const formatted = change.toFixed(2);

    if (change > 0) {
        result.textContent = "+" + formatted + "%";
        result.style.color = "#65d68b";
        text.textContent = "Зростання";
    }
    else if (change < 0) {
        result.textContent = formatted + "%";
        result.style.color = "#ff5c5c";
        text.textContent = "Падіння";
    }
    else {
        result.textContent = "0.00%";
        result.style.color = "#aaa";
        text.textContent = "Без змін";
    }

}

oldInput.addEventListener("input", calculate);
newInput.addEventListener("input", calculate);
