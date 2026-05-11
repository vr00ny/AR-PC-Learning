// AR-сцена на A-Frame + AR.js.
// Создаёт сцену с маркером Hiro и двумя GLTF-моделями (мат. плата / процессор).
// Сцена пересоздаётся при включении камеры и полностью удаляется при выключении.

let currentScene = null;
let isCameraOn = false;

function destroyARScene() {
    if (currentScene && currentScene.parentNode) {
        currentScene.parentNode.removeChild(currentScene);
        currentScene = null;
    }
    const container = document.getElementById('arContainer');
    const existingScene = container.querySelector('a-scene');
    if (existingScene) existingScene.remove();

    // Удаляем динамически созданные кнопки управления моделями
    const dynamicControls = container.querySelector('.ar-controls');
    if (dynamicControls) dynamicControls.remove();

    isCameraOn = false;
    document.getElementById('arInfoLabel').innerHTML = '// CAMERA OFF';
    document.getElementById('markerHint').innerHTML = '📸 Нажми «Включить камеру»';
    document.getElementById('markerHint').style.opacity = '1';
}

function createARScene() {
    if (isCameraOn) return;
    destroyARScene();

    const container = document.getElementById('arContainer');

    const scene = document.createElement('a-scene');
    scene.setAttribute('embedded', '');
    scene.setAttribute('arjs', 'sourceType: webcam; debugUIEnabled: false;');
    scene.setAttribute('vr-mode-ui', 'enabled: false');
    scene.style.cssText = 'width:100% !important; height:100% !important; position:absolute !important; top:0 !important; left:0 !important;';

    const marker = document.createElement('a-marker');
    marker.setAttribute('preset', 'hiro');

    // Модель материнской платы (временно — DamagedHelmet из Khronos)
    const modelMb = document.createElement('a-entity');
    modelMb.setAttribute('id', 'arMb');
    modelMb.setAttribute('gltf-model', 'assets/models/motherboard.glb');
    modelMb.setAttribute('scale', '0.5 0.5 0.5');
    modelMb.setAttribute('visible', 'true');

    // Модель процессора (временно — MetalRoughSpheres)
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

    // Кнопки переключения моделей появляются только при активной камере
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
