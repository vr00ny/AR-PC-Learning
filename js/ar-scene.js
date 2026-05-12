// AR-сцена на A-Frame + AR.js.
// Создаёт сцену с маркером Hiro и двумя GLTF-моделями (мат. плата / процессор).
//
// Главная проблема AR.js: при запуске библиотека добавляет <video id="arjs-video">
// прямо в <body>, растягивает его на весь экран и меняет стили body/html.
// После выключения камеры этот мусор остаётся — поэтому здесь мы:
//   1) запоминаем исходные inline-стили body/html ДО включения
//   2) перемещаем video AR.js внутрь нашего контейнера и фиксируем его размеры
//   3) при выключении останавливаем все MediaStream-треки (гасим лампочку камеры)
//   4) удаляем добавленные AR.js элементы и возвращаем стили обратно

let currentScene = null;
let isCameraOn = false;
let savedBodyStyle = null;
let savedHtmlStyle = null;
let videoParkObserver = null;

// Снимок элементов body ДО запуска AR — чтобы после удалить только то, что AR.js добавил
let bodyChildrenSnapshot = null;

function stopAllCameraStreams() {
    // Остановить треки у всех video на странице (AR.js может оставить видимый или скрытый)
    document.querySelectorAll('video').forEach(v => {
        const stream = v.srcObject;
        if (stream && typeof stream.getTracks === 'function') {
            stream.getTracks().forEach(t => {
                try { t.stop(); } catch (e) { /* ignore */ }
            });
            v.srcObject = null;
        }
        try { v.pause(); } catch (e) { /* ignore */ }
    });
}

function destroyARScene() {
    // Перестать следить за видео-элементом
    if (videoParkObserver) {
        videoParkObserver.disconnect();
        videoParkObserver = null;
    }

    // 1) Гасим камеру — иначе индикатор в браузере останется гореть
    stopAllCameraStreams();

    // 2) Удаляем элементы, которые AR.js / A-Frame добавили в body
    //    (всё, что не было в body до запуска камеры)
    if (bodyChildrenSnapshot) {
        Array.from(document.body.children).forEach(node => {
            if (!bodyChildrenSnapshot.has(node)) {
                try { node.remove(); } catch (e) { /* ignore */ }
            }
        });
        bodyChildrenSnapshot = null;
    }
    // На всякий случай — явная зачистка известных id AR.js
    document.querySelectorAll('#arjs-video, video#arjs-video').forEach(v => v.remove());

    // 3) Удаляем нашу сцену из контейнера
    const container = document.getElementById('arContainer');
    if (currentScene && currentScene.parentNode) {
        currentScene.parentNode.removeChild(currentScene);
    }
    currentScene = null;
    if (container) {
        container.querySelectorAll('a-scene').forEach(s => s.remove());
        const dynamicControls = container.querySelector('.ar-controls');
        if (dynamicControls) dynamicControls.remove();
    }

    // 4) Возвращаем исходные inline-стили body и html
    if (savedBodyStyle !== null) {
        document.body.setAttribute('style', savedBodyStyle);
        if (!savedBodyStyle) document.body.removeAttribute('style');
        savedBodyStyle = null;
    }
    if (savedHtmlStyle !== null) {
        document.documentElement.setAttribute('style', savedHtmlStyle);
        if (!savedHtmlStyle) document.documentElement.removeAttribute('style');
        savedHtmlStyle = null;
    }

    document.body.classList.remove('ar-active');
    document.documentElement.classList.remove('ar-active');
    document.body.classList.remove('ar-fullscreen');

    // Убрать кнопку выхода
    const exitBtn = document.getElementById('arExitBtn');
    if (exitBtn) exitBtn.remove();

    isCameraOn = false;
    const info = document.getElementById('arInfoLabel');
    const hint = document.getElementById('markerHint');
    if (info) info.innerHTML = '// CAMERA OFF';
    if (hint) {
        hint.innerHTML = '📸 Нажми «Включить камеру»';
        hint.style.opacity = '1';
    }
}

function parkArjsVideo(container) {
    // AR.js помещает <video id="arjs-video"> в body и растягивает на весь экран.
    // Мы насильно перемещаем его в наш контейнер и переопределяем стили,
    // чтобы видео жило только внутри рамки AR-вкладки.
    const video = document.getElementById('arjs-video');
    if (!video) return false;

    if (video.parentNode !== container) {
        container.appendChild(video);
    }
    // iOS Safari требует playsinline + muted + autoplay, иначе video не играет inline
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('muted', '');
    video.setAttribute('autoplay', '');
    video.muted = true;
    video.playsInline = true;
    video.style.cssText =
        'position:absolute!important;' +
        'top:0!important;left:0!important;' +
        'width:100%!important;height:100%!important;' +
        'object-fit:cover!important;' +
        'z-index:1!important;' +
        'margin:0!important;padding:0!important;' +
        'transform:none!important;' +
        'display:block!important;' +
        'opacity:1!important;';
    // Запустить воспроизведение принудительно (iOS любит явный play)
    try { const p = video.play(); if (p && p.catch) p.catch(() => {}); } catch (e) {}
    // Также перенесём канвас A-Frame если он каким-то образом оторвался в body
    document.querySelectorAll('body > canvas.a-canvas').forEach(c => {
        container.appendChild(c);
    });
    return true;
}

function watchForArjsVideo(container) {
    // MutationObserver реагирует на появление video мгновенно — быстрее polling'а.
    // Также подчищает inline-стили body, которые AR.js навешивает (margin:0, overflow и т.п.).
    const observer = new MutationObserver(() => {
        parkArjsVideo(container);
    });
    observer.observe(document.body, {
        childList: true,
        subtree: false,
        attributes: true,
        attributeFilter: ['style']
    });
    // Первая попытка сразу — на случай если видео уже создано
    parkArjsVideo(container);
    return observer;
}

function createARScene() {
    if (isCameraOn) return;
    destroyARScene();

    const container = document.getElementById('arContainer');
    if (!container) return;

    // Запоминаем исходные inline-стили body/html и набор детей body
    savedBodyStyle = document.body.getAttribute('style') || '';
    savedHtmlStyle = document.documentElement.getAttribute('style') || '';
    bodyChildrenSnapshot = new Set(Array.from(document.body.children));

    const scene = document.createElement('a-scene');
    scene.setAttribute('embedded', '');
    scene.setAttribute('arjs', 'sourceType: webcam; debugUIEnabled: false; detectionMode: mono_and_matrix;');
    scene.setAttribute('vr-mode-ui', 'enabled: false');
    scene.setAttribute('renderer', 'logarithmicDepthBuffer: true;');
    scene.style.cssText = 'width:100%!important;height:100%!important;position:absolute!important;top:0!important;left:0!important;';

    const marker = document.createElement('a-marker');
    marker.setAttribute('preset', 'hiro');

    const modelMb = document.createElement('a-entity');
    modelMb.setAttribute('id', 'arMb');
    modelMb.setAttribute('gltf-model', 'assets/models/motherboard.glb');
    modelMb.setAttribute('scale', '0.5 0.5 0.5');
    modelMb.setAttribute('visible', 'true');

    const modelCpu = document.createElement('a-entity');
    modelCpu.setAttribute('id', 'arCpu');
    modelCpu.setAttribute('gltf-model', 'assets/models/cpu.glb');
    modelCpu.setAttribute('scale', '0.4 0.4 0.4');
    modelCpu.setAttribute('position', '0 0.3 0');
    modelCpu.setAttribute('visible', 'false');

    marker.appendChild(modelMb);
    marker.appendChild(modelCpu);
    scene.appendChild(marker);

    const camera = document.createElement('a-entity');
    camera.setAttribute('camera', '');
    scene.appendChild(camera);

    container.appendChild(scene);
    currentScene = scene;
    isCameraOn = true;

    // CSS-класс с !important-правилами защищает body/html от попыток AR.js поменять их inline-стили
    document.body.classList.add('ar-active');
    document.documentElement.classList.add('ar-active');
    // Fullscreen-режим — сайт прячется, AR на весь экран
    document.body.classList.add('ar-fullscreen');

    // Кнопка "Выйти из AR" в правом верхнем углу
    let exitBtn = document.getElementById('arExitBtn');
    if (!exitBtn) {
        exitBtn = document.createElement('button');
        exitBtn.id = 'arExitBtn';
        exitBtn.className = 'ar-exit-btn';
        exitBtn.setAttribute('aria-label', 'Выйти из AR');
        exitBtn.innerHTML = '✕';
        exitBtn.onclick = () => destroyARScene();
        document.body.appendChild(exitBtn);
    }

    // AR.js создаёт <video> асинхронно после getUserMedia. MutationObserver
    // мгновенно поймает появление видео и припаркует его в контейнер,
    // плюс будет откатывать изменения inline-стилей body.
    videoParkObserver = watchForArjsVideo(container);

    // Кнопки переключения моделей
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'ar-controls';
    controlsDiv.innerHTML = '<button id="dynamicBtnMb">🔧 Мат. плата</button><button id="dynamicBtnCpu">⚙️ Процессор</button>';
    container.appendChild(controlsDiv);

    document.getElementById('dynamicBtnMb').onclick = () => {
        const mb = document.getElementById('arMb');
        const cpu = document.getElementById('arCpu');
        if (mb && cpu) {
            mb.setAttribute('visible', 'true');
            cpu.setAttribute('visible', 'false');
            document.getElementById('arInfoLabel').innerHTML = '// TRACKING · MOBO';
        }
    };
    document.getElementById('dynamicBtnCpu').onclick = () => {
        const mb = document.getElementById('arMb');
        const cpu = document.getElementById('arCpu');
        if (mb && cpu) {
            mb.setAttribute('visible', 'false');
            cpu.setAttribute('visible', 'true');
            document.getElementById('arInfoLabel').innerHTML = '// TRACKING · CPU';
        }
    };

    document.getElementById('arInfoLabel').innerHTML = '// TRACKING · MOBO';
    document.getElementById('markerHint').innerHTML = '📸 Наведи камеру на маркер Hiro';
    setTimeout(() => {
        const hint = document.getElementById('markerHint');
        if (hint) hint.style.opacity = '0';
    }, 5000);
}

// На случай если пользователь закроет вкладку браузера с активной камерой —
// явно отключаем поток (некоторые мобильные браузеры иначе оставляют его жить).
window.addEventListener('beforeunload', () => {
    if (isCameraOn) stopAllCameraStreams();
});
