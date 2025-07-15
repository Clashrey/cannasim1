import { GROWTH_PHASES, INDIVIDUAL_EQUIPMENT, QUALITY_GRADES } from '../data/constants';

// Функция расчета качества урожая
export const calculatePlantQuality = (conditions, equipment, phase) => {
  const { water, light, temp, nutrients, health } = conditions;
  let qualityScore = 100;
  
  // Получаем идеальные условия для текущей фазы
  const idealConditions = GROWTH_PHASES[phase]?.idealConditions;
  
  if (idealConditions) {
    // Проверяем каждый параметр относительно идеальных условий для фазы
    const [minWater, maxWater] = idealConditions.water;
    const [minLight, maxLight] = idealConditions.light;
    const [minTemp, maxTemp] = idealConditions.temp;
    const [minNutrients, maxNutrients] = idealConditions.nutrients;
    
    // Штрафы за выход за пределы идеальных условий
    if (water < minWater || water > maxWater) qualityScore -= 25;
    if (light < minLight || light > maxLight) qualityScore -= 20;
    if (temp < minTemp || temp > maxTemp) qualityScore -= 20;
    if (nutrients < minNutrients || nutrients > maxNutrients) qualityScore -= 15;
  } else {
    // Стандартные проверки если нет данных о фазе
    if (water < 20 || water > 95) qualityScore -= 30;
    if (light < 40) qualityScore -= 25;
    if (temp < 40 || temp > 90) qualityScore -= 20;
    if (nutrients > 90) qualityScore -= 15;
  }
  
  // Влияние здоровья
  qualityScore *= (health / 100);
  
  // Влияние оборудования
  if (equipment.monitoring) qualityScore += 10;
  if (equipment.ventilation) qualityScore += 8;
  if (equipment.drainage) qualityScore += 5;
  
  // Определение класса качества
  if (qualityScore >= 80) return 'A';
  if (qualityScore >= 65) return 'B';
  if (qualityScore >= 45) return 'C';
  return 'D';
};

// Функция расчета размера урожая
export const calculateYieldMultiplier = (conditions, equipment) => {
  let multiplier = 1.0;
  
  // Влияние горшка
  if (equipment.pot) {
    const potEffect = INDIVIDUAL_EQUIPMENT[equipment.pot]?.effect || 1.0;
    multiplier *= potEffect;
  } else {
    multiplier *= 0.5;
  }
  
  // Влияние освещения
  const lightLevel = conditions.light;
  if (lightLevel < 40) multiplier *= 0.5;
  else if (lightLevel > 80) multiplier *= 1.2;
  
  // Влияние здоровья
  multiplier *= (conditions.health / 100);
  
  // Бонус от рефлектора
  if (equipment.reflector) multiplier *= 1.15;
  
  return Math.max(0.1, multiplier);
};

// Функция обновления условий растения
export const updatePlantConditions = (plot, globalEquipment, GROWTH_PHASES, INDIVIDUAL_EQUIPMENT) => {
  if (!plot.plant) return plot;
  
  const now = Date.now();
  const strain = plot.plant.strain;
  const phaseIndex = Object.keys(GROWTH_PHASES).indexOf(plot.plant.phase);
  
  // Проверка роста
  let newPlant = { ...plot.plant };
  if (now - plot.plant.plantedAt > plot.plant.currentPhaseDuration) {
    const phases = Object.keys(GROWTH_PHASES);
    const currentIndex = phases.indexOf(plot.plant.phase);
    if (currentIndex < phases.length - 1) {
      newPlant.phase = phases[currentIndex + 1];
      newPlant.currentPhaseDuration += (strain.growTimes?.[currentIndex + 1] || GROWTH_PHASES[phases[currentIndex + 1]].duration);
    }
  }
  
  // Расчет освещения с учетом умной LED системы
  let lightLevel = 30;
  if (globalEquipment.led_system && plot.plant) {
    const phase = plot.plant.phase;
    const idealLight = GROWTH_PHASES[phase]?.idealConditions?.light;
    if (idealLight) {
      lightLevel = (idealLight[0] + idealLight[1]) / 2;
    } else {
      lightLevel = 70;
    }
  } else if (globalEquipment.led_system) {
    lightLevel = 70;
  } else if (plot.equipment.light) {
    const lightItem = INDIVIDUAL_EQUIPMENT[plot.equipment.light];
    lightLevel = lightItem ? lightItem.effect : 30;
    
    if (plot.equipment.reflector) {
      lightLevel *= 1.3;
    }
  }
  
  // Деградация условий с учетом умных систем
  let waterDecay = Math.random() * 1.5;
  let tempDecay = Math.random() * 0.8;
  let nutrientDecay = Math.random() * 0.5;
  
  // Умный автополив
  if (globalEquipment.auto_watering && plot.plant) {
    const phase = plot.plant.phase;
    const idealWater = GROWTH_PHASES[phase]?.idealConditions?.water;
    if (idealWater) {
      const targetWater = (idealWater[0] + idealWater[1]) / 2;
      const currentWater = plot.conditions.water;
      if (currentWater < targetWater) {
        waterDecay = -2;
      } else {
        waterDecay *= 0.2;
      }
    } else {
      waterDecay *= 0.3;
    }
  }
  
  // Умный климат-контроль
  let targetTemp = 75;
  if (globalEquipment.climate_control && plot.plant) {
    const phase = plot.plant.phase;
    const idealTemp = GROWTH_PHASES[phase]?.idealConditions?.temp;
    if (idealTemp) {
      targetTemp = (idealTemp[0] + idealTemp[1]) / 2;
    }
    tempDecay = 0;
  } else if (globalEquipment.climate_control) {
    tempDecay = 0;
  }
  
  const newConditions = {
    water: Math.max(0, Math.min(100, plot.conditions.water - waterDecay)),
    light: Math.min(100, lightLevel),
    temp: globalEquipment.climate_control ? targetTemp : Math.max(0, plot.conditions.temp - tempDecay),
    nutrients: Math.max(0, plot.conditions.nutrients - nutrientDecay),
    health: plot.conditions.health
  };
  
  // Влияние условий на здоровье
  const avgCondition = (newConditions.water + newConditions.light + newConditions.temp + newConditions.nutrients) / 4;
  let healthChange = 0;
  
  if (avgCondition < 40) {
    healthChange = -Math.random() * 2;
  } else if (avgCondition > 80) {
    healthChange = Math.random() * 1;
  }
  
  // Бонусы от глобальных систем
  if (globalEquipment.ventilation_system) healthChange += 0.5;
  if (globalEquipment.monitoring_hub && plot.plant) healthChange += 0.3;
  if (globalEquipment.backup_power) healthChange += 0.2;
  
  // Бонусы от индивидуального оборудования
  if (plot.equipment.ventilation) healthChange += 0.2;
  if (plot.equipment.drainage && newConditions.water > 90) healthChange += 0.5;
  
  // Синергия систем
  if (globalEquipment.ventilation_system) {
    if (globalEquipment.led_system) healthChange += 0.1;
    if (globalEquipment.auto_watering) healthChange += 0.1;
    if (globalEquipment.climate_control) healthChange += 0.1;
  }
  
  newConditions.health = Math.max(0, Math.min(100, newConditions.health + healthChange));
  
  return {
    ...plot,
    plant: newPlant,
    conditions: newConditions
  };
};

// Функция расчета риска рейдов
export const calculateRaidRisk = (globalEquipment, isBlackMarket) => {
  if (!isBlackMarket) return false;
  
  let riskChance = 0.1; // Базовый риск 10%
  
  if (globalEquipment.security_system) {
    riskChance = 0.02; // Снижается до 2%
  }
  
  if (globalEquipment.carbon_filter && globalEquipment.security_system) {
    riskChance = 0.01; // Комбо систем - всего 1%
  }
  
  return Math.random() < riskChance;
};
