// AR-вкладка: model-viewer для предпросмотра + кнопка запуска AR.js маркера в iframe.
//
// На iOS Safari AR.js с маркер-основанным трекингом — единственный способ настоящего AR.
// Чтобы AR.js не ломал viewport главной страницы, он живёт в отдельном
// документе ar.html, загружаемом в <iframe>. При закрытии iframe удаляется
// и сайт возвращается к исходному состоянию.

let arIframeListener = null;

function loadAR() {
    const viewer = document.getElementById('arViewer');
    const thumbs = document.getElementById('arThumbs');
    if (!viewer || !thumbs || !window.models3dData) return;

    function setModel(m) {
        viewer.src = m.src;
        viewer.setAttribute('alt', m.name);
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
    // Трекинг — пользователь хотя бы запустил AR
    if (typeof trackArDone === 'function') trackArDone();

    const iframe = document.createElement('iframe');
    iframe.id = 'arIframe';
    iframe.src = 'ar.html?ts=' + Date.now();
    iframe.allow = 'camera; microphone; xr-spatial-tracking; gyroscope; accelerometer';
    iframe.setAttribute('allowfullscreen', '');
    // Используем top/left/right/bottom вместо width/height — на iOS Safari
    // 100vh не учитывает адресную строку, и iframe получался меньше viewport.
    // Также 100dvh как fallback (поддерживается в новых браузерах).
    iframe.style.cssText =
        'position:fixed;top:0;left:0;right:0;bottom:0;' +
        'width:100%;height:100%;height:100dvh;' +
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
