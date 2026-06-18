// Игра сборки ПК. Перетаскивание pointer-событиями (мышь + тачскрин).
// Зависит от assemblyData (js/data/assembly.js).

let assemblyState = null;
let assemblyTimer = null;
let assemblyInfoTimer = null;

function loadAssemblyGame() {
    renderAssemblyBoard();
    renderAssemblyTray();
    ensureAssemblyInfoBox();
    resetAssemblyState();
}

function resetAssemblyState() {
    if (assemblyTimer) {
        clearInterval(assemblyTimer);
        assemblyTimer = null;
    }
    assemblyState = {
        placed: {},
        mistakes: 0,
        startTime: null,
        finished: false
    };
    // Очистка слотов
    document.querySelectorAll('.assembly-slot').forEach(s => {
        const slotData = assemblyData.slots.find(x => x.id === s.dataset.slotId);
        s.classList.remove('filled', 'highlight', 'hint-active');
        s.innerHTML = slotData ? slotData.name : '';
    });
    // Возврат компонентов в лоток
    document.querySelectorAll('.tray-item').forEach(t => t.classList.remove('placed'));
    document.getElementById('assemblyWin').classList.remove('show');
    hideAssemblyInfo();
    updateStats();
    document.getElementById('statTime').textContent = '0:00';
}

function renderAssemblyBoard() {
    const board = document.getElementById('assemblyBoard');
    board.innerHTML = '';
    assemblyData.slots.forEach(slot => {
        const div = document.createElement('div');
        div.className = 'assembly-slot';
        div.dataset.slotId = slot.id;
        div.dataset.accepts = slot.accepts;
        div.style.left = slot.x + '%';
        div.style.top = slot.y + '%';
        div.style.width = slot.w + '%';
        div.style.height = slot.h + '%';
        if (slot.z) div.style.zIndex = String(slot.z);
        div.textContent = slot.name;
        // Подсказка при наведении (без drag) — короткий hint в title-attr.
        // Полная инфа показывается, когда деталь поставлена.
        if (slot.hint) div.title = slot.hint;
        board.appendChild(div);
    });
}

function renderAssemblyTray() {
    const tray = document.getElementById('assemblyTray');
    tray.innerHTML = '';
    assemblyData.components.forEach((c, idx) => {
        const div = document.createElement('div');
        div.className = 'tray-item';
        div.dataset.type = c.type;
        div.dataset.idx = idx;
        // model-viewer показывает 3D-превью; pointer-events:none пропускает
        // драг-события в родителя .tray-item
        const visual = c.model
            ? `<model-viewer src="${c.model}" alt="${c.name}" auto-rotate
                  rotation-per-second="30deg" disable-zoom disable-tap interaction-prompt="none"
                  bounds="tight" shadow-intensity="0" exposure="1.1"
                  class="tray-item-model"></model-viewer>`
            : `<div class="tray-item-icon">${c.icon}</div>`;
        div.innerHTML = `${visual}<div class="tray-item-name">${c.name}</div>`;
        attachDragHandlers(div);
        tray.appendChild(div);
    });
}

function attachDragHandlers(item) {
    let offsetX = 0, offsetY = 0;
    let originalParent = null;
    let originalNextSibling = null;

    item.addEventListener('pointerdown', (e) => {
        if (item.classList.contains('placed')) return;
        e.preventDefault();

        // Запоминаем место в лотке, чтобы вернуть, если бросили неверно
        originalParent = item.parentNode;
        originalNextSibling = item.nextSibling;

        const rect = item.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;

        item.classList.add('dragging');
        // Перемещаем в body, чтобы мог свободно двигаться над всей страницей
        document.body.appendChild(item);
        item.style.width = rect.width + 'px';
        item.style.height = rect.height + 'px';
        item.style.left = (e.clientX - offsetX) + 'px';
        item.style.top = (e.clientY - offsetY) + 'px';

        startTimerIfNeeded();

        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
    });

    function onMove(e) {
        item.style.left = (e.clientX - offsetX) + 'px';
        item.style.top = (e.clientY - offsetY) + 'px';
        highlightCompatibleSlots(e.clientX, e.clientY, item.dataset.type);
    }

    function onUp(e) {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        clearHighlights();

        const slot = findSlotAt(e.clientX, e.clientY, item);

        // Возвращаем компонент в лоток (по умолчанию)
        returnToTray(item);

        if (!slot) {
            // Бросили мимо платы — без штрафа
            return;
        }

        const slotId = slot.dataset.slotId;
        const accepts = slot.dataset.accepts;
        const isFilled = !!assemblyState.placed[slotId];

        if (!isFilled && accepts === item.dataset.type) {
            placeItemInSlot(item, slot);
        } else {
            // Не тот тип или занятый слот — ошибка
            assemblyState.mistakes++;
            item.classList.add('shake');
            setTimeout(() => item.classList.remove('shake'), 400);
            updateStats();
        }
    }

    function returnToTray(item) {
        item.classList.remove('dragging');
        item.style.left = '';
        item.style.top = '';
        item.style.width = '';
        item.style.height = '';
        if (originalParent) {
            if (originalNextSibling && originalNextSibling.parentNode === originalParent) {
                originalParent.insertBefore(item, originalNextSibling);
            } else {
                originalParent.appendChild(item);
            }
        }
    }
}

// Ищем слот под курсором. Из-за того, что CPU/RAM/GPU перекрывают материнку
// (они на ней «лежат»), elementFromPoint вернёт самый верхний слот.
// Если он не принимает тип перетаскиваемой детали — пробуем нижележащие.
function findSlotAt(x, y, draggedItem) {
    const prevPe = draggedItem.style.pointerEvents;
    draggedItem.style.pointerEvents = 'none';
    const stack = document.elementsFromPoint(x, y);
    draggedItem.style.pointerEvents = prevPe;
    const type = draggedItem.dataset.type;

    // Сначала ищем слот, который принимает этот тип
    for (const el of stack) {
        const slot = el.closest && el.closest('.assembly-slot');
        if (slot && slot.dataset.accepts === type) return slot;
    }
    // Иначе возвращаем верхний слот — для красной shake-анимации
    for (const el of stack) {
        const slot = el.closest && el.closest('.assembly-slot');
        if (slot) return slot;
    }
    return null;
}

function highlightCompatibleSlots(x, y, type) {
    document.querySelectorAll('.assembly-slot').forEach(s => {
        const isFilled = !!assemblyState.placed[s.dataset.slotId];
        s.classList.toggle('highlight', s.dataset.accepts === type && !isFilled);
    });
}

function clearHighlights() {
    document.querySelectorAll('.assembly-slot').forEach(s => s.classList.remove('highlight'));
}

function placeItemInSlot(item, slot) {
    const slotId = slot.dataset.slotId;
    const slotData = assemblyData.slots.find(s => s.id === slotId);
    const component = assemblyData.components[item.dataset.idx];
    item.classList.add('placed');
    slot.classList.add('filled');
    // В слоте — крутящаяся 3D-моделька, если задана
    if (component.model) {
        slot.innerHTML = `<model-viewer src="${component.model}" alt="${component.name}"
            auto-rotate rotation-per-second="20deg" disable-zoom disable-tap
            interaction-prompt="none" bounds="tight" shadow-intensity="0" exposure="1.1"
            class="slot-model"></model-viewer>`;
    } else {
        slot.innerHTML = component.icon;
    }
    assemblyState.placed[slotId] = item.dataset.idx;
    updateStats();

    // Показываем объяснение «Где / Зачем / С чем связан» для установленной детали
    if (slotData && slotData.info) {
        showAssemblyInfo(slotData, component);
    }

    if (Object.keys(assemblyState.placed).length === assemblyData.slots.length) {
        finishAssembly();
    }
}

// === Информационная плашка под доской ===
function ensureAssemblyInfoBox() {
    if (document.getElementById('assemblyInfo')) return;
    const board = document.getElementById('assemblyBoard');
    const box = document.createElement('div');
    box.id = 'assemblyInfo';
    box.className = 'assembly-info';
    box.innerHTML =
        '<button class="assembly-info-close" aria-label="Закрыть" onclick="hideAssemblyInfo()">✕</button>' +
        '<div class="assembly-info-title" id="assemblyInfoTitle"></div>' +
        '<div class="assembly-info-body" id="assemblyInfoBody"></div>';
    board.parentNode.insertBefore(box, board.nextSibling);
}

function showAssemblyInfo(slotData, component) {
    const box = document.getElementById('assemblyInfo');
    const title = document.getElementById('assemblyInfoTitle');
    const body = document.getElementById('assemblyInfoBody');
    if (!box || !title || !body) return;
    const icon = component && component.icon ? component.icon : '🔧';
    const name = component && component.name ? component.name : slotData.name;
    title.innerHTML = `<span class="ai-icon">${icon}</span><span>${name}</span><span class="ai-tag">УСТАНОВЛЕНО</span>`;
    body.innerHTML =
        `<p><b>Где стоит:</b> ${slotData.info.where}</p>` +
        `<p><b>Зачем:</b> ${slotData.info.why}</p>` +
        `<p><b>Связи:</b> ${slotData.info.links}</p>`;
    box.classList.add('show');
    if (assemblyInfoTimer) clearTimeout(assemblyInfoTimer);
    assemblyInfoTimer = setTimeout(hideAssemblyInfo, 12000);
}

function hideAssemblyInfo() {
    const box = document.getElementById('assemblyInfo');
    if (box) box.classList.remove('show');
    if (assemblyInfoTimer) { clearTimeout(assemblyInfoTimer); assemblyInfoTimer = null; }
}

function startTimerIfNeeded() {
    if (assemblyState.startTime !== null) return;
    assemblyState.startTime = Date.now();
    assemblyTimer = setInterval(updateAssemblyTime, 1000);
}

function updateAssemblyTime() {
    if (!assemblyState || assemblyState.finished) return;
    const seconds = Math.floor((Date.now() - assemblyState.startTime) / 1000);
    document.getElementById('statTime').textContent = formatAssemblyTime(seconds);
}

function formatAssemblyTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
}

function updateStats() {
    const placedCount = Object.keys(assemblyState.placed).length;
    const total = assemblyData.slots.length;
    document.getElementById('statPlaced').textContent = `${placedCount} / ${total}`;
    document.getElementById('statMistakes').textContent = assemblyState.mistakes;
}

function finishAssembly() {
    assemblyState.finished = true;
    if (assemblyTimer) {
        clearInterval(assemblyTimer);
        assemblyTimer = null;
    }
    // Трекинг прогресса
    if (typeof trackAssemblyDone === 'function') trackAssemblyDone();
    const seconds = Math.floor((Date.now() - assemblyState.startTime) / 1000);
    const win = document.getElementById('assemblyWin');
    const mistakes = assemblyState.mistakes;
    let rating = '⭐⭐⭐';
    if (mistakes >= 3) rating = '⭐⭐';
    if (mistakes >= 6) rating = '⭐';
    win.innerHTML = `
        <div class="assembly-win-title">🎉 ПК собран!</div>
        <div class="assembly-win-stats">
            ${rating}<br>
            Время: <b>${formatAssemblyTime(seconds)}</b><br>
            Ошибок: <b>${mistakes}</b>
        </div>
        <button onclick="resetAssemblyState()">🔄 Собрать ещё раз</button>`;
    win.classList.add('show');
}
