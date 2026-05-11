// Рендер теоретических блоков (аккордеон).
// Зависит от theoryData (js/data/theory.js).

function renderSection(section) {
    let html = `<h4>${section.heading}</h4>`;
    if (section.paragraphs) {
        html += section.paragraphs.map(p => `<p>${p}</p>`).join('');
    }
    if (section.items) {
        html += '<ul>' + section.items.map(li => `<li>${li}</li>`).join('') + '</ul>';
    }
    if (section.tip) {
        html += `<div class="tip">💡 ${section.tip}</div>`;
    }
    return html;
}

// Цветовые акценты карточек теории по очереди (teal/blue/amber/purple/green/...)
const theoryAccents = ['', 'blue', 'amber', 'purple', 'green', ''];

function loadTheory() {
    const list = document.getElementById('theoryList');
    list.innerHTML = '';
    theoryData.forEach((topic, i) => {
        const card = document.createElement('div');
        const accent = theoryAccents[i % theoryAccents.length];
        card.className = 'theory-card' + (accent ? ' ' + accent : '');
        card.dataset.id = topic.id;
        const bodyHtml = topic.sections.map(renderSection).join('');
        const idLabel = 'THEORY.' + String(i + 1).padStart(2, '0');
        card.innerHTML = `
            <div class="theory-header">
                <span class="theory-icon">${topic.icon}</span>
                <div style="flex:1;min-width:0">
                    <div class="theory-id">${idLabel}</div>
                    <div class="theory-title">${topic.title}</div>
                </div>
                <span class="theory-toggle">▼</span>
            </div>
            <div class="theory-body">${bodyHtml}</div>`;
        list.appendChild(card);

        card.querySelector('.theory-header').onclick = () => {
            card.classList.toggle('open');
        };
    });
}
