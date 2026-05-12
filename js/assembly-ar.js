// AR-фон для игры сборки.
// На вкладке "Сборка" пользователь может включить камеру — она появится ПОД
// доской сборки (слой `.assembly-ar-layer`), а сама доска становится
// полупрозрачной. Перетаскивание HTML-компонентов работает поверх видео.
//
// Логика очистки повторяет ar-scene.js: останавливаем MediaStream, удаляем
// добавленный AR.js мусор в body, восстанавливаем inline-стили body/html.

let assemblyArScene = null;
let assemblyArOn = false;
let assemblyArBodyStyle = null;
let assemblyArHtmlStyle = null;
let assemblyArBodyChildren = null;
let assemblyArObserver = null;

function destroyAssemblyAR() {
    if (assemblyArObserver) {
        assemblyArObserver.disconnect();
        assemblyArObserver = null;
    }

    // Остановить все video-стримы (если открыта AR-вкладка одновременно — она перезахватит)
    if (typeof stopAllCameraStreams === 'function') {
        stopAllCameraStreams();
    } else {
        document.querySelectorAll('video').forEach(v => {
            const s = v.srcObject;
            if (s && s.getTracks) s.getTracks().forEach(t => { try { t.stop(); } catch (e) {} });
            v.srcObject = null;
        });
    }

    // Удалить элементы AR.js, добавленные в body
    if (assemblyArBodyChildren) {
        Array.from(document.body.children).forEach(node => {
            if (!assemblyArBodyChildren.has(node)) {
                try { node.remove(); } catch (e) {}
            }
        });
        assemblyArBodyChildren = null;
    }
    document.querySelectorAll('#arjs-video, video#arjs-video').forEach(v => v.remove());

    // Убрать сцену
    const layer = document.getElementById('assemblyArLayer');
    if (layer) {
        layer.querySelectorAll('a-scene').forEach(s => s.remove());
    }
    assemblyArScene = null;

    // Снять класс ar-mode с доски и защитный ar-active с body/html.
    // Класс на body/html снимаем только если AR-вкладка тоже не активна.
    const board = document.getElementById('assemblyBoard');
    if (board) board.classList.remove('ar-mode');
    if (!isCameraOn) {
        document.body.classList.remove('ar-active');
        document.documentElement.classList.remove('ar-active');
    }
    if (typeof restoreGetUserMedia === 'function') restoreGetUserMedia();

    // Восстановить стили body/html
    if (assemblyArBodyStyle !== null) {
        document.body.setAttribute('style', assemblyArBodyStyle);
        if (!assemblyArBodyStyle) document.body.removeAttribute('style');
        assemblyArBodyStyle = null;
    }
    if (assemblyArHtmlStyle !== null) {
        document.documentElement.setAttribute('style', assemblyArHtmlStyle);
        if (!assemblyArHtmlStyle) document.documentElement.removeAttribute('style');
        assemblyArHtmlStyle = null;
    }

    assemblyArOn = false;
    const toggle = document.getElementById('assemblyArToggle');
    if (toggle) toggle.classList.remove('active');
    const hint = document.getElementById('assemblyArHint');
    if (hint) hint.innerHTML = 'После включения наведи камеру на маркер Hiro — он станет фоном под доской сборки.';
}

function createAssemblyAR() {
    if (assemblyArOn) return;

    // Если на AR-вкладке уже работает камера — погасить, иначе обе сессии будут драться за getUserMedia
    if (typeof destroyARScene === 'function') destroyARScene();

    const layer = document.getElementById('assemblyArLayer');
    const board = document.getElementById('assemblyBoard');
    if (!layer || !board) return;

    // Принудительно задняя камера (функция из ar-scene.js)
    if (typeof forceBackCamera === 'function') forceBackCamera();

    assemblyArBodyStyle = document.body.getAttribute('style') || '';
    assemblyArHtmlStyle = document.documentElement.getAttribute('style') || '';
    assemblyArBodyChildren = new Set(Array.from(document.body.children));

    const scene = document.createElement('a-scene');
    scene.setAttribute('embedded', '');
    scene.setAttribute('arjs', 'sourceType: webcam; debugUIEnabled: false; detectionMode: mono; maxDetectionRate: 60; patternRatio: 0.5;');
    scene.setAttribute('vr-mode-ui', 'enabled: false');
    scene.setAttribute('renderer', 'logarithmicDepthBuffer: true; antialias: true;');

    const marker = document.createElement('a-marker');
    marker.setAttribute('preset', 'hiro');
    marker.setAttribute('smooth', 'true');
    marker.setAttribute('smoothCount', '5');
    marker.setAttribute('smoothTolerance', '0.01');
    marker.setAttribute('smoothThreshold', '2');

    marker.addEventListener('markerFound', () => {
        const hint = document.getElementById('assemblyArHint');
        if (hint) hint.innerHTML = '🎯 Маркер найден — материнка появится на нём.';
    });
    marker.addEventListener('markerLost', () => {
        const hint = document.getElementById('assemblyArHint');
        if (hint) hint.innerHTML = '🔍 Ищу маркер… наведи камеру на Hiro.';
    });

    const mb = document.createElement('a-entity');
    mb.setAttribute('gltf-model', 'assets/models/motherboard.glb');
    mb.setAttribute('scale', '0.6 0.6 0.6');
    mb.setAttribute('rotation', '0 0 0');
    marker.appendChild(mb);

    scene.appendChild(marker);

    const camera = document.createElement('a-entity');
    camera.setAttribute('camera', '');
    scene.appendChild(camera);

    layer.appendChild(scene);
    assemblyArScene = scene;

    // Активируем AR-режим доски + защитный класс на body/html
    board.classList.add('ar-mode');
    document.body.classList.add('ar-active');
    document.documentElement.classList.add('ar-active');

    // MutationObserver: ловим появление video AR.js и сразу паркуем в слой
    const parkInto = (target) => {
        const video = document.getElementById('arjs-video');
        if (!video) return;
        if (video.parentNode !== target) target.appendChild(video);
        // iOS Safari: без playsinline/muted/autoplay видео не запустится inline
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');
        video.setAttribute('muted', '');
        video.setAttribute('autoplay', '');
        video.muted = true;
        video.playsInline = true;
        video.style.cssText =
            'position:absolute!important;top:0!important;left:0!important;' +
            'width:100%!important;height:100%!important;object-fit:cover!important;' +
            'margin:0!important;padding:0!important;transform:none!important;' +
            'z-index:1!important;display:block!important;opacity:1!important;';
        try { const p = video.play(); if (p && p.catch) p.catch(() => {}); } catch (e) {}
        document.querySelectorAll('body > canvas.a-canvas').forEach(c => {
            target.appendChild(c);
        });
    };
    assemblyArObserver = new MutationObserver(() => parkInto(layer));
    assemblyArObserver.observe(document.body, {
        childList: true,
        subtree: false,
        attributes: true,
        attributeFilter: ['style']
    });
    parkInto(layer);

    assemblyArOn = true;
    const toggle = document.getElementById('assemblyArToggle');
    if (toggle) toggle.classList.add('active');
    const hint = document.getElementById('assemblyArHint');
    if (hint) hint.innerHTML = '✓ Камера активна. Наведи её на маркер Hiro — материнка появится как фон.';
}

function toggleAssemblyAR() {
    if (assemblyArOn) {
        destroyAssemblyAR();
    } else {
        createAssemblyAR();
    }
}

window.addEventListener('beforeunload', () => {
    if (assemblyArOn && typeof stopAllCameraStreams === 'function') {
        stopAllCameraStreams();
    }
});
