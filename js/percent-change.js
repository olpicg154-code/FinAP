function calculateChange() {

    const oldVal = Number(document.getElementById("old").value);
    const newVal = Number(document.getElementById("new").value);

    if (!oldVal || !newVal) return;

    const change = ((newVal - oldVal) / oldVal) * 100;

    const el = document.getElementById("result");

    el.textContent = change.toFixed(2) + " %";

    if (change > 0) el.style.color = "#00ff9d";
    else el.style.color = "#ff4d4f";
}

if (document.getElementById("old")) {
    document.getElementById("old").addEventListener("input", calculateChange);
    document.getElementById("new").addEventListener("input", calculateChange);
}
