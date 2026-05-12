// Единый прогресс курса — компактная полоса под topbar.
// Источники прогресса (localStorage):
//   studied-components → Set имён открытых деталей
//   quiz-best → объект {testId: bestPercent}
//   assembly-best → объект {time, mistakes} или null
//   ar-completed → 1 если запускали AR-сборку
//
// Модули (модуль → текущий / total):
//   Теория        — заглушка: считаем по количеству развёрнутых разделов
//   Компоненты    — number(studied) / total(componentsData)
//   3D-просмотр   — открытых превью / total (опционально)
//   Игра сборки   — 0 или 1
//   Тесты         — пройдено / total
//   AR-сборка     — 0 или 1

const PROGRESS_MODULES = [
    { id: 'theory',     label: 'Теория',  tab: 'theory'    },
    { id: 'components', label: 'Детали',  tab: 'components' },
    { id: 'assembly',   label: 'Игра',    tab: 'assembly'  },
    { id: 'quiz',       label: 'Тесты',   tab: 'quiz'      },
    { id: 'ar',         label: 'AR',      tab: 'ar'        }
];

function progressGetCurrent() {
    const studied = (function () {
        try { return new Set(JSON.parse(localStorage.getItem('studied-components')) || []); }
        catch (e) { return new Set(); }
    })();
    const quizBest = (function () {
        try { return JSON.parse(localStorage.getItem('quiz-best')) || {}; }
        catch (e) { return {}; }
    })();
    const theorySeen = (function () {
        try { return new Set(JSON.parse(localStorage.getItem('theory-seen')) || []); }
        catch (e) { return new Set(); }
    })();
    const assemblyDone = localStorage.getItem('assembly-done') === '1';
    const arDone = localStorage.getItem('ar-completed') === '1';

    const totalComps = (window.componentsData && Object.keys(componentsData).length) || 12;
    const totalTheory = (window.theoryData && theoryData.length) || 6;
    const totalQuiz = (window.quizTests && quizTests.length) || 10;
    const quizPassedCount = Object.values(quizBest).filter(p => p >= 60).length;

    return {
        theory:     { done: theorySeen.size,        total: totalTheory },
        components: { done: studied.size,           total: totalComps  },
        assembly:   { done: assemblyDone ? 1 : 0,   total: 1           },
        quiz:       { done: quizPassedCount,        total: totalQuiz   },
        ar:         { done: arDone ? 1 : 0,         total: 1           }
    };
}

function progressTotalPercent() {
    const state = progressGetCurrent();
    let sum = 0, n = 0;
    PROGRESS_MODULES.forEach(m => {
        const s = state[m.id];
        if (!s || !s.total) return;
        sum += Math.min(1, s.done / s.total);
        n++;
    });
    return n ? Math.round((sum / n) * 100) : 0;
}

function renderProgressBar() {
    const bar = document.getElementById('progressBar');
    if (!bar) return;
    const state = progressGetCurrent();
    const modulesEl = bar.querySelector('.progress-modules');
    if (!modulesEl) return;
    modulesEl.innerHTML = '';
    PROGRESS_MODULES.forEach(m => {
        const s = state[m.id] || { done: 0, total: 1 };
        const pct = s.total ? Math.min(100, Math.round((s.done / s.total) * 100)) : 0;
        const done = pct === 100;
        const div = document.createElement('div');
        div.className = 'pm' + (done ? ' done' : '');
        div.onclick = () => { if (typeof openTabByName === 'function') openTabByName(m.tab); };
        div.style.cursor = 'pointer';
        if (done) {
            div.innerHTML =
                '<span>' + m.label + '</span>' +
                '<span class="check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></span>';
        } else {
            div.innerHTML =
                '<span>' + m.label + '</span>' +
                '<span class="bar"><i style="width:' + pct + '%"></i></span>' +
                '<span>' + s.done + '/' + s.total + '</span>';
        }
        modulesEl.appendChild(div);
    });
    const total = progressTotalPercent();
    const totalEl = bar.querySelector('.progress-total b');
    if (totalEl) totalEl.textContent = total + '%';
}

// Алиас для удобства из других файлов
function updateProgressBar() { renderProgressBar(); }

// API для трекинга событий из других файлов
function trackTheoryView(sectionId) {
    try {
        const seen = new Set(JSON.parse(localStorage.getItem('theory-seen')) || []);
        seen.add(sectionId);
        localStorage.setItem('theory-seen', JSON.stringify(Array.from(seen)));
    } catch (e) {}
    renderProgressBar();
}
function trackAssemblyDone() {
    try { localStorage.setItem('assembly-done', '1'); } catch (e) {}
    renderProgressBar();
}
function trackArDone() {
    try { localStorage.setItem('ar-completed', '1'); } catch (e) {}
    renderProgressBar();
}
function trackQuizBest(testId, percent) {
    try {
        const best = JSON.parse(localStorage.getItem('quiz-best')) || {};
        if (!best[testId] || percent > best[testId]) {
            best[testId] = percent;
            localStorage.setItem('quiz-best', JSON.stringify(best));
        }
    } catch (e) {}
    renderProgressBar();
}

// Рендер при загрузке (после того как data-скрипты подгрузились)
document.addEventListener('DOMContentLoaded', renderProgressBar);
// На случай если DOMContentLoaded уже был
if (document.readyState !== 'loading') renderProgressBar();
