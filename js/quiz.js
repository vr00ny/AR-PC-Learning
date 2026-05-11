// Система 10 тестов с сохранением лучших результатов в localStorage.
// Зависит от testsData (js/data/quiz.js) и componentsData (для картинок).

const QUIZ_STORAGE_KEY = 'arpc.testScores';
let currentTestId = null;

// ===== РАБОТА С localStorage =====
function loadScores() {
    try {
        const raw = localStorage.getItem(QUIZ_STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch (e) {
        return {};
    }
}

function saveScore(testId, score, total) {
    const scores = loadScores();
    const prev = scores[testId];
    const percent = Math.round((score / total) * 100);
    // Сохраняем только если результат лучше предыдущего
    if (!prev || percent > prev.percent) {
        scores[testId] = {
            score,
            total,
            percent,
            date: new Date().toISOString().slice(0, 10)
        };
        localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(scores));
    }
}

function resetAllScores() {
    if (!confirm('Удалить результаты всех тестов? Это действие нельзя отменить.')) return;
    localStorage.removeItem(QUIZ_STORAGE_KEY);
    renderTestList();
}

// ===== СПИСОК ТЕСТОВ =====
function loadQuiz() {
    renderTestList();
}

function renderTestList() {
    const grid = document.getElementById('testsList');
    if (!grid) return;
    grid.innerHTML = '';
    const scores = loadScores();

    testsData.forEach((test, idx) => {
        const card = document.createElement('div');
        const accent = test.accent ? ' ' + test.accent : '';
        card.className = 'test-card' + accent;
        card.onclick = () => openTest(test.id);

        const score = scores[test.id];
        let scoreHtml = '<span class="test-score-empty">не пройден</span>';
        if (score) {
            scoreHtml = `<span class="test-score">${score.score} / ${score.total} · ${score.percent}%</span>`;
        }

        const idLabel = 'TEST.' + String(idx + 1).padStart(2, '0');

        card.innerHTML = `
            <div class="test-icon">${test.icon}</div>
            <div class="test-meta">
                <div class="test-id">${idLabel}</div>
                <div class="test-title">${test.title}</div>
                <div class="test-desc">${test.description}</div>
                <div class="test-footer">
                    <span class="test-count">${test.questions.length} вопросов</span>
                    ${scoreHtml}
                </div>
            </div>`;
        grid.appendChild(card);
    });

    // Видимость кнопки сброса
    const hasAnyScores = Object.keys(scores).length > 0;
    const resetBtn = document.getElementById('btnResetScores');
    if (resetBtn) resetBtn.style.display = hasAnyScores ? 'inline-flex' : 'none';
}

// ===== ОТКРЫТИЕ ТЕСТА =====
function openTest(testId) {
    const test = testsData.find(t => t.id === testId);
    if (!test) return;
    currentTestId = testId;

    document.getElementById('quizListView').style.display = 'none';
    document.getElementById('quizRunnerView').style.display = 'block';

    document.getElementById('testRunnerTitle').textContent = test.title;
    document.getElementById('testRunnerDesc').textContent = test.description;

    const container = document.getElementById('quizQuestions');
    container.innerHTML = '';
    test.questions.forEach((q, idx) => {
        const div = document.createElement('div');
        div.className = 'quiz-question';
        div.setAttribute('data-q', idx);

        let html = '';
        // Картинка: реальное фото если есть, иначе SVG
        if (q.image && componentsData && componentsData[q.image]) {
            const c = componentsData[q.image];
            if (c.imageUrl) {
                html += `<div class="quiz-image"><img src="${c.imageUrl}" alt="${c.name}" loading="lazy"></div>`;
            } else if (c.svg) {
                html += `<div class="quiz-image"><svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5">${c.svg}</svg></div>`;
            }
        }

        html += `<h3>${q.text}</h3>`;
        q.options.forEach(opt => {
            html += `<label class="quiz-option"><input type="radio" name="q${idx}" value="${opt}"> <span>${opt}</span></label>`;
        });

        div.innerHTML = html;
        container.appendChild(div);
    });

    document.getElementById('quizResult').style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closeTest() {
    currentTestId = null;
    document.getElementById('quizListView').style.display = 'block';
    document.getElementById('quizRunnerView').style.display = 'none';
    renderTestList();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== ПРОВЕРКА ТЕСТА =====
function checkQuiz() {
    if (!currentTestId) return;
    const test = testsData.find(t => t.id === currentTestId);
    if (!test) return;

    document.querySelectorAll('.quiz-option').forEach(opt =>
        opt.classList.remove('correct-highlight', 'wrong-highlight')
    );
    let score = 0;
    test.questions.forEach((q, idx) => {
        const selected = document.querySelector(`input[name="q${idx}"]:checked`);
        document.querySelectorAll(`.quiz-question[data-q="${idx}"] .quiz-option`).forEach(opt => {
            const value = opt.querySelector('input').value;
            if (value === q.correct) {
                opt.classList.add('correct-highlight');
            }
            if (selected && value === selected.value && selected.value !== q.correct) {
                opt.classList.add('wrong-highlight');
            }
        });
        if (selected && selected.value === q.correct) score++;
    });

    const total = test.questions.length;
    const percent = Math.round((score / total) * 100);
    let rating = '⭐⭐⭐';
    if (percent < 75) rating = '⭐⭐';
    if (percent < 50) rating = '⭐';

    saveScore(currentTestId, score, total);

    const resultDiv = document.getElementById('quizResult');
    resultDiv.innerHTML = `
        <div class="quiz-result-rating">${rating}</div>
        <div class="quiz-result-score">${score} из ${total} (${percent}%)</div>
        <div class="quiz-result-actions">
            <button class="quiz-button" onclick="openTest('${currentTestId}')">🔄 Пройти ещё раз</button>
            <button class="quiz-button quiz-button-ghost" onclick="closeTest()">← К списку тестов</button>
        </div>`;
    resultDiv.className = 'quiz-result success';
    resultDiv.style.display = 'block';
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
