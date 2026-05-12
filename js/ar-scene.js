// AR-вкладка: model-viewer для предпросмотра + кнопка запуска AR.js маркера в iframe.
//
// На iOS Safari AR.js с маркером Hiro — единственный способ настоящего AR.
// Чтобы AR.js не ломал viewport главной страницы, он живёт в отдельном
// документе ar.html, загружаемом в <iframe>. При закрытии iframe удаляется
// и сайт возвращается к исходному состоянию.

let arIframeListener = null;

function loadAR() {
    const viewer = document.getElementById('arViewer');
    const thumbs = document.getElementById('arThumbs');
    const nameEl = document.getElementById('arCurrentName');
    const descEl = document.getElementById('arCurrentDesc');
    if (!viewer || !thumbs || !window.models3dData) return;

    function setModel(m) {
        viewer.src = m.src;
        viewer.setAttribute('alt', m.name);
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

// Открыть AR.js в iframe поверх сайта
function openMarkerAR() {
    if (document.getElementById('arIframe')) return;

    const iframe = document.createElement('iframe');
    iframe.id = 'arIframe';
    iframe.src = 'ar.html?ts=' + Date.now();
    iframe.allow = 'camera; microphone; xr-spatial-tracking; gyroscope; accelerometer';
    iframe.setAttribute('allowfullscreen', '');
    iframe.style.cssText =
        'position:fixed;top:0;left:0;width:100vw;height:100vh;' +
        'border:0;margin:0;padding:0;background:#000;z-index:10000;';
    document.body.appendChild(iframe);

    arIframeListener = (e) => {
        if (e.data && e.data.type === 'ar-close') closeMarkerAR();
    };
    window.addEventListener('message', arIframeListener);
}

function closeMarkerAR() {
    const iframe = document.getElementById('arIframe');
    if (iframe) iframe.remove();
    if (arIframeListener) {
        window.removeEventListener('message', arIframeListener);
        arIframeListener = null;
    }
}

// Legacy noops — на случай если где-то остались вызовы
function createARScene() { openMarkerAR(); }
function destroyARScene() { closeMarkerAR(); }
