async function loadComponent(id, path) {

    const el = document.getElementById(id);

    if (!el) return;

    const res = await fetch(path);

    el.innerHTML = await res.text();
}


async function waitForElement(id) {

    return new Promise(resolve => {

        const check = () => {

            if (document.getElementById(id)) {
                resolve();
            } else {
                requestAnimationFrame(check);
            }
        };

        check();
    });
}


async function init() {

    await loadComponent(
        "header",
        "components/header.html"
    );

    await loadComponent(
        "hero",
        "components/hero.html"
    );


    // =========================
    // GLOSSARY
    // =========================

    await loadComponent(
        "definitions",
        "components/glossary.html?v=3"
    );

    await waitForElement("glossaryTerms");

    await import("./glossary.js?v=2");


    // =========================
    // MARKET DATA
    // =========================

    await loadComponent(
        "market-data",
        "components/market-data.html"
    );

    await waitForElement("usdRate");

    await import("./wireframe.js");

    await import("./market-data.js");
}


init();

