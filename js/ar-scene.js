// AR-сцена через overlay-подход.
// Вместо того чтобы трогать вёрстку сайта, создаём отдельный <div> поверх всего.
// Внутри живёт a-scene + UI (кнопки, статус). При выходе overlay полностью
// удаляется — сайт под ним не затрагивается, поэтому ничего не "ломается".

let currentARSession = null;
let isCameraOn = false;
let originalGetUserMedia = null;

function stopAllCameraStreams() {
    document.querySelectorAll('video').forEach(v => {
        const stream = v.srcObject;
        if (stream && typeof stream.getTracks === 'function') {
            stream.getTracks().forEach(t => { try { t.stop(); } catch (e) {} });
            v.srcObject = null;
        }
        try { v.pause(); } catch (e) {}
    });
}

function forceBackCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
    if (originalGetUserMedia) return;
    originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = function(constraints) {
        const c = constraints || {};
        if (c.video) {
            const v = typeof c.video === 'object' ? Object.assign({}, c.video) : {};
            v.facingMode = { ideal: 'environment' };
            c.video = v;
        }
        return originalGetUserMedia(c);
    };
}

function restoreGetUserMedia() {
    if (originalGetUserMedia && navigator.mediaDevices) {
        navigator.mediaDevices.getUserMedia = originalGetUserMedia;
        originalGetUserMedia = null;
    }
}

function destroyARScene() {
    if (currentARSession && currentARSession.observer) {
        currentARSession.observer.disconnect();
    }
    stopAllCameraStreams();

    // Удаляем overlay со всем его содержимым — сайт под ним не трогается
    const overlay = document.getElementById('arOverlay');
    if (overlay) overlay.remove();

    // Зачистка случайных артефактов AR.js, попавших напрямую в body
    document.querySelectorAll(
        'body > video#arjs-video, body > #arjs-video, body > video[id^="arjs"], ' +
        'body > canvas.a-canvas, body > a-scene'
    ).forEach(el => { try { el.remove(); } catch (e) {} });

    restoreGetUserMedia();
    currentARSession = null;
    isCameraOn = false;
}

function createARScene() {
    if (isCameraOn) return;
    destroyARScene();
    forceBackCamera();

    // Overlay — fixed контейнер поверх всего сайта.
    // Сайт сам не меняется, мы просто кладём поверх него чёрный слой с AR.
    const overlay = document.createElement('div');
    overlay.id = 'arOverlay';
    overlay.style.cssText =
        'position:fixed;top:0;left:0;right:0;bottom:0;width:100vw;height:100vh;' +
        'z-index:10000;background:#000;overflow:hidden;';
    document.body.appendChild(overlay);

    // A-Frame сцена
    const scene = document.createElement('a-scene');
    scene.setAttribute('embedded', '');
    scene.setAttribute('arjs', 'sourceType: webcam; debugUIEnabled: false; detectionMode: mono; maxDetectionRate: 60; patternRatio: 0.5;');
    scene.setAttribute('vr-mode-ui', 'enabled: false');
    scene.setAttribute('renderer', 'logarithmicDepthBuffer: true; antialias: true; alpha: true;');
    scene.style.cssText = 'width:100%;height:100%;position:absolute;top:0;left:0;';

    const marker = document.createElement('a-marker');
    marker.setAttribute('preset', 'hiro');
    marker.setAttribute('smooth', 'true');
    marker.setAttribute('smoothCount', '5');

    // Гарантированно видимая модель — крупный вращающийся куб + надпись.
    // Если этот куб появляется — значит трекинг и рендер работают. Дальше уже можно
    // подключать сложные glb-модели.
    const cube = document.createElement('a-box');
    cube.setAttribute('position', '0 0.5 0');
    cube.setAttribute('scale', '1 1 1');
    cube.setAttribute('material', 'color: #4fd1c5; opacity: 0.85; transparent: true');
    cube.setAttribute('animation', 'property: rotation; to: 0 360 0; loop: true; dur: 4000');
    marker.appendChild(cube);

    const text = document.createElement('a-text');
    text.setAttribute('value', 'WORKING!');
    text.setAttribute('position', '0 1.4 0');
    text.setAttribute('align', 'center');
    text.setAttribute('color', '#fff');
    text.setAttribute('scale', '1.5 1.5 1.5');
    marker.appendChild(text);

    // GLB-материнка (если загрузится — наложится поверх куба)
    const mb = document.createElement('a-entity');
    mb.setAttribute('id', 'arMb');
    mb.setAttribute('gltf-model', 'assets/models/motherboard.glb');
    mb.setAttribute('scale', '0.4 0.4 0.4');
    mb.setAttribute('position', '0 0 0');
    mb.setAttribute('rotation', '-90 0 0');
    marker.appendChild(mb);

    marker.addEventListener('markerFound', () => {
        const info = overlay.querySelector('.ar-info');
        if (info) info.innerHTML = '// MARKER · LOCKED';
        const hint = overlay.querySelector('.marker-hint');
        if (hint) hint.style.display = 'none';
    });
    marker.addEventListener('markerLost', () => {
        const info = overlay.querySelector('.ar-info');
        if (info) info.innerHTML = '// SEARCHING…';
        const hint = overlay.querySelector('.marker-hint');
        if (hint) hint.style.display = '';
    });
    mb.addEventListener('model-loaded', () => {
        const info = overlay.querySelector('.ar-info');
        if (info) info.innerHTML = '// MODEL READY';
    });
    mb.addEventListener('model-error', (e) => {
        console.warn('glb error', e);
        const info = overlay.querySelector('.ar-info');
        if (info) info.innerHTML = '// MODEL · ERROR (using fallback)';
    });

    scene.appendChild(marker);

    const cam = document.createElement('a-entity');
    cam.setAttribute('camera', '');
    scene.appendChild(cam);

    overlay.appendChild(scene);

    // UI поверх AR
    const exitBtn = document.createElement('button');
    exitBtn.className = 'ar-exit-btn';
    exitBtn.setAttribute('aria-label', 'Выйти');
    exitBtn.innerHTML = '✕';
    exitBtn.onclick = destroyARScene;
    overlay.appendChild(exitBtn);

    const info = document.createElement('div');
    info.className = 'ar-info';
    info.innerHTML = '// SEARCHING…';
    overlay.appendChild(info);

    const hint = document.createElement('div');
    hint.className = 'marker-hint';
    hint.innerHTML = '🎯 Наведи камеру на маркер Hiro';
    overlay.appendChild(hint);

    // MutationObserver: AR.js помещает <video> в body, мы перетаскиваем в overlay
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
            'margin:0!important;padding:0!important;transform:none!important;' +
            'z-index:1!important;display:block!important;opacity:1!important;';
        try { const p = video.play(); if (p && p.catch) p.catch(() => {}); } catch (e) {}
        // canvas A-Frame тоже может оторваться
        document.querySelectorAll('body > canvas.a-canvas').forEach(c => overlay.appendChild(c));
    });
    observer.observe(document.body, { childList: true, subtree: false });

    isCameraOn = true;
    currentARSession = { overlay, scene, observer };
}

window.addEventListener('beforeunload', () => {
    if (isCameraOn) stopAllCameraStreams();
});
