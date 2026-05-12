// Логика отображения каталога компонентов и модального окна.
// Зависит от componentsData (js/data/components.js).

function loadComponents() {
    const grid = document.getElementById('componentsGrid');
    grid.innerHTML = '';
    const studied = getStudiedComponents();
    for (const [key, data] of Object.entries(componentsData)) {
        const card = document.createElement('div');
        card.className = 'comp' + (studied.has(key) ? ' studied' : '');
        card.dataset.key = key;
        card.onclick = () => showDetails(key);
        const illust = data.imageUrl
            ? `<img class="illust illust-photo" src="${data.imageUrl}" alt="${data.name}" loading="lazy">`
            : `<svg class="illust" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5">${data.svg}</svg>`;
        const studiedBadge = studied.has(key)
            ? '<span class="badge">ИЗУЧЕНО</span>'
            : '';
        const studiedCheck = studied.has(key)
            ? '<span class="check-corner"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></span>'
            : '';
        card.innerHTML = `
            <div>
                <span class="id">// ${data.id}${studiedBadge}</span>
                <div class="name">${data.name}</div>
                <div class="sub">${data.sub}</div>
            </div>
            ${illust}
            ${studiedCheck}`;
        grid.appendChild(card);
    }
}

function showDetails(key) {
    const data = componentsData[key];
    document.getElementById('modalTitle').textContent = data.name;
    document.getElementById('modalSubtitle').textContent = '// ' + data.id + ' · ' + data.sub;
    const preview = data.imageUrl
        ? `<img src="${data.imageUrl}" alt="${data.name}" loading="lazy">`
        : `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5">${data.svg}</svg>`;
    document.getElementById('modalModel').innerHTML = preview;
    document.getElementById('modalDescription').textContent = data.desc;
    document.getElementById('modalSpecs').innerHTML =
        '<strong>Характеристики</strong><ul>' +
        data.specs.map(s => `<li>${s}</li>`).join('') +
        '</ul>';
    document.getElementById('componentModal').classList.add('active');

    // Помечаем компонент как изученный + обновляем карточку
    markComponentStudied(key);
}

function closeModal() {
    document.getElementById('componentModal').classList.remove('active');
}

// ===== Tracking "изучено" в localStorage =====
const STUDIED_KEY = 'studied-components';
function getStudiedComponents() {
    try {
        return new Set(JSON.parse(localStorage.getItem(STUDIED_KEY)) || []);
    } catch (e) { return new Set(); }
}
function markComponentStudied(key) {
    const studied = getStudiedComponents();
    if (studied.has(key)) return;
    studied.add(key);
    try { localStorage.setItem(STUDIED_KEY, JSON.stringify(Array.from(studied))); } catch (e) {}
    // Обновляем визуально только эту карточку
    const card = document.querySelector('.comp[data-key="' + key + '"]');
    if (card && !card.classList.contains('studied')) {
        card.classList.add('studied');
        const idSpan = card.querySelector('.id');
        if (idSpan && !idSpan.querySelector('.badge')) {
            idSpan.insertAdjacentHTML('beforeend', '<span class="badge">ИЗУЧЕНО</span>');
        }
        if (!card.querySelector('.check-corner')) {
            card.insertAdjacentHTML('beforeend',
                '<span class="check-corner"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></span>');
        }
    }
    // Прогресс-бар обновится сам если есть
    if (typeof updateProgressBar === 'function') updateProgressBar();
}
