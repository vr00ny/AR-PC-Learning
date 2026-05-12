// AR-фон для игры сборки через iframe.
// Видео + AR.js живут в ar-assembly.html (отдельный документ — viewport
// главной страницы не страдает). Поверх iframe в parent создаётся overlay
// со HTML-доской сборки, лотком и статистикой. При выходе iframe + overlay
// удаляются, HTML-элементы возвращаются на их исходные места.

let assemblyArSession = null;
let assemblyArOn = false;

function destroyAssemblyAR() {
    if (!assemblyArSession) {
        assemblyArOn = false;
        const toggle = document.getElementById('assemblyArToggle');
        if (toggle) toggle.classList.remove('active');
        return;
    }

    // Вернуть HTML-элементы на их исходные места и убрать inline-стили
    (assemblyArSession.moved || []).forEach(({ el, parent, next, origStyle }) => {
        if (!el || !parent) return;
        try {
            if (next && next.parentNode === parent) parent.insertBefore(el, next);
            else parent.appendChild(el);
            if (origStyle) el.setAttribute('style', origStyle);
            else el.removeAttribute('style');
            el.classList.remove('ar-mode');
        } catch (e) {}
    });

    // Удалить overlay (iframe внутри уничтожится автоматически, AR.js гасит
    // камеру в своём beforeunload-хендлере)
    if (assemblyArSession.overlay) assemblyArSession.overlay.remove();

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
    // Если на AR-вкладке камера активна — выключить
    if (typeof destroyARScene === 'function') destroyARScene();

    const board = document.getElementById('assemblyBoard');
    const tray = document.getElementById('assemblyTray');
    if (!board || !tray) return;

    const stats = document.querySelector('.assembly-stats');
    const trayTitle = document.querySelector('.assembly-tray-title');

    // Запоминаем где элементы лежали и какие у них были стили
    const moved = [];
    [stats, trayTitle, board, tray].forEach(el => {
        if (el) moved.push({
            el,
            parent: el.parentNode,
            next: el.nextSibling,
            origStyle: el.getAttribute('style')
        });
    });

    // Overlay поверх всего
    const overlay = document.createElement('div');
    overlay.id = 'assemblyArOverlay';
    overlay.style.cssText =
        'position:fixed;top:0;left:0;right:0;bottom:0;width:100vw;height:100vh;' +
        'z-index:10000;background:#000;overflow:hidden;';

    // iframe с AR-сценой (видео + маркер). pointer-events:none чтобы
    // touch события проходили в HTML-overlay поверх (slots/tray).
    const iframe = document.createElement('iframe');
    iframe.id = 'assemblyArIframe';
    iframe.src = 'ar-assembly.html?ts=' + Date.now();
    iframe.allow = 'camera; microphone; xr-spatial-tracking; gyroscope; accelerometer';
    iframe.setAttribute('allowfullscreen', '');
    iframe.style.cssText =
        'position:absolute;top:0;left:0;width:100%;height:100%;' +
        'border:0;margin:0;padding:0;pointer-events:none;z-index:1;';
    overlay.appendChild(iframe);

    // Кнопка выхода
    const exitBtn = document.createElement('button');
    exitBtn.className = 'ar-exit-btn';
    exitBtn.setAttribute('aria-label', 'Выйти');
    exitBtn.innerHTML = '✕';
    exitBtn.onclick = destroyAssemblyAR;
    exitBtn.style.cssText =
        'position:fixed;top:calc(env(safe-area-inset-top,0px) + 14px);' +
        'right:calc(env(safe-area-inset-right,0px) + 14px);z-index:10300;' +
        'width:46px;height:46px;border-radius:50%;border:1px solid rgba(255,255,255,0.25);' +
        'background:rgba(11,15,23,0.78);color:#fff;font-size:22px;font-weight:500;' +
        'display:flex;align-items:center;justify-content:center;cursor:pointer;' +
        'backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);' +
        'box-shadow:0 4px 16px rgba(0,0,0,0.4);';
    overlay.appendChild(exitBtn);

    // Перемещаем HTML-элементы в overlay поверх iframe
    if (stats) {
        stats.style.cssText =
            'position:fixed;top:calc(env(safe-area-inset-top,0px) + 12px);left:12px;right:76px;' +
            'margin:0;z-index:10100;background:rgba(11,15,23,0.78);' +
            'backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);' +
            'border:1px solid rgba(140,170,210,0.25);border-radius:10px;' +
            'display:grid;grid-template-columns:repeat(3,1fr);overflow:hidden;';
        overlay.appendChild(stats);
    }
    if (board) {
        board.classList.add('ar-mode');
        board.style.cssText =
            'position:fixed;top:80px;bottom:140px;left:12px;right:12px;' +
            'width:auto;height:auto;aspect-ratio:auto;margin:0;z-index:10100;' +
            'background:rgba(11,15,23,0.10);border:1px solid rgba(140,170,210,0.4);' +
            'border-radius:10px;overflow:visible;';
        overlay.appendChild(board);
    }
    if (tray) {
        tray.style.cssText =
            'position:fixed;bottom:calc(env(safe-area-inset-bottom,0px) + 12px);' +
            'left:12px;right:12px;margin:0;z-index:10100;' +
            'background:rgba(11,15,23,0.85);' +
            'backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);' +
            'border:1px solid rgba(140,170,210,0.25);border-radius:12px;' +
            'display:grid;grid-template-columns:repeat(6,1fr);gap:6px;padding:10px;min-height:0;';
        overlay.appendChild(tray);
    }

    document.body.appendChild(overlay);

    assemblyArSession = { overlay, iframe, moved };
    assemblyArOn = true;
    const toggle = document.getElementById('assemblyArToggle');
    if (toggle) toggle.classList.add('active');
}

function toggleAssemblyAR() {
    if (assemblyArOn) destroyAssemblyAR();
    else createAssemblyAR();
}
