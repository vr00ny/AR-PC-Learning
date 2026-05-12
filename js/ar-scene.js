// AR через iframe. AR.js работает в собственном документе (ar.html) и физически
// не может изменить viewport или стили родительской страницы. При выходе iframe
// удаляется — сайт остаётся в точности таким, каким был до запуска AR.

let isCameraOn = false;
let arMessageListener = null;

function destroyARScene() {
    const iframe = document.getElementById('arIframe');
    if (iframe) {
        // Дать iframe шанс остановить камеру через beforeunload
        iframe.remove();
    }
    if (arMessageListener) {
        window.removeEventListener('message', arMessageListener);
        arMessageListener = null;
    }
    isCameraOn = false;
}

function createARScene() {
    if (isCameraOn) return;
    destroyARScene();

    const iframe = document.createElement('iframe');
    iframe.id = 'arIframe';
    iframe.src = 'ar.html?ts=' + Date.now();
    iframe.allow = 'camera; microphone; xr-spatial-tracking; gyroscope; accelerometer';
    iframe.setAttribute('allowfullscreen', '');
    iframe.style.cssText =
        'position:fixed;top:0;left:0;width:100vw;height:100vh;' +
        'border:0;margin:0;padding:0;background:#000;z-index:10000;';
    document.body.appendChild(iframe);

    arMessageListener = (e) => {
        if (e.data && e.data.type === 'ar-close') destroyARScene();
    };
    window.addEventListener('message', arMessageListener);

    isCameraOn = true;
}

// stopAllCameraStreams / forceBackCamera / restoreGetUserMedia / snapshotPageLayout /
// restorePageLayout — больше не нужны для AR-вкладки, но assembly-ar.js на них ссылается,
// поэтому оставляем заглушки (для assembly-ar.js пока используется старый подход).

function stopAllCameraStreams() {
    document.querySelectorAll('video').forEach(v => {
        const s = v.srcObject;
        if (s && s.getTracks) s.getTracks().forEach(t => { try { t.stop(); } catch (e) {} });
        v.srcObject = null;
    });
}
function forceBackCamera() { /* no-op — теперь в ar.html */ }
function restoreGetUserMedia() { /* no-op */ }
function snapshotPageLayout() { /* no-op */ }
function restorePageLayout() { /* no-op */ }

window.addEventListener('beforeunload', () => {
    if (isCameraOn) stopAllCameraStreams();
});
