// AR-вкладка через <model-viewer> (markerless AR на Android).
// На Android нажатие "Открыть в AR" запускает нативный Google Scene Viewer,
// он находит плоскость пола/стола и размещает компонент в реальной комнате.
// На iPhone Safari без .usdz это просто красивый 3D-просмотр.

function loadAR() {
    const viewer = document.getElementById('arViewer');
    const thumbs = document.getElementById('arThumbs');
    const nameEl = document.getElementById('arCurrentName');
    const descEl = document.getElementById('arCurrentDesc');
    if (!viewer || !thumbs || !window.models3dData) return;

    function setModel(m) {
        viewer.src = m.src;
        viewer.setAttribute('alt', m.name);
        viewer.setAttribute('poster', '');
        nameEl.textContent = m.name;
        descEl.textContent = m.description;
        thumbs.querySelectorAll('.ar-thumb').forEach(t => {
            t.classList.toggle('active', t.dataset.id === m.id);
        });
    }

    thumbs.innerHTML = '';
    models3dData.forEach((m, i) => {
        const btn = document.createElement('button');
        btn.className = 'ar-thumb' + (i === 0 ? ' active' : '');
        btn.dataset.id = m.id;
        btn.innerHTML =
            '<div class="ar-thumb-icon">' + m.icon + '</div>' +
            '<div class="ar-thumb-name">' + m.name + '</div>';
        btn.onclick = () => setModel(m);
        thumbs.appendChild(btn);
    });
    setModel(models3dData[0]);
}

// Удалить старые функции — теперь не нужны
function createARScene() { /* legacy noop */ }
function destroyARScene() { /* legacy noop */ }
