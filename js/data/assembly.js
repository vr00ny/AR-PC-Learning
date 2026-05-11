// Данные для игры сборки.
// slots — позиции слотов на материнской плате (в % от размера платы).
// components — что лежит в лотке и какой тип принимает каждый слот.
//
// Если хочешь добавить новый компонент:
// 1) Добавь объект в components с уникальным типом
// 2) Добавь слот в slots с accepts: 'тот же тип'
const assemblyData = {
    slots: [
        // Сокет процессора — крупный квадрат слева сверху
        { id: 'cpu',  accepts: 'cpu',  name: 'CPU',
          x: 8,  y: 12, w: 24, h: 26 },

        // Два слота оперативной памяти — вертикальные полосы
        { id: 'ram1', accepts: 'ram', name: 'DIMM 1',
          x: 40, y: 10, w: 5,  h: 32 },
        { id: 'ram2', accepts: 'ram', name: 'DIMM 2',
          x: 48, y: 10, w: 5,  h: 32 },

        // Слот M.2 SSD — горизонтальная тонкая полоса
        { id: 'm2',   accepts: 'ssd', name: 'M.2',
          x: 12, y: 50, w: 35, h: 7  },

        // PCI-Express x16 — широкая горизонтальная полоса для видеокарты
        { id: 'pcie', accepts: 'gpu', name: 'PCIe x16',
          x: 8,  y: 65, w: 58, h: 14 },

        // Разъём питания ATX 24-pin — справа
        { id: 'psu',  accepts: 'psu', name: 'ATX 24-pin',
          x: 73, y: 18, w: 12, h: 30 }
    ],
    components: [
        { type: 'cpu', icon: '⚙️', name: 'Процессор' },
        { type: 'ram', icon: '💾', name: 'RAM #1' },
        { type: 'ram', icon: '💾', name: 'RAM #2' },
        { type: 'ssd', icon: '💿', name: 'M.2 SSD' },
        { type: 'gpu', icon: '🎮', name: 'Видеокарта' },
        { type: 'psu', icon: '🔌', name: 'Кабель БП' }
    ]
};
