// Главный скрипт: переключение вкладок, мобильное меню, анимации появления.

// ===== Переключение вкладок =====
function openTabByName(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-link').forEach(b => b.classList.remove('active'));

    const tab = document.getElementById(tabName);
    if (tab) tab.classList.add('active');

    const link = document.querySelector(`.tab-link[data-tab="${tabName}"]`);
    if (link) link.classList.add('active');

    // Закрываем AR-камеру при уходе с вкладки AR
    if (tabName !== 'ar' && typeof destroyARScene === 'function') destroyARScene();

    // Закрываем мобильное меню
    const topbar = document.querySelector('.topbar');
    if (topbar) topbar.classList.remove('open');

    // Скролл к верху
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Перезапускаем reveal-анимации для появившегося контента
    requestAnimationFrame(observeReveals);
}

// Привязка кликов по табам через data-tab
document.querySelectorAll('.tab-link').forEach(btn => {
    btn.addEventListener('click', () => {
        openTabByName(btn.dataset.tab);
    });
});

// ===== Гамбургер-меню =====
const topbar = document.querySelector('.topbar');
const menuToggle = document.querySelector('.menu-toggle');
if (menuToggle && topbar) {
    menuToggle.addEventListener('click', () => {
        const open = topbar.classList.toggle('open');
        menuToggle.setAttribute('aria-expanded', open);
    });
}

// ===== Reveal-on-scroll =====
const revealObserver = new IntersectionObserver((entries) => {
    for (const e of entries) {
        if (e.isIntersecting) {
            e.target.classList.add('in');
            revealObserver.unobserve(e.target);
        }
    }
}, { threshold: 0.12 });

function observeReveals() {
    document.querySelectorAll('.reveal:not(.in), .stagger:not(.in)').forEach(el => {
        revealObserver.observe(el);
    });
}

// ===== Параллакс мини-материнки на главной =====
const scene = document.querySelector('.scene');
const mobo = document.querySelector('.mobo');
if (scene && mobo) {
    scene.addEventListener('mousemove', (e) => {
        const r = scene.getBoundingClientRect();
        const dx = (e.clientX - r.left) / r.width - 0.5;
        const dy = (e.clientY - r.top) / r.height - 0.5;
        mobo.style.transform = `rotateX(${6 - dy * 10}deg) rotateY(${-10 + dx * 14}deg) translateZ(0)`;
    });
    scene.addEventListener('mouseleave', () => { mobo.style.transform = ''; });
}

// ===== Мигание планок RAM =====
const rams = document.querySelectorAll('.ram');
if (rams.length) {
    setInterval(() => {
        rams.forEach(r => {
            if (Math.random() > 0.5) r.classList.toggle('active');
        });
    }, 1400);
}

// ===== Инициализация =====
loadComponents();
loadQuiz();
loadTheory();
loadViewer3d();
loadAssemblyGame();
observeReveals();

// AR-кнопки (привязка только если есть в DOM)
const startBtn = document.getElementById('startCameraBtn');
const stopBtn = document.getElementById('stopCameraBtn');
if (startBtn) startBtn.onclick = () => { createARScene(); };
if (stopBtn) stopBtn.onclick = () => { destroyARScene(); };
