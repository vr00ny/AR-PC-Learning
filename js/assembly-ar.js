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
let assemblyArParkInterval = null;

function destroyAssemblyAR() {
    if (assemblyArParkInterval) {
        clearInterval(assemblyArParkInterval);
        assemblyArParkInterval = null;
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

    // Снять класс ar-mode с доски
    const board = document.getElementById('assemblyBoard');
    if (board) board.classList.remove('ar-mode');

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

    assemblyArBodyStyle = document.body.getAttribute('style') || '';
    assemblyArHtmlStyle = document.documentElement.getAttribute('style') || '';
    assemblyArBodyChildren = new Set(Array.from(document.body.children));

    const scene = document.createElement('a-scene');
    scene.setAttribute('embedded', '');
    scene.setAttribute('arjs', 'sourceType: webcam; debugUIEnabled: false; detectionMode: mono_and_matrix;');
    scene.setAttribute('vr-mode-ui', 'enabled: false');
    scene.setAttribute('renderer', 'logarithmicDepthBuffer: true;');

    const marker = document.createElement('a-marker');
    marker.setAttribute('preset', 'hiro');

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

    // Активируем AR-режим доски
    board.classList.add('ar-mode');

    // Паркуем video AR.js внутрь слоя
    assemblyArParkInterval = setInterval(() => {
        const video = document.getElementById('arjs-video');
        if (!video) return;
        if (video.parentNode !== layer) layer.appendChild(video);
        video.style.cssText =
            'position:absolute!important;top:0!important;left:0!important;' +
            'width:100%!important;height:100%!important;object-fit:cover!important;' +
            'margin:0!important;padding:0!important;transform:none!important;z-index:1!important;';
        clearInterval(assemblyArParkInterval);
        assemblyArParkInterval = null;
    }, 150);
    setTimeout(() => {
        if (assemblyArParkInterval) {
            clearInterval(assemblyArParkInterval);
            assemblyArParkInterval = null;
        }
    }, 10000);

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
