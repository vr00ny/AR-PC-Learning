// Данные для игры сборки — "Собери ПК в корпусе".
// Доска представляет открытый корпус ATX-tower (вид сбоку), внутри 6 зон-отсеков.
// Перетянул деталь в правильный отсек — засчитано.
//
// slots — позиции отсеков (в % от размера доски).
// components — что лежит в лотке. type должен совпадать с accepts соответствующего отсека.
// model — путь к .glb-модели (показывается вместо emoji-иконки).
const assemblyData = {
    slots: [
        // Верхний ряд: кулер CPU слева, блок питания справа
        { id: 'cooler', accepts: 'cooler', name: 'Кулер CPU',
          x: 6,  y: 6,  w: 26, h: 22 },
        { id: 'psu',    accepts: 'psu',    name: 'Блок питания',
          x: 66, y: 6,  w: 28, h: 22 },

        // Центр: материнская плата — самая большая зона
        { id: 'mobo',   accepts: 'mobo',   name: 'Материнская плата',
          x: 6,  y: 32, w: 60, h: 38 },

        // Под материнкой: видеокарта (длинный слот PCIe x16)
        { id: 'gpu',    accepts: 'gpu',    name: 'Видеокарта (PCIe)',
          x: 6,  y: 74, w: 60, h: 12 },

        // Правая колонка: отсеки для дисков
        { id: 'ssd',    accepts: 'ssd',    name: 'Отсек SSD',
          x: 70, y: 32, w: 24, h: 16 },
        { id: 'hdd',    accepts: 'hdd',    name: 'Отсек HDD',
          x: 70, y: 52, w: 24, h: 18 }
    ],
    components: [
        { type: 'mobo',   icon: '🔲', name: 'Материнская плата', model: 'assets/models/motherboard.glb' },
        { type: 'cooler', icon: '🌀', name: 'Кулер CPU'           /* без модели — cpu.glb весит 81МБ */ },
        { type: 'psu',    icon: '🔌', name: 'Блок питания',       model: 'assets/models/psu_real.glb' },
        { type: 'gpu',    icon: '🎮', name: 'Видеокарта',         model: 'assets/models/gpu_real.glb' },
        { type: 'ssd',    icon: '💿', name: 'SSD',                model: 'assets/models/ssd_real.glb' },
        { type: 'hdd',    icon: '💾', name: 'HDD',                model: 'assets/models/hdd.glb' }
    ]
};
