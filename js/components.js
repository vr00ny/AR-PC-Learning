// Логика отображения каталога компонентов и модального окна.
// Зависит от componentsData (js/data/components.js).

function loadComponents() {
    const grid = document.getElementById('componentsGrid');
    grid.innerHTML = '';
    for (const [key, data] of Object.entries(componentsData)) {
        const card = document.createElement('div');
        card.className = 'comp';
        card.onclick = () => showDetails(key);
        // Иллюстрация: реальное фото если есть, иначе SVG
        const illust = data.imageUrl
            ? `<img class="illust illust-photo" src="${data.imageUrl}" alt="${data.name}" loading="lazy">`
            : `<svg class="illust" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5">${data.svg}</svg>`;
        card.innerHTML = `
            <div>
                <span class="id">// ${data.id}</span>
                <div class="name">${data.name}</div>
                <div class="sub">${data.sub}</div>
            </div>
            ${illust}`;
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
}

function closeModal() {
    document.getElementById('componentModal').classList.remove('active');
}
