document.addEventListener("DOMContentLoaded", () => {

const quizEl = document.getElementById("quiz");
if(!quizEl) return;

const tests = {
aml: [
{q:"Що означає AML?",a:["Anti Money Laundering","Automatic Money Logic","Advanced Market Level"],correct:0},
{q:"PEP це:",a:["Політично значуща особа","Платіжний процес","Податковий елемент"],correct:0},
{q:"Велика сума =",a:["Низький ризик","Вищий ризик","Немає значення"],correct:1},
{q:"Часті транзакції це:",a:["Норма","Ризик","Без значення"],correct:1},
{q:"FATF це:",a:["Організація","Банк","Крипта"],correct:0}
],

tax: [
{q:"Податок це:",a:["Обов'язковий платіж","Добровільний","Бонус"],correct:0},
{q:"ПДВ в Україні:",a:["10%","20%","30%"],correct:1},
{q:"ЄСВ це:",a:["Соц внесок","Штраф","Комісія"],correct:0},
{q:"Прибуток це:",a:["Доход - витрати","Все доход","Все витрати"],correct:0},
{q:"Штрафи за несплату:",a:["Є","Немає","Бонус"],correct:0}
],

crypto: [
{q:"Bitcoin це:",a:["Криптовалюта","Банк","Акція"],correct:0},
{q:"Blockchain:",a:["Реєстр","Гра","Банк"],correct:0},
{q:"USDT:",a:["Стейблкоїн","Акція","Банк"],correct:0},
{q:"Wallet:",a:["Гаманець","Карта","Банк"],correct:0},
{q:"Mining:",a:["Добування","Продаж","Переказ"],correct:0}
]
};

let currentTest = null;
let current = 0;
let score = 0;

window.showMenu = function(){
    quizEl.innerHTML = `
    <div class="q-card">
        <h2>Обери тест</h2>
        <button class="answer-btn" onclick="startTest('aml')">AML тест</button>
        <button class="answer-btn" onclick="startTest('tax')">Податковий тест</button>
        <button class="answer-btn" onclick="startTest('crypto')">Crypto тест</button>
    </div>`;
}

window.startTest = function(type){
    currentTest = tests[type];
    current = 0;
    score = 0;
    showQuestion();
}

function showQuestion(){
    const q = currentTest[current];

    let html = `
    <div class="q-card">
        <div class="q-title">${current+1} / ${currentTest.length}</div>
        <h2>${q.q}</h2>
    `;

    q.a.forEach((opt,i)=>{
        html += `<button class="answer-btn" onclick="answer(${i})">${opt}</button>`;
    });

    html += `</div>`;
    quizEl.innerHTML = html;
}

window.answer = function(i){
    if(i === currentTest[current].correct){
        score++;
    }

    current++;

    if(current < currentTest.length){
        showQuestion();
    }else{
        showResult();
    }
}

function showResult(){
    const percent = Math.round((score / currentTest.length)*100);

    let level = "Beginner";
    if(percent >= 70) level = "Intermediate";
    if(percent >= 90) level = "Advanced";

    quizEl.innerHTML = `
    <div class="q-card">
        <h2>Результат</h2>
        <p>${score}/${currentTest.length}</p>
        <p>${percent}%</p>
        <p>${level}</p>
        <button class="answer-btn" onclick="showMenu()">Назад до тестів</button>
    </div>`;
}

showMenu();

});

