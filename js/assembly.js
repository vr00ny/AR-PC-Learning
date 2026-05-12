// Игра сборки ПК. Перетаскивание pointer-событиями (мышь + тачскрин).
// Зависит от assemblyData (js/data/assembly.js).

let assemblyState = null;
let assemblyTimer = null;

function loadAssemblyGame() {
    renderAssemblyBoard();
    renderAssemblyTray();
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
        s.classList.remove('filled', 'highlight');
        s.innerHTML = slotData ? slotData.name : '';
    });
    // Возврат компонентов в лоток
    document.querySelectorAll('.tray-item').forEach(t => t.classList.remove('placed'));
    document.getElementById('assemblyWin').classList.remove('show');
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
        div.textContent = slot.name;
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

function findSlotAt(x, y, draggedItem) {
    // Временно прячем перетаскиваемый элемент, чтобы elementFromPoint его не вернул
    const prevPointerEvents = draggedItem.style.pointerEvents;
    draggedItem.style.pointerEvents = 'none';
    const el = document.elementFromPoint(x, y);
    draggedItem.style.pointerEvents = prevPointerEvents;
    if (!el) return null;
    return el.closest('.assembly-slot');
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
    if (Object.keys(assemblyState.placed).length === assemblyData.slots.length) {
        finishAssembly();
    }
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
