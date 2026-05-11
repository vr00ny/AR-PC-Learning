// 3D-просмотрщик моделей на базе <model-viewer> от Google.
// Зависит от models3dData (js/data/models.js).

let currentModelIdx = 0;

function selectModel(idx) {
    const m = models3dData[idx];
    if (!m) return;
    currentModelIdx = idx;

    const viewer = document.getElementById('mainViewer');
    viewer.setAttribute('src', m.src);
    viewer.setAttribute('alt', m.name);

    document.getElementById('viewerName').textContent = m.name;
    document.getElementById('viewerDescription').textContent = m.description;
    document.getElementById('viewerSpecs').innerHTML =
        m.specs.map(s => `<li>${s}</li>`).join('');

    document.querySelectorAll('.model-thumb').forEach((t, i) => {
        t.classList.toggle('active', i === idx);
    });
}

function toggleAutoRotate() {
    const viewer = document.getElementById('mainViewer');
    const btn = document.getElementById('btnAutoRotate');
    const isOn = viewer.hasAttribute('auto-rotate');
    if (isOn) {
        viewer.removeAttribute('auto-rotate');
        btn.classList.remove('active');
    } else {
        viewer.setAttribute('auto-rotate', '');
        btn.classList.add('active');
    }
}

function resetCamera() {
    const viewer = document.getElementById('mainViewer');
    // Сбрасываем орбиту камеры в положение по умолчанию
    viewer.cameraOrbit = '0deg 75deg 105%';
    viewer.fieldOfView = 'auto';
    if (typeof viewer.resetTurntableRotation === 'function') {
        viewer.resetTurntableRotation();
    }
}

function loadViewer3d() {
    const thumbs = document.getElementById('modelThumbs');
    thumbs.innerHTML = '';
    models3dData.forEach((m, idx) => {
        const t = document.createElement('div');
        t.className = 'model-thumb';
        t.innerHTML = `
            <div class="model-thumb-icon">${m.icon}</div>
            <div class="model-thumb-name">${m.name}</div>`;
        t.onclick = () => selectModel(idx);
        thumbs.appendChild(t);
    });

    document.getElementById('btnAutoRotate').onclick = toggleAutoRotate;
    document.getElementById('btnReset').onclick = resetCamera;

    selectModel(0);
}
