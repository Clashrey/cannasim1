// Константы игры
export const GROWTH_PHASES = {
  seed: { 
    name: 'Прорастание', 
    duration: 50000, // 5 дней × 10 сек = 50 сек
    icon: '🌰',
    description: 'Семена впитывают воду и начинают прорастать. Нужна постоянная влажность!',
    tips: 'Держите почву влажной, но не заливайте. Температура 20-25°C оптимальна.',
    idealConditions: {
      water: [70, 90],
      light: [20, 40],
      temp: [60, 80],
      nutrients: [20, 40]
    }
  },
  sprout: { 
    name: 'Росток', 
    duration: 100000, // 10 дней × 10 сек = 100 сек
    icon: '🌱',
    description: 'Появляются первые листочки. Растение очень уязвимо к пересыханию.',
    tips: 'Легкий полив каждый день. Слабое освещение 12-16 часов в сутки.',
    idealConditions: {
      water: [60, 80],
      light: [30, 50],
      temp: [65, 85],
      nutrients: [30, 50]
    }
  },
  veg: { 
    name: 'Вегетация', 
    duration: 280000, // 28 дней × 10 сек = 280 сек
    icon: '🌿',
    description: 'Активный рост зеленой массы. Растение наращивает корни и листья.',
    tips: 'Интенсивное освещение 18-24 часа. Регулярное удобрение азотом. Обрезка для формирования.',
    idealConditions: {
      water: [50, 70],
      light: [60, 90],
      temp: [70, 90],
      nutrients: [60, 80]
    }
  },
  flower: { 
    name: 'Цветение', 
    duration: 700000, // 70 дней × 10 сек = 700 сек
    icon: '🌸',
    description: 'Формирование соцветий. Самая важная фаза для урожая!',
    tips: 'Световой режим 12/12 часов. Удобрения с фосфором и калием. Контроль влажности <50%.',
    idealConditions: {
      water: [40, 60],
      light: [70, 95],
      temp: [60, 80],
      nutrients: [70, 90]
    }
  },
  harvest: { 
    name: 'Готов к сбору', 
    duration: 0, 
    icon: '💚',
    description: 'Трихомы стали молочными - время собирать урожай!',
    tips: 'Срезайте утром. Сушите в темном месте 7-14 дней при 18-20°C.',
    idealConditions: {
      water: [30, 50],
      light: [50, 70],
      temp: [50, 70],
      nutrients: [40, 60]
    }
  }
};

export const STRAINS = {
  thai_stick: {
    name: 'Thai Stick',
    growTimes: [50000, 100000, 280000, 700000], // Реалистичное время роста
    baseYield: 12,
    price: 160, // Реалистичные цены за грамм
    seedPrice: 500,
    hardiness: 0.8,
    description: 'Классический тайский сорт',
    genetics: 'Sativa 90% / Indica 10%',
    thc: '12-16%',
    flowering: '10-12 недель',
    difficulty: 'Средняя',
    climate: 'Тропический, высокая влажность',
    effects: 'Энергичный, творческий подъем'
  },
  northern_lights: {
    name: 'Northern Lights',
    growTimes: [40000, 80000, 250000, 490000], // Быстрее растет
    baseYield: 14,
    price: 240,
    seedPrice: 800,
    hardiness: 0.9,
    description: 'Выносливый индика сорт',
    genetics: 'Indica 95% / Sativa 5%',
    thc: '16-21%',
    flowering: '7-9 недель',
    difficulty: 'Легкая',
    climate: 'Устойчив к холоду и влажности',
    effects: 'Расслабляющий, снотворный'
  },
  sour_diesel: {
    name: 'Sour Diesel',
    growTimes: [60000, 120000, 350000, 770000], // Медленнее растет
    baseYield: 15,
    price: 320,
    seedPrice: 1200,
    hardiness: 0.6,
    description: 'Премиум сатива',
    genetics: 'Sativa 70% / Indica 30%',
    thc: '20-25%',
    flowering: '10-11 недель',
    difficulty: 'Высокая',
    climate: 'Предпочитает сухой климат',
    effects: 'Мощный церебральный, фокусировка'
  }
};

// Оборудование для отдельных ячеек
export const INDIVIDUAL_EQUIPMENT = {
  pot_3l: { name: 'Горшок 3л', price: 200, effect: 0.7, type: 'pot', description: 'Базовый горшок, ограничивает урожай' },
  pot_5l: { name: 'Горшок 5л', price: 400, effect: 1.0, type: 'pot', description: 'Стандартный размер для хорошего урожая' },
  pot_10l: { name: 'Горшок 10л', price: 800, effect: 1.3, type: 'pot', description: 'Большой горшок, максимальный урожай' },
  pot_smart_20l: { name: 'Умный горшок 20л', price: 1500, effect: 1.5, type: 'pot', description: 'Премиум горшок с автодренажем' },
  
  cfl_lamp: { name: 'CFL лампа 125W', price: 800, effect: 25, type: 'light', description: 'Энергосберегающая, слабое освещение' },
  led_panel_100w: { name: 'LED панель 100W', price: 2500, effect: 45, type: 'light', description: 'Эффективное освещение' },
  led_panel_300w: { name: 'LED панель 300W', price: 6000, effect: 65, type: 'light', description: 'Мощное профессиональное освещение' },
  
  basic_drainage: { name: 'Дренаж', price: 300, effect: 0.2, type: 'drainage', description: 'Предотвращает корневую гниль' },
  reflector: { name: 'Рефлектор', price: 600, effect: 0.3, type: 'reflector', description: 'Увеличивает эффективность света на 30%' },
  small_fan: { name: 'Вентилятор', price: 800, effect: 0.25, type: 'ventilation', description: 'Улучшает циркуляцию воздуха' },
  
  thermometer: { name: 'Термометр', price: 300, effect: 0.1, type: 'monitoring', description: 'Контроль температуры и влажности' },
  ph_meter: { name: 'pH метр', price: 1200, effect: 0.15, type: 'monitoring', description: 'Точный контроль кислотности' },
  tds_meter: { name: 'TDS метр', price: 1800, effect: 0.2, type: 'monitoring', description: 'Контроль концентрации питательных веществ' },
  combo_meter: { name: 'Комбо-прибор 4в1', price: 4000, effect: 0.35, type: 'monitoring', description: 'pH, TDS, температура, влажность' }
};

// Глобальное оборудование (на всю теплицу)
export const GLOBAL_EQUIPMENT = {
  auto_watering: { 
    name: 'Автополив', 
    price: 12000, 
    effect: 30, 
    type: 'global_water', 
    description: 'Поддерживает оптимальную влажность для каждой фазы роста' 
  },
  led_system: { 
    name: 'LED система', 
    price: 18000, 
    effect: 60, 
    type: 'global_light', 
    description: 'Умное освещение - автоматически подстраивается под фазу роста' 
  },
  climate_control: { 
    name: 'Климат-контроль', 
    price: 25000, 
    effect: 35, 
    type: 'global_climate', 
    description: 'Автоматическая температура и влажность воздуха по фазам' 
  },
  ventilation_system: { 
    name: 'Система вентиляции', 
    price: 8000, 
    effect: 15, 
    type: 'ventilation', 
    description: 'Канальная вентиляция с угольным фильтром' 
  },
  carbon_filter: { 
    name: 'Угольный фильтр', 
    price: 3500, 
    effect: 0.5, 
    type: 'stealth', 
    description: 'Убирает запах, снижает риск рейдов' 
  },
  monitoring_hub: { 
    name: 'Система мониторинга', 
    price: 15000, 
    effect: 20, 
    type: 'monitoring', 
    description: 'Автоматический контроль всех параметров и предупреждения' 
  },
  security_system: { 
    name: 'Система безопасности', 
    price: 20000, 
    effect: 0.8, 
    type: 'security', 
    description: 'Снижает риск рейдов с 10% до 2%, маскировка' 
  },
  backup_power: { 
    name: 'Резервное питание', 
    price: 22000, 
    effect: 25, 
    type: 'power', 
    description: 'Защита от отключений, бесперебойная работа систем' 
  },
  uv_sterilizer: { 
    name: 'УФ стерилизатор', 
    price: 4500, 
    effect: 0.5, 
    type: 'health', 
    description: 'Снижает риск болезней на 50%' 
  },

  // Расходники
  fertilizer_basic: { 
    name: 'Базовые удобрения', 
    price: 400, 
    effect: 15, 
    type: 'nutrients', 
    consumable: true, 
    description: 'Универсальные питательные вещества' 
  },
  fertilizer_premium: { 
    name: 'Премиум удобрения', 
    price: 800, 
    effect: 20, 
    type: 'nutrients', 
    consumable: true, 
    description: 'Сбалансированные удобрения с микроэлементами' 
  },
  fertilizer_veg: { 
    name: 'Удобрения для роста (N)', 
    price: 600, 
    effect: 18, 
    type: 'nutrients', 
    consumable: true, 
    description: 'Высокоазотные удобрения для вегетации' 
  },
  fertilizer_bloom: { 
    name: 'Удобрения для цветения (P-K)', 
    price: 700, 
    effect: 22, 
    type: 'nutrients', 
    consumable: true, 
    description: 'Фосфорно-калийные удобрения для цветения' 
  },
  cal_mag: { 
    name: 'Cal-Mag добавка', 
    price: 500, 
    effect: 10, 
    type: 'nutrients', 
    consumable: true, 
    description: 'Предотвращает дефициты кальция и магния' 
  },
  fungicide: { 
    name: 'Фунгицид', 
    price: 900, 
    effect: 0, 
    type: 'medicine', 
    consumable: true, 
    description: 'Лечит грибковые заболевания (корневая гниль, мучнистая роса)' 
  },
  insecticide: { 
    name: 'Инсектицид', 
    price: 600, 
    effect: 0, 
    type: 'medicine', 
    consumable: true, 
    description: 'Против паутинного клеща и других вредителей' 
  },
  root_stimulator: { 
    name: 'Стимулятор корней', 
    price: 1100, 
    effect: 15, 
    type: 'medicine', 
    consumable: true, 
    description: 'Ускоряет восстановление после болезней и стресса' 
  }
};

// Качества урожая
export const QUALITY_GRADES = {
  A: { name: 'Grade A', multiplier: 1.5, color: 'text-green-600', description: 'Премиум качество' },
  B: { name: 'Grade B', multiplier: 1.0, color: 'text-blue-600', description: 'Хорошее качество' },
  C: { name: 'Grade C', multiplier: 0.7, color: 'text-yellow-600', description: 'Среднее качество' },
  D: { name: 'Grade D', multiplier: 0.4, color: 'text-red-600', description: 'Низкое качество' }
};
