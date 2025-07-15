// Константы игры
export const GROWTH_PHASES = {
  seed: { 
    name: 'Прорастание', 
    duration: 15000, 
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
    duration: 25000, 
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
    duration: 45000, 
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
    duration: 60000, 
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
    growTimes: [15000, 25000, 45000, 60000], 
    baseYield: 25, 
    price: 800, 
    seedPrice: 150,
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
    growTimes: [14000, 23000, 40000, 55000], 
    baseYield: 35, 
    price: 1200, 
    seedPrice: 250,
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
    growTimes: [16000, 27000, 50000, 65000], 
    baseYield: 40, 
    price: 1500, 
    seedPrice: 300,
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
  pot_3l: { name: 'Горшок 3л', price: 50, effect: 0.7, type: 'pot', description: 'Базовый горшок, ограничивает урожай' },
  pot_5l: { name: 'Горшок 5л', price: 120, effect: 1.0, type: 'pot', description: 'Стандартный размер для хорошего урожая' },
  pot_10l: { name: 'Горшок 10л', price: 250, effect: 1.3, type: 'pot', description: 'Большой горшок, максимальный урожай' },
  cfl_lamp: { name: 'CFL лампа', price: 80, effect: 25, type: 'light', description: 'Энергосберегающая, слабое освещение' },
  led_panel: { name: 'LED панель', price: 200, effect: 45, type: 'light', description: 'Эффективное персональное освещение' },
  basic_drainage: { name: 'Дренаж', price: 30, effect: 0.2, type: 'drainage', description: 'Предотвращает корневую гниль' },
  reflector: { name: 'Рефлектор', price: 60, effect: 0.3, type: 'reflector', description: 'Увеличивает эффективность света на 30%' },
  small_fan: { name: 'Вентилятор', price: 90, effect: 0.25, type: 'ventilation', description: 'Улучшает циркуляцию воздуха' },
  ph_meter: { name: 'pH метр', price: 150, effect: 0.15, type: 'monitoring', description: 'Точный контроль кислотности' }
};

// Глобальное оборудование (на всю теплицу)
export const GLOBAL_EQUIPMENT = {
  led_system: { name: 'LED система', price: 2500, effect: 60, type: 'global_light', description: 'Умное освещение - автоматически подстраивается под фазу роста' },
  auto_watering: { name: 'Автополив', price: 1200, effect: 30, type: 'global_water', description: 'Поддерживает оптимальную влажность для каждой фазы роста' },
  climate_control: { name: 'Климат-контроль', price: 3000, effect: 35, type: 'global_climate', description: 'Автоматическая температура и влажность воздуха по фазам' },
  carbon_filter: { name: 'Угольный фильтр', price: 400, effect: 0.5, type: 'stealth', description: 'Убирает запах, снижает риск рейдов' },
  monitoring_hub: { name: 'Система мониторинга', price: 1500, effect: 20, type: 'monitoring', description: 'Автоматический pH контроль и предупреждения о проблемах' },
  ventilation_system: { name: 'Вентиляция', price: 800, effect: 15, type: 'ventilation', description: 'Улучшает здоровье растений и усиливает другие системы на 15%' },
  security_system: { name: 'Система безопасности', price: 2500, effect: 0.8, type: 'security', description: 'Снижает риск рейдов с 10% до 2%, маскировка' },
  backup_power: { name: 'Резервное питание', price: 3000, effect: 25, type: 'power', description: 'Защита от отключений, бесперебойная работа систем' },
  fertilizer: { name: 'Удобрения', price: 80, effect: 15, type: 'nutrients', consumable: true, description: 'Питательные вещества для растений' }
};

// Качества урожая
export const QUALITY_GRADES = {
  A: { name: 'Grade A', multiplier: 1.5, color: 'text-green-600', description: 'Премиум качество' },
  B: { name: 'Grade B', multiplier: 1.0, color: 'text-blue-600', description: 'Хорошее качество' },
  C: { name: 'Grade C', multiplier: 0.7, color: 'text-yellow-600', description: 'Среднее качество' },
  D: { name: 'Grade D', multiplier: 0.4, color: 'text-red-600', description: 'Низкое качество' }
};
