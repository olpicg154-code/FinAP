const API_URL =
    "https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json";


const amountInput =
    document.getElementById("currencyAmount");

const fromSelect =
    document.getElementById("fromCurrency");

const toSelect =
    document.getElementById("toCurrency");

const swapButton =
    document.getElementById("swapCurrency");

const result =
    document.getElementById("conversionResult");

const rateInfo =
    document.getElementById("rateInfo");

const rateDate =
    document.getElementById("rateDate");


let rates = {};


async function loadRates() {

    try {

        const response =
            await fetch(API_URL);

        if (!response.ok) {
            throw new Error("NBU API error");
        }

        const data =
            await response.json();


        rates = {
            UAH: 1
        };


        data.forEach(item => {

            if (item.cc) {
                rates[item.cc] = Number(item.rate);
            }

        });


        const usd =
            rates.USD;

        const eur =
            rates.EUR;


        if (!usd || !eur) {
            throw new Error("USD/EUR missing");
        }


        const date =
            data.find(
                item => item.cc === "USD"
            )?.exchangedate || "";


        rateDate.textContent =
            `Курс НБУ від ${date}`;


        calculate();

    } catch (error) {

        console.error(
            "FinAP currency converter:",
            error
        );

        result.textContent =
            "Немає зв'язку";

        rateInfo.textContent =
            "Не вдалося завантажити курс НБУ";

        rateDate.textContent =
            "Спробуйте оновити сторінку";

    }

}


function calculate() {

    const amount =
        Number(amountInput.value);


    const from =
        fromSelect.value;

    const to =
        toSelect.value;


    if (
        !Number.isFinite(amount) ||
        amount < 0 ||
        !rates[from] ||
        !rates[to]
    ) {

        result.textContent =
            "--";

        return;

    }


    /*
        rates[X] = скільки UAH коштує 1 одиниця X

        Спочатку переводимо валюту в UAH,
        потім з UAH у потрібну валюту.
    */

    const amountUAH =
        amount * rates[from];

    const converted =
        amountUAH / rates[to];


    result.textContent =
        `${formatNumber(converted)} ${to}`;


    const oneUnit =
        rates[from] / rates[to];


    rateInfo.textContent =
        `1 ${from} = ${formatNumber(oneUnit, 4)} ${to}`;

}


function formatNumber(
    value,
    decimals = 2
) {

    return Number(value).toLocaleString(
        "uk-UA",
        {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }
    );

}


amountInput.addEventListener(
    "input",
    calculate
);


fromSelect.addEventListener(
    "change",
    calculate
);


toSelect.addEventListener(
    "change",
    calculate
);


swapButton.addEventListener(
    "click",
    () => {

        const oldFrom =
            fromSelect.value;

        fromSelect.value =
            toSelect.value;

        toSelect.value =
            oldFrom;

        calculate();

    }
);


loadRates();
