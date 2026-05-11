// Данные 3D-моделей для просмотрщика.
// Поле src — путь к .glb или .gltf файлу.
//
// Сейчас стоят временные модели из набора Khronos (для демонстрации).
// Когда скачаешь свои модели (например, с Sketchfab), положи их в assets/models/
// и замени src на 'assets/models/cpu.glb' и т.д.
//
// Поле icon — эмодзи для миниатюры выбора модели.
const models3dData = [
    {
        id: 'cpu',
        name: 'Процессор (CPU)',
        icon: '⚙️',
        src: 'assets/models/cpu.glb',
        description: 'Центральный процессор — основное вычислительное устройство. На нижней стороне расположены контакты для установки в сокет материнской платы.',
        specs: [
            'Сокет: LGA1700',
            'Количество ядер: до 24',
            'Частота: до 5.8 ГГц',
            'TDP: 65–125 Вт'
        ]
    },
    {
        id: 'gpu',
        name: 'Видеокарта (GPU)',
        icon: '🎮',
        src: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoomBox/glTF-Binary/BoomBox.glb',
        description: 'Графический процессор отвечает за вывод изображения и 3D-расчёты. Устанавливается в слот PCI-Express x16 на материнской плате.',
        specs: [
            'Интерфейс: PCI-Express 4.0 x16',
            'Видеопамять: до 24 ГБ GDDR6X',
            'Энергопотребление: 200–450 Вт',
            'Выходы: HDMI 2.1, DisplayPort 1.4'
        ]
    },
    {
        id: 'motherboard',
        name: 'Материнская плата',
        icon: '🔧',
        src: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb',
        description: 'Основа системного блока. Объединяет все компоненты — процессор, память, видеокарту, накопители — и обеспечивает их взаимодействие.',
        specs: [
            'Форм-фактор: ATX',
            'Чипсет: Z790',
            'Слоты RAM: 4× DDR5',
            'Слоты M.2: 4× NVMe',
            'Слоты PCIe: 1× x16, 2× x1'
        ]
    },
    {
        id: 'ram',
        name: 'Оперативная память',
        icon: '💾',
        src: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Lantern/glTF-Binary/Lantern.glb',
        description: 'Планка оперативной памяти — быстрое временное хранилище данных. Устанавливается в слоты DIMM на материнской плате.',
        specs: [
            'Тип: DDR5',
            'Объём: 16–32 ГБ за планку',
            'Частота: 4800–6400 МГц',
            'Тайминги: CL30–CL40'
        ]
    },
    {
        id: 'storage',
        name: 'NVMe SSD',
        icon: '💿',
        src: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/WaterBottle/glTF-Binary/WaterBottle.glb',
        description: 'Твердотельный накопитель в формате M.2. Подключается напрямую в слот M.2 на материнской плате через шину PCI-Express.',
        specs: [
            'Форм-фактор: M.2 2280',
            'Интерфейс: PCI-Express 4.0 x4 (NVMe)',
            'Объём: 500 ГБ – 4 ТБ',
            'Скорость чтения: до 7000 МБ/с'
        ]
    },
    {
        id: 'psu',
        name: 'Блок питания',
        icon: '🔌',
        src: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/MetalRoughSpheres/glTF-Binary/MetalRoughSpheres.glb',
        description: 'Преобразует переменный ток из розетки в постоянный для питания компонентов. От качества БП зависит стабильность всей системы.',
        specs: [
            'Мощность: 650–850 Вт',
            'Сертификат: 80 PLUS Gold',
            'Тип: модульный',
            'Защиты: OVP, UVP, SCP, OCP'
        ]
    }
];
