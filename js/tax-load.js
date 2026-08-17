function calculateTax() {

    const income = Number(document.getElementById("income").value) || 0;
    const type = document.getElementById("type").value;

    if (!income) return;

    let tax = 0;
    let label = "";

    if (type === "fop5") {
        tax = income * 0.05;
        label = "ФОП 5%";
    }

    if (type === "fop3") {
        tax = income * 0.03 + income * 0.2;
        label = "ФОП 3% + ПДВ";
    }

    if (type === "company") {
        tax = income * 0.18;
        label = "Компанія 18%";
    }

    const net = income - tax;

    document.getElementById("taxResult").textContent = tax.toFixed(2) + " $";
    document.getElementById("taxDetails").textContent =
        label + " | Чистий дохід: " + net.toFixed(2) + " $";
}

document.getElementById("income").addEventListener("input", calculateTax);
document.getElementById("type").addEventListener("change", calculateTax);
