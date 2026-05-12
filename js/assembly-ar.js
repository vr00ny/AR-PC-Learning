// AR-фон для игры сборки — overlay-подход.
// При включении создаём overlay поверх сайта, физически переносим в него
// .assembly-board, .assembly-tray и .assembly-stats. AR-сцена становится фоном.
// При выходе возвращаем элементы на исходные места — игровой стейт сохраняется.

let assemblyArSession = null;
let assemblyArOn = false;

function destroyAssemblyAR() {
    if (!assemblyArSession) {
        assemblyArOn = false;
        const toggle = document.getElementById('assemblyArToggle');
        if (toggle) toggle.classList.remove('active');
        return;
    }

    if (assemblyArSession.observer) assemblyArSession.observer.disconnect();

    if (typeof stopAllCameraStreams === 'function') stopAllCameraStreams();
    else {
        document.querySelectorAll('video').forEach(v => {
            const s = v.srcObject;
            if (s && s.getTracks) s.getTracks().forEach(t => { try { t.stop(); } catch (e) {} });
            v.srcObject = null;
        });
    }

    // Вернуть HTML-элементы (доска, лоток, статы) на их исходные места
    const moved = assemblyArSession.moved || [];
    moved.forEach(({ el, parent, next }) => {
        if (!el || !parent) return;
        try {
            if (next && next.parentNode === parent) parent.insertBefore(el, next);
            else parent.appendChild(el);
            el.classList.remove('ar-mode');
            el.removeAttribute('style');
        } catch (e) {}
    });

    // Удалить overlay со всем что внутри (a-scene, видео, AR.js артефакты)
    const overlay = document.getElementById('assemblyArOverlay');
    if (overlay) overlay.remove();

    // Подчистка от случайных AR.js артефактов в body
    document.querySelectorAll(
        'body > video#arjs-video, body > #arjs-video, body > canvas.a-canvas, body > a-scene'
    ).forEach(el => { try { el.remove(); } catch (e) {} });

    if (typeof restoreGetUserMedia === 'function') restoreGetUserMedia();
    // Сброс meta viewport / inline-стилей html и body — иначе после AR вёрстка
    // "расширяется" как в горизонтальной ориентации
    if (typeof restorePageLayout === 'function') restorePageLayout();
    void document.body.offsetHeight;
    window.dispatchEvent(new Event('resize'));

    const board = document.getElementById('assemblyBoard');
    if (board) board.classList.remove('ar-mode');

    assemblyArSession = null;
    assemblyArOn = false;
    const toggle = document.getElementById('assemblyArToggle');
    if (toggle) toggle.classList.remove('active');
    const hint = document.getElementById('assemblyArHint');
    if (hint) hint.innerHTML = 'После включения наведи камеру на маркер Hiro — он станет фоном под доской сборки.';
}

function createAssemblyAR() {
    if (assemblyArOn) return;
    // Если на AR-вкладке камера активна — выключить (одна камера не может быть в двух сессиях)
    if (typeof destroyARScene === 'function') destroyARScene();
    if (typeof forceBackCamera === 'function') forceBackCamera();
    if (typeof snapshotPageLayout === 'function') snapshotPageLayout();

    const board = document.getElementById('assemblyBoard');
    const tray = document.getElementById('assemblyTray');
    if (!board || !tray) return;

    // Запоминаем где лежали элементы (чтобы вернуть)
    const stats = document.querySelector('.assembly-stats');
    const trayTitle = document.querySelector('.assembly-tray-title');
    const moved = [];
    [stats, trayTitle, board, tray].forEach(el => {
        if (el) moved.push({ el, parent: el.parentNode, next: el.nextSibling });
    });

    // Overlay поверх всего
    const overlay = document.createElement('div');
    overlay.id = 'assemblyArOverlay';
    overlay.style.cssText =
        'position:fixed;top:0;left:0;right:0;bottom:0;width:100vw;height:100vh;' +
        'z-index:10000;background:#000;overflow:hidden;';
    document.body.appendChild(overlay);

    // AR-сцена — фон
    const scene = document.createElement('a-scene');
    scene.setAttribute('embedded', '');
    scene.setAttribute('arjs', 'sourceType: webcam; debugUIEnabled: false; detectionMode: mono; maxDetectionRate: 60; patternRatio: 0.5;');
    scene.setAttribute('vr-mode-ui', 'enabled: false');
    scene.setAttribute('renderer', 'logarithmicDepthBuffer: true; alpha: true;');
    scene.style.cssText = 'width:100%;height:100%;position:absolute;top:0;left:0;z-index:1;';

    const marker = document.createElement('a-marker');
    marker.setAttribute('preset', 'hiro');
    marker.setAttribute('smooth', 'true');

    const cube = document.createElement('a-box');
    cube.setAttribute('position', '0 0.5 0');
    cube.setAttribute('scale', '0.7 0.7 0.7');
    cube.setAttribute('material', 'color: #4fd1c5; opacity: 0.7; transparent: true');
    cube.setAttribute('animation', 'property: rotation; to: 0 360 0; loop: true; dur: 4000');
    marker.appendChild(cube);

    scene.appendChild(marker);
    const cam = document.createElement('a-entity');
    cam.setAttribute('camera', '');
    scene.appendChild(cam);
    overlay.appendChild(scene);

    // Перемещаем HTML-доску и лоток внутрь overlay — они будут поверх AR-фона
    // Доска занимает основную часть, лоток внизу, статы сверху
    if (stats) {
        stats.style.cssText =
            'position:fixed;top:max(12px,env(safe-area-inset-top));left:12px;right:76px;' +
            'z-index:10100;margin:0;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);' +
            'background:rgba(11,15,23,0.78);border:1px solid rgba(140,170,210,0.25);' +
            'border-radius:10px;display:grid;grid-template-columns:repeat(3,1fr);overflow:hidden;';
        overlay.appendChild(stats);
    }
    if (board) {
        board.classList.add('ar-mode');
        board.style.cssText =
            'position:fixed;top:80px;bottom:140px;left:12px;right:12px;' +
            'width:auto;height:auto;aspect-ratio:auto;margin:0;z-index:10100;' +
            'background:rgba(11,15,23,0.15);border:1px solid rgba(140,170,210,0.4);' +
            'border-radius:10px;overflow:visible;';
        overlay.appendChild(board);
    }
    if (tray) {
        tray.style.cssText =
            'position:fixed;bottom:max(12px,env(safe-area-inset-bottom));left:12px;right:12px;' +
            'z-index:10100;margin:0;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);' +
            'background:rgba(11,15,23,0.85);border:1px solid rgba(140,170,210,0.25);' +
            'border-radius:12px;display:grid;grid-template-columns:repeat(6,1fr);gap:6px;padding:10px;min-height:0;';
        overlay.appendChild(tray);
    }

    marker.addEventListener('markerFound', () => {
        const info = overlay.querySelector('.assembly-ar-info');
        if (info) info.innerHTML = '// MARKER · LOCKED';
    });
    marker.addEventListener('markerLost', () => {
        const info = overlay.querySelector('.assembly-ar-info');
        if (info) info.innerHTML = '// SEARCHING…';
    });

    // Кнопка выхода
    const exitBtn = document.createElement('button');
    exitBtn.className = 'ar-exit-btn';
    exitBtn.setAttribute('aria-label', 'Выйти');
    exitBtn.innerHTML = '✕';
    exitBtn.onclick = destroyAssemblyAR;
    overlay.appendChild(exitBtn);

    const info = document.createElement('div');
    info.className = 'ar-info assembly-ar-info';
    info.innerHTML = '// SEARCHING…';
    overlay.appendChild(info);

    // MutationObserver: парковать AR.js video в overlay
    const observer = new MutationObserver(() => {
        const video = document.getElementById('arjs-video');
        if (!video) return;
        if (video.parentNode !== overlay) overlay.appendChild(video);
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');
        video.setAttribute('muted', '');
        video.muted = true;
        video.playsInline = true;
        video.style.cssText =
            'position:absolute!important;top:0!important;left:0!important;' +
            'width:100%!important;height:100%!important;object-fit:cover!important;' +
            'z-index:1!important;display:block!important;opacity:1!important;';
        try { const p = video.play(); if (p && p.catch) p.catch(() => {}); } catch (e) {}
        document.querySelectorAll('body > canvas.a-canvas').forEach(c => overlay.appendChild(c));
    });
    observer.observe(document.body, { childList: true, subtree: false });

    assemblyArSession = { overlay, scene, observer, moved };
    assemblyArOn = true;

    const toggle = document.getElementById('assemblyArToggle');
    if (toggle) toggle.classList.add('active');
}

function toggleAssemblyAR() {
    if (assemblyArOn) destroyAssemblyAR();
    else createAssemblyAR();
}

window.addEventListener('beforeunload', () => {
    if (assemblyArOn && typeof stopAllCameraStreams === 'function') stopAllCameraStreams();
});
