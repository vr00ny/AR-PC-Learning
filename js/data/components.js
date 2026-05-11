// Каталог из 12 компонентов ПК с SVG-иллюстрациями.
// id — двузначный код для лейбла // HW.XX, sub — короткая характеристика (отображается uppercase mono).
const componentsData = {
    cpu: {
        id: 'HW.01',
        name: 'Процессор',
        sub: 'CPU · Socket AM5',
        desc: 'Центральное вычислительное устройство. Выполняет команды программ и координирует работу всей системы.',
        specs: ['Сокет: LGA1700 / AM5', 'Ядра: до 24', 'Частота: до 5.8 ГГц', 'TDP: 65–125 Вт'],
        imageUrl: 'assets/images/cpu.jpg',
        svg: '<rect x="14" y="14" width="36" height="36" rx="2"/><rect x="22" y="22" width="20" height="20"/><g><path d="M22 8v6M28 8v6M34 8v6M40 8v6M22 50v6M28 50v6M34 50v6M40 50v6M8 22h6M8 28h6M8 34h6M8 40h6M50 22h6M50 28h6M50 34h6M50 40h6"/></g>'
    },
    motherboard: {
        id: 'HW.02',
        name: 'Мат. плата',
        sub: 'MB · ATX',
        desc: 'Основная плата, объединяющая все компоненты. Передаёт данные между CPU, памятью, видеокартой и накопителями.',
        specs: ['Форм-фактор: ATX', 'Чипсет: Z790 / B650', 'Слоты RAM: 4× DDR5', 'Слоты M.2: 4× NVMe'],
        imageUrl: 'assets/images/motherboard.jpg',
        svg: '<rect x="8" y="8" width="48" height="48" rx="2"/><rect x="14" y="14" width="14" height="14"/><rect x="34" y="14" width="16" height="4"/><rect x="34" y="22" width="16" height="4"/><rect x="14" y="36" width="36" height="6"/><rect x="14" y="46" width="20" height="4"/><circle cx="44" cy="48" r="1.5"/>'
    },
    ram: {
        id: 'HW.03',
        name: 'Память',
        sub: 'RAM · DDR5',
        desc: 'Оперативная память — быстрое временное хранилище для данных работающих программ.',
        specs: ['Тип: DDR5', 'Объём: до 64 ГБ', 'Частота: 4800–6400 МГц', 'Тайминги: CL30–CL40'],
        imageUrl: 'assets/images/ram.jpg',
        svg: '<rect x="6" y="20" width="52" height="24" rx="1"/><rect x="10" y="26" width="6" height="6"/><rect x="18" y="26" width="6" height="6"/><rect x="26" y="26" width="6" height="6"/><rect x="34" y="26" width="6" height="6"/><rect x="42" y="26" width="6" height="6"/><rect x="50" y="26" width="4" height="6"/><path d="M14 44v6M20 44v6M28 44v6M36 44v6M44 44v6M50 44v6"/>'
    },
    gpu: {
        id: 'HW.04',
        name: 'Видеокарта',
        sub: 'GPU · PCIe ×16',
        desc: 'Отвечает за вывод изображения и 3D-расчёты. Необходима для игр, рендеринга и работы с графикой.',
        specs: ['Интерфейс: PCIe 4.0 x16', 'Видеопамять: до 24 ГБ', 'TDP: 200–450 Вт', 'Выходы: HDMI, DisplayPort'],
        imageUrl: 'assets/images/gpu.jpg',
        svg: '<rect x="6" y="18" width="52" height="22" rx="1"/><circle cx="18" cy="29" r="6"/><circle cx="36" cy="29" r="6"/><path d="M18 23v12M14 29h8M36 23v12M32 29h8"/><path d="M6 40h6v6M52 40h6v6"/><rect x="48" y="20" width="6" height="4"/>'
    },
    ssd: {
        id: 'HW.05',
        name: 'SSD',
        sub: 'NVMe · M.2 2280',
        desc: 'Твердотельный накопитель в формате M.2. Самый быстрый тип хранения данных для современных ПК.',
        specs: ['Интерфейс: PCIe 4.0 x4', 'Объём: 500 ГБ – 4 ТБ', 'Чтение: до 7000 МБ/с', 'Форм-фактор: M.2 2280'],
        imageUrl: 'assets/images/ssd.jpg',
        svg: '<rect x="6" y="24" width="52" height="16" rx="1"/><rect x="10" y="28" width="10" height="8"/><rect x="24" y="28" width="10" height="8"/><rect x="38" y="28" width="10" height="8"/><circle cx="54" cy="32" r="1.5"/><path d="M2 30h4M2 34h4"/>'
    },
    hdd: {
        id: 'HW.06',
        name: 'Жёсткий диск',
        sub: 'HDD · SATA 3.5"',
        desc: 'Магнитный накопитель большого объёма. Дешевле SSD, но значительно медленнее.',
        specs: ['Интерфейс: SATA III', 'Объём: 1–20 ТБ', 'Скорость: 5400–7200 RPM', 'Форм-фактор: 3.5"'],
        imageUrl: 'assets/images/hdd.jpg',
        svg: '<rect x="8" y="8" width="48" height="48" rx="2"/><circle cx="32" cy="32" r="14"/><circle cx="32" cy="32" r="5"/><path d="M32 18 L24 28 M32 18 L40 28"/>'
    },
    psu: {
        id: 'HW.07',
        name: 'Блок питания',
        sub: 'PSU · 750W · 80+',
        desc: 'Преобразует переменный ток из розетки в постоянный для всех компонентов системы.',
        specs: ['Мощность: 650–850 Вт', 'Сертификат: 80 PLUS Gold', 'Тип: модульный', 'Защиты: OVP, SCP, OCP'],
        imageUrl: 'assets/images/psu.jpg',
        svg: '<rect x="6" y="14" width="52" height="36" rx="2"/><circle cx="20" cy="32" r="10"/><circle cx="20" cy="32" r="4"/><path d="M20 22v20M10 32h20"/><rect x="36" y="22" width="16" height="4"/><rect x="36" y="30" width="16" height="4"/><rect x="36" y="38" width="12" height="4"/>'
    },
    cooler: {
        id: 'HW.08',
        name: 'Кулер',
        sub: 'FAN · 120mm',
        desc: 'Охлаждение процессора. Бывает воздушное (башенный кулер) и жидкостное (СЖО).',
        specs: ['Тип: башенный / СЖО', 'Размер вентилятора: 120 мм', 'Скорость: до 2000 RPM', 'TDP отвод: до 250 Вт'],
        imageUrl: 'assets/images/cooler.jpg',
        svg: '<rect x="8" y="8" width="48" height="48" rx="3"/><circle cx="32" cy="32" r="18"/><circle cx="32" cy="32" r="4"/><path d="M32 14 C 38 24 38 26 32 32 M32 14 C 26 24 26 26 32 32"/><path d="M50 32 C 40 38 38 38 32 32 M50 32 C 40 26 38 26 32 32"/><path d="M32 50 C 26 40 26 38 32 32 M32 50 C 38 40 38 38 32 32"/><path d="M14 32 C 24 26 26 26 32 32 M14 32 C 24 38 26 38 32 32"/>'
    },
    case: {
        id: 'HW.09',
        name: 'Корпус',
        sub: 'CASE · Mid Tower',
        desc: 'Физический корпус, в который устанавливаются все компоненты. От него зависит охлаждение и удобство сборки.',
        specs: ['Форм-фактор: Mid Tower', 'Поддержка плат: ATX', 'Слоты накопителей: 6+', 'Длина GPU: до 400 мм'],
        imageUrl: 'assets/images/case.jpg',
        svg: '<rect x="16" y="6" width="32" height="52" rx="2"/><rect x="22" y="14" width="20" height="20"/><circle cx="26" cy="42" r="1.5"/><circle cx="32" cy="42" r="1.5"/><path d="M22 50h20M22 54h12"/>'
    },
    cables: {
        id: 'HW.10',
        name: 'Кабели',
        sub: '24-PIN · SATA · PCIe',
        desc: 'Кабели для подачи питания на компоненты от блока питания. Каждый тип имеет свой разъём.',
        specs: ['ATX 24-pin для платы', 'EPS 8-pin для CPU', 'PCIe 6+2 для GPU', 'SATA для накопителей'],
        imageUrl: 'assets/images/cables.jpg',
        svg: '<path d="M6 32 C 16 32 18 16 32 16 C 46 16 48 48 58 48"/><path d="M6 40 C 18 40 20 28 32 28 C 44 28 46 56 58 56"/><rect x="2" y="28" width="6" height="16" rx="1"/><rect x="56" y="44" width="6" height="16" rx="1"/>'
    },
    chipset: {
        id: 'HW.11',
        name: 'Чипсет',
        sub: 'PCH · B650 / Z790',
        desc: 'Микросхема на материнской плате, управляющая связью между процессором и периферией.',
        specs: ['Назначение: I/O контроллер', 'Шины: PCIe, SATA, USB', 'Производители: Intel, AMD', 'Уровни: H/B/Z (Intel)'],
        imageUrl: 'assets/images/chipset.jpg',
        svg: '<rect x="16" y="16" width="32" height="32" rx="2"/><rect x="24" y="24" width="16" height="16"/><path d="M24 8v8M32 8v8M40 8v8M24 48v8M32 48v8M40 48v8M8 24h8M8 32h8M8 40h8M48 24h8M48 32h8M48 40h8"/>'
    },
    bios: {
        id: 'HW.12',
        name: 'BIOS / UEFI',
        sub: 'FIRMWARE · BOOT',
        desc: 'Прошивка материнской платы. Загружается при включении, инициализирует железо и запускает ОС.',
        specs: ['Тип: UEFI (современный)', 'Хранение: чип на плате', 'Настройки: BOOT, XMP, OC', 'Обновляется производителем'],
        imageUrl: 'assets/images/bios.jpg',
        svg: '<rect x="6" y="14" width="52" height="36" rx="2"/><path d="M6 22h52"/><circle cx="12" cy="18" r="1"/><circle cx="16" cy="18" r="1"/><path d="M12 30h12M12 36h20M12 42h8"/><path d="M40 32h12M40 38h12"/>'
    }
};
