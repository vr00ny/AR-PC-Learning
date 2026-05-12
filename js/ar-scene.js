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
let originalGetUserMedia = null;
let fullscreenWatchdog = null;

// Список селекторов, которые нужно скрыть в AR-fullscreen режиме.
// Используем inline-стили вместо CSS-класса — надёжнее на iOS Safari,
// где AR.js может перебивать стили в момент инициализации.
const AR_FULLSCREEN_HIDE = [
    'body > .topbar',
    'body > footer',
    'main > .tab-content:not(#ar)',
    '#ar .sec-head',
    '#ar .ar-instructions',
    '#ar .camera-buttons',
    '#ar .marker-actions'
];

function enterArFullscreen() {
    AR_FULLSCREEN_HIDE.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
            if (el.dataset.arPrevDisplay === undefined) {
                el.dataset.arPrevDisplay = el.style.display || '';
            }
            el.style.setProperty('display', 'none', 'important');
        });
    });
    // AR-wrapper на весь экран — inline-стили с !important побеждают всё
    const wrapper = document.querySelector('.ar-wrapper');
    if (wrapper) {
        if (wrapper.dataset.arPrevStyle === undefined) {
            wrapper.dataset.arPrevStyle = wrapper.getAttribute('style') || '';
        }
        wrapper.setAttribute('style',
            'position:fixed!important;top:0!important;left:0!important;right:0!important;bottom:0!important;' +
            'width:100vw!important;height:100vh!important;height:100dvh!important;' +
            'margin:0!important;padding:0!important;border-radius:0!important;border:0!important;' +
            'z-index:10000!important;background:#000!important;'
        );
    }
    const container = document.getElementById('arContainer');
    if (container) {
        if (container.dataset.arPrevStyle === undefined) {
            container.dataset.arPrevStyle = container.getAttribute('style') || '';
        }
        container.setAttribute('style',
            'width:100%!important;height:100%!important;min-height:0!important;border-radius:0!important;'
        );
    }
    document.body.style.setProperty('overflow', 'hidden', 'important');
    document.documentElement.style.setProperty('overflow', 'hidden', 'important');
}

function exitArFullscreen() {
    document.querySelectorAll('[data-ar-prev-display]').forEach(el => {
        const prev = el.dataset.arPrevDisplay;
        el.style.display = prev;
        if (!prev) el.style.removeProperty('display');
        delete el.dataset.arPrevDisplay;
    });
    const wrapper = document.querySelector('.ar-wrapper');
    if (wrapper && wrapper.dataset.arPrevStyle !== undefined) {
        const prev = wrapper.dataset.arPrevStyle;
        if (prev) wrapper.setAttribute('style', prev); else wrapper.removeAttribute('style');
        delete wrapper.dataset.arPrevStyle;
    }
    const container = document.getElementById('arContainer');
    if (container && container.dataset.arPrevStyle !== undefined) {
        const prev = container.dataset.arPrevStyle;
        if (prev) container.setAttribute('style', prev); else container.removeAttribute('style');
        delete container.dataset.arPrevStyle;
    }
    document.body.style.removeProperty('overflow');
    document.documentElement.style.removeProperty('overflow');
}

// Снимок элементов body ДО запуска AR — чтобы после удалить только то, что AR.js добавил
let bodyChildrenSnapshot = null;

// Принудительный выбор задней камеры — AR.js не делает этого сам, и iPhone Safari
// часто открывает переднюю (селфи) камеру, где маркер зеркальный и не распознаётся.
function forceBackCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
    if (originalGetUserMedia) return; // уже подменено
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

    // Выключить watchdog и вернуть inline-стили в исходное состояние
    if (fullscreenWatchdog) {
        clearInterval(fullscreenWatchdog);
        fullscreenWatchdog = null;
    }
    exitArFullscreen();

    // Восстанавливаем оригинальный getUserMedia
    restoreGetUserMedia();

    // Удалить любые <style> и <script> которые A-Frame инжектил в head — иногда они
    // оставляют артефакты на iOS Safari (resize-listeners, viewport overrides)
    document.querySelectorAll('head style[data-href*="aframe"], style[data-injected]').forEach(s => s.remove());

    // Принудительная зачистка inline-стилей body/html — если что-то застряло
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('margin');
    document.body.style.removeProperty('padding');
    document.body.style.removeProperty('position');
    document.documentElement.style.removeProperty('overflow');
    document.documentElement.style.removeProperty('margin');
    document.documentElement.style.removeProperty('padding');

    // Подстраховка: ещё раз убираем классы (вдруг где-то race условие)
    document.body.classList.remove('ar-active', 'ar-fullscreen');
    document.documentElement.classList.remove('ar-active');

    // Force reflow — заставляем браузер пересчитать layout
    void document.body.offsetHeight;

    // На iOS Safari вёрстка иногда "залипает" после выхода из fullscreen-видео.
    // Двойной rAF + resize-event заставляет браузер полностью пересобрать страницу.
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            window.dispatchEvent(new Event('resize'));
            window.scrollTo(0, 0);
            // Ещё раз — на случай если за это время что-то добавилось
            document.body.classList.remove('ar-active', 'ar-fullscreen');
        });
    });

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

    // Принудительно задняя камера на iPhone
    forceBackCamera();

    // Запоминаем исходные inline-стили body/html и набор детей body
    savedBodyStyle = document.body.getAttribute('style') || '';
    savedHtmlStyle = document.documentElement.getAttribute('style') || '';
    bodyChildrenSnapshot = new Set(Array.from(document.body.children));

    const scene = document.createElement('a-scene');
    scene.setAttribute('embedded', '');
    // detectionMode: mono — для preset 'hiro' (matrix мешает pattern-распознаванию)
    // maxDetectionRate: 60 — чаще проверять кадры
    // patternRatio: 0.5 — стандартное соотношение для Hiro-маркера
    scene.setAttribute('arjs', 'sourceType: webcam; debugUIEnabled: false; detectionMode: mono; maxDetectionRate: 60; patternRatio: 0.5;');
    scene.setAttribute('vr-mode-ui', 'enabled: false');
    scene.setAttribute('renderer', 'logarithmicDepthBuffer: true; antialias: true;');
    scene.style.cssText = 'width:100%!important;height:100%!important;position:absolute!important;top:0!important;left:0!important;';

    const marker = document.createElement('a-marker');
    marker.setAttribute('preset', 'hiro');
    marker.setAttribute('smooth', 'true');
    marker.setAttribute('smoothCount', '5');
    marker.setAttribute('smoothTolerance', '0.01');
    marker.setAttribute('smoothThreshold', '2');
    marker.setAttribute('raycaster', 'objects: .clickable');
    marker.setAttribute('emitevents', 'true');
    marker.setAttribute('cursor', 'fuse: false; rayOrigin: mouse;');

    // События маркера — обновляем индикатор статуса
    marker.addEventListener('markerFound', () => {
        const info = document.getElementById('arInfoLabel');
        if (info) info.innerHTML = '// MARKER · LOCKED';
        const hint = document.getElementById('markerHint');
        if (hint) hint.style.opacity = '0';
    });
    marker.addEventListener('markerLost', () => {
        const info = document.getElementById('arInfoLabel');
        if (info) info.innerHTML = '// SEARCHING…';
        const hint = document.getElementById('markerHint');
        if (hint) {
            hint.innerHTML = '🎯 Наведи на маркер Hiro';
            hint.style.opacity = '1';
        }
    });

    // Контейнер материнки — поворачиваем плашмя на маркер и приподнимаем,
    // чтобы glb (Y-up) лёг параллельно маркеру и не уходил "под пол"
    const modelMb = document.createElement('a-entity');
    modelMb.setAttribute('id', 'arMb');
    modelMb.setAttribute('gltf-model', 'assets/models/motherboard.glb');
    modelMb.setAttribute('scale', '0.35 0.35 0.35');
    modelMb.setAttribute('position', '0 0.05 0');
    modelMb.setAttribute('rotation', '-90 0 0');
    modelMb.setAttribute('visible', 'true');

    const modelCpu = document.createElement('a-entity');
    modelCpu.setAttribute('id', 'arCpu');
    modelCpu.setAttribute('gltf-model', 'assets/models/cpu.glb');
    modelCpu.setAttribute('scale', '0.3 0.3 0.3');
    modelCpu.setAttribute('position', '0 0.1 0');
    modelCpu.setAttribute('rotation', '-90 0 0');
    modelCpu.setAttribute('visible', 'false');

    // Резервный куб — если glb не загрузится, хотя бы будет видно что трекинг работает
    const fallbackBox = document.createElement('a-box');
    fallbackBox.setAttribute('id', 'arFallback');
    fallbackBox.setAttribute('position', '0 0.5 0');
    fallbackBox.setAttribute('scale', '0.3 0.3 0.3');
    fallbackBox.setAttribute('material', 'color: #4fd1c5; opacity: 0.4; transparent: true');
    fallbackBox.setAttribute('animation', 'property: rotation; to: 0 360 0; loop: true; dur: 4000');
    fallbackBox.setAttribute('visible', 'false');

    // Если glb материнки не загрузится за 5 секунд — показываем fallback-куб
    modelMb.addEventListener('model-loaded', () => {
        const info = document.getElementById('arInfoLabel');
        if (info) info.innerHTML = '// MODEL · READY';
    });
    modelMb.addEventListener('model-error', (e) => {
        console.warn('AR model error:', e);
        fallbackBox.setAttribute('visible', 'true');
        const info = document.getElementById('arInfoLabel');
        if (info) info.innerHTML = '// MODEL · ERROR (fallback)';
    });

    marker.appendChild(modelMb);
    marker.appendChild(modelCpu);
    marker.appendChild(fallbackBox);
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
    // Fullscreen-режим: и inline-стили (надёжно на iOS), и класс (резерв для CSS)
    enterArFullscreen();
    document.body.classList.add('ar-fullscreen');

    // Watchdog: AR.js при инициализации может перетереть стили wrapper'а.
    // Каждые 500мс проверяем что fullscreen всё ещё активен.
    if (fullscreenWatchdog) clearInterval(fullscreenWatchdog);
    fullscreenWatchdog = setInterval(() => {
        if (!isCameraOn) return;
        const wrapper = document.querySelector('.ar-wrapper');
        if (wrapper && !wrapper.style.position.includes('fixed')) {
            enterArFullscreen();
        }
    }, 500);

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
