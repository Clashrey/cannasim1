// Компоненты UI
  const PlotComponent = ({ plot, onSelect }) => {
    const getPlotColor = () => {
      if (!plot.plant) return 'bg-gray-300';
      
      // Цвет в зависимости от здоровья растения
      if (plot.conditions.health < 30) return 'bg-red-300 animate-pulse'; // Критическое состояние
      if (plot.conditions.health < 60) return 'bg-orange-200'; // Плохое состояние
      if (plot.conditions.health < 80) return 'bg-yellow-200'; // Среднее состояние
      return 'bg-green-200'; // Хорошее состояние
    };

    const getStatusIndicators = () => {
      if (!plot.plant) return [];
      
      const indicators = [];
      const phase = plot.plant.phase;
      const idealConditions = GROWTH_PHASES[phase]?.idealConditions;
      
      if (idealConditions) {
        // Проверяем критические состояния
        if (plot.conditions.water < 20) indicators.push('💀'); // Засуха
        else if (plot.conditions.water > 90) indicators.push('🌊'); // Переувлажнение
        else if (plot.conditions.water < idealConditions.water[0]) indicators.push('🏜️'); // Маловато воды
        
        if (plot.conditions.nutrients > 95) indicators.push('🔥'); // Ожог питательными веществами
        else if (plot.conditions.nutrients < 10) indicators.push('🍃'); // Голодание
        
        if (plot.conditions.temp > 90) indicators.push('🌡️'); // Тепловой стресс
        
        if (plot.conditions.health < 50) indicators.push('🤒'); // Болезнь
      }
      
      return indicators;
    };

    const getEquipmentIcons = () => {
      const icons = [];
      if (plot.equipment.pot) icons.push('📦');
      if (plot.equipment.light) icons.push('💡');
      if (plot.equipment.drainage) icons.push('🚰');
      if (plot.equipment.reflector) icons.push('🪞');
      if (plot.equipment.ventilation) icons.push('🌪️');
      if (plot.equipment.monitoring) icons.push('📊');
      return icons;
    };

    return (
      <div 
        className={`w-28 h-28 rounded-lg border-2 border-gray-400 ${getPlotColor()} cursor-pointer flex flex-col items-center justify-center text-xs relative`}
        onClick={() => onSelect(plot.id)}
      >
        {plot.plant ? (
          <React.Fragment>
            <div className="text-2xl">{GROWTH_PHASES[plot.plant.phase].icon}</div>
            <div className="font-medium">{STRAINS[plot.plant.strain].name.split(' ')[0]}</div>
            <div>❤️{Math.floor(plot.conditions.health)}%</div>
            
            {/* Индикаторы проблем */}
            {getStatusIndicators().length > 0 && (
              <div className="absolute top-1 right-1 flex">
                {getStatusIndicators().map((indicator, index) => (
                  <span key={index} className="text-xs">{indicator}</span>
                ))}
              </div>
            )}
          </React.Fragment>
        ) : (
          <div className="text-gray-500 text-center">
            {plot.equipment.pot ? (
              <div>
                <div className="text-green-600 font-medium">📦 Готов</div>
                <div className="text-xs">к посадке</div>
              </div>
            ) : (
              <div>
                <div className="text-red-600 font-medium">Пусто</div>
                <div className="text-xs">нужен горшок</div>
              </div>
            )}
          </div>
        )}
        
        {/* Индикаторы оборудования */}
        <div className="absolute bottom-1 right-1 flex flex-wrap gap-1">
          {getEquipmentIcons().map((icon, index) => (
            <span key={index} className="text-xs">{icon}</span>
          ))}
        </div>
      </div>
    );
  };import React, { useState, useEffect } from 'react';
import { GROWTH_PHASES, STRAINS, INDIVIDUAL_EQUIPMENT, GLOBAL_EQUIPMENT, QUALITY_GRADES } from '../data/constants';
import { calculatePlantQuality, calculateYieldMultiplier, updatePlantConditions, calculateRaidRisk } from '../utils/gameLogic';
import { saveGame, loadGame, hasSave, getSaveInfo, deleteSave } from '../utils/saveSystem';

export default function CannabisSimulator() {
  // Основное состояние игры
  const [gameState, setGameState] = useState({
    money: 10000, // Увеличенный стартовый капитал
    level: 1,
    experience: 0,
    day: 1
  });

  // Состояние теплицы
  const [greenhouse, setGreenhouse] = useState({
    plots: Array(6).fill(null).map((_, i) => ({
      id: i,
      plant: null,
      conditions: { water: 50, light: 30, temp: 60, nutrients: 40, health: 100 },
      equipment: {
        pot: null,
        light: null,
        drainage: null,
        reflector: null,
        ventilation: null,
        monitoring: null
      },
      diseases: []
    })),
    globalEquipment: {
      led_system: false,
      auto_watering: false,
      climate_control: false,
      carbon_filter: false,
      monitoring_hub: false,
      ventilation_system: false,
      security_system: false,
      backup_power: false
    }
  });

  // Инвентарь
  const [inventory, setInventory] = useState({
    seeds: { thai_stick: 3, northern_lights: 0, sour_diesel: 0 },
    harvest: { 
      thai_stick: { A: 0, B: 0, C: 0, D: 0 }, 
      northern_lights: { A: 0, B: 0, C: 0, D: 0 }, 
      sour_diesel: { A: 0, B: 0, C: 0, D: 0 } 
    },
    individualEquipment: {},
    globalEquipment: {},
    fertilizer: 0, // Убираем стартовые удобрения
    medicines: {
      fungicide: 0,
      insecticide: 0,
      root_stimulator: 0
    }
  });

  // UI состояние
  const [activeTab, setActiveTab] = useState('greenhouse');
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [saveInfo, setSaveInfo] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');

  // Загрузка игры при старте
  useEffect(() => {
    const savedGame = loadGame();
    if (savedGame) {
      setGameState(savedGame.gameState);
      setGreenhouse(savedGame.greenhouse);
      setInventory(savedGame.inventory);
      console.log('🎮 Игра загружена из localStorage');
    }
    
    // Получаем информацию о сохранении
    setSaveInfo(getSaveInfo());
  }, []);

  // Автосохранение каждые 30 секунд
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      saveGame(gameState, greenhouse, inventory);
      setSaveInfo(getSaveInfo());
      console.log('💾 Автосохранение выполнено');
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [gameState, greenhouse, inventory]);

  // Ручное сохранение
  const handleManualSave = () => {
    setSaveStatus('Сохранение...');
    const success = saveGame(gameState, greenhouse, inventory);
    if (success) {
      setSaveInfo(getSaveInfo());
      setSaveStatus('✅ Сохранено!');
      setTimeout(() => setSaveStatus(''), 2000);
    } else {
      setSaveStatus('❌ Ошибка!');
      setTimeout(() => setSaveStatus(''), 2000);
    }
  };

  // Сброс игры
  const handleNewGame = () => {
    if (window.confirm('⚠️ Вы уверены? Весь прогресс будет потерян!')) {
      deleteSave();
      // Сброс к начальным значениям
      setGameState({
        money: 10000, // Обновленный стартовый капитал
        level: 1,
        experience: 0,
        day: 1
      });
      
      setGreenhouse({
        plots: Array(6).fill(null).map((_, i) => ({
          id: i,
          plant: null,
          conditions: { water: 50, light: 30, temp: 60, nutrients: 40, health: 100 },
          equipment: {
            pot: null,
            light: null,
            drainage: null,
            reflector: null,
            ventilation: null,
            monitoring: null
          },
          diseases: []
        })),
        globalEquipment: {
          led_system: false,
          auto_watering: false,
          climate_control: false,
          carbon_filter: false,
          monitoring_hub: false,
          ventilation_system: false,
          security_system: false,
          backup_power: false
        }
      });
      
      setInventory({
        seeds: { thai_stick: 3, northern_lights: 0, sour_diesel: 0 },
        harvest: { 
          thai_stick: { A: 0, B: 0, C: 0, D: 0 }, 
          northern_lights: { A: 0, B: 0, C: 0, D: 0 }, 
          sour_diesel: { A: 0, B: 0, C: 0, D: 0 } 
        },
        individualEquipment: {},
        globalEquipment: {},
        fertilizer: 0,
        medicines: {
          fungicide: 0,
          insecticide: 0,
          root_stimulator: 0
        }
      });
      
      setSaveInfo(null);
      alert('🎮 Новая игра начата!');
    }
  };

  // Симуляция времени с реалистичным потреблением ресурсов
  useEffect(() => {
    const gameTimer = setInterval(() => {
      setGameState(prev => ({ ...prev, day: prev.day + 1 }));
      
      setGreenhouse(prev => ({
        ...prev,
        plots: prev.plots.map(plot => {
          if (!plot.plant) return plot;

          const strain = STRAINS[plot.plant.strain];
          const phase = plot.plant.phase;
          const globalEquip = prev.globalEquipment;
          
          // Базовое потребление по фазам (% за 10 секунд)
          const consumptionRates = {
            seed: { water: 1, nutrients: 0.5 },
            sprout: { water: 2, nutrients: 1 },
            veg: { water: 4, nutrients: 3 },
            flower: { water: 3, nutrients: 2.5 },
            harvest: { water: 1, nutrients: 0 }
          };

          let waterConsumption = consumptionRates[phase]?.water || 1;
          let nutrientConsumption = consumptionRates[phase]?.nutrients || 1;

          // Модификаторы потребления
          // Температура влияет на потребление воды
          if (plot.conditions.temp > 80) {
            waterConsumption *= 1.5; // +50% при высокой температуре
          }

          // Размер горшка влияет на потребление
          if (plot.equipment.pot === 'pot_10l' || plot.equipment.pot === 'pot_smart_20l') {
            waterConsumption *= 0.8; // Большие горшки удерживают влагу лучше
          }

          // Вентиляция ускоряет испарение
          if (plot.equipment.ventilation || globalEquip.ventilation_system) {
            waterConsumption *= 1.3;
          }

          // Автополив компенсирует потребление
          if (globalEquip.auto_watering && plot.plant) {
            const idealWater = GROWTH_PHASES[phase]?.idealConditions?.water;
            if (idealWater) {
              const targetWater = (idealWater[0] + idealWater[1]) / 2;
              if (plot.conditions.water < targetWater) {
                waterConsumption = -2; // Автополив добавляет воду
              } else {
                waterConsumption *= 0.2; // Снижает естественное испарение
              }
            }
          }

          // Умный климат-контроль стабилизирует температуру
          let tempChange = Math.random() * 2 - 1; // Случайное изменение ±1%
          if (globalEquip.climate_control && plot.plant) {
            const idealTemp = GROWTH_PHASES[phase]?.idealConditions?.temp;
            if (idealTemp) {
              const targetTemp = (idealTemp[0] + idealTemp[1]) / 2;
              tempChange = (targetTemp - plot.conditions.temp) * 0.1; // Плавное приближение к цели
            }
          }

          // Умная LED система оптимизирует освещение
          let lightLevel = plot.conditions.light;
          if (globalEquip.led_system && plot.plant) {
            const idealLight = GROWTH_PHASES[phase]?.idealConditions?.light;
            if (idealLight) {
              lightLevel = (idealLight[0] + idealLight[1]) / 2;
            }
          } else if (plot.equipment.light) {
            const lightPower = INDIVIDUAL_EQUIPMENT[plot.equipment.light]?.effect || 30;
            lightLevel = lightPower;
            if (plot.equipment.reflector) {
              lightLevel *= 1.3;
            }
          } else {
            lightLevel = Math.max(20, lightLevel - Math.random() * 2); // Естественное затухание без ламп
          }

          // Применяем изменения условий
          const newConditions = {
            water: Math.max(0, Math.min(100, plot.conditions.water - waterConsumption)),
            light: Math.max(0, Math.min(100, lightLevel)),
            temp: Math.max(0, Math.min(100, plot.conditions.temp + tempChange)),
            nutrients: Math.max(0, plot.conditions.nutrients - nutrientConsumption),
            health: plot.conditions.health
          };

          // Расчет влияния условий на здоровье
          const idealConditions = GROWTH_PHASES[phase]?.idealConditions;
          let healthChange = 0;

          if (idealConditions) {
            // Проверяем каждый параметр
            const waterOK = newConditions.water >= idealConditions.water[0] && newConditions.water <= idealConditions.water[1];
            const lightOK = newConditions.light >= idealConditions.light[0] && newConditions.light <= idealConditions.light[1];
            const tempOK = newConditions.temp >= idealConditions.temp[0] && newConditions.temp <= idealConditions.temp[1];
            const nutrientsOK = newConditions.nutrients >= idealConditions.nutrients[0] && newConditions.nutrients <= idealConditions.nutrients[1];

            // Здоровье изменяется в зависимости от соблюдения условий
            const optimalCount = [waterOK, lightOK, tempOK, nutrientsOK].filter(Boolean).length;
            
            if (optimalCount === 4) {
              healthChange = 0.1; // Идеальные условия - здоровье растет
            } else if (optimalCount >= 2) {
              healthChange = 0; // Нормальные условия - стабильно
            } else {
              healthChange = -0.5 - (4 - optimalCount) * 0.3; // Плохие условия - теряет здоровье
            }

            // Критические состояния
            if (newConditions.water < 20) healthChange -= 2; // Засуха
            if (newConditions.water > 90) healthChange -= 1; // Переувлажнение
            if (newConditions.nutrients > 95) healthChange -= 3; // Ожог питательными веществами
            if (newConditions.temp > 90) healthChange -= 2; // Тепловой стресс
          }

          // Бонусы от оборудования
          if (plot.equipment.drainage && newConditions.water > 85) {
            healthChange += 0.5; // Дренаж помогает при переувлажнении
          }
          if (plot.equipment.ventilation) {
            healthChange += 0.2; // Вентиляция улучшает общее состояние
          }
          if (globalEquip.monitoring_hub) {
            healthChange += 0.3; // Мониторинг предотвращает проблемы
          }
          if (globalEquip.backup_power) {
            healthChange += 0.2; // Стабильное питание
          }

          // Прогрессия фаз роста
          const now = Date.now();
          let newPlant = { ...plot.plant };
          
          if (now - plot.plant.plantedAt > plot.plant.currentPhaseDuration) {
            const phases = Object.keys(GROWTH_PHASES);
            const currentIndex = phases.indexOf(plot.plant.phase);
            if (currentIndex < phases.length - 1) {
              newPlant.phase = phases[currentIndex + 1];
              newPlant.currentPhaseDuration += strain.growTimes[currentIndex + 1] || GROWTH_PHASES[phases[currentIndex + 1]].duration;
            }
          }

          // Применяем изменение здоровья
          newConditions.health = Math.max(0, Math.min(100, newConditions.health + healthChange));

          return {
            ...plot,
            plant: newPlant,
            conditions: newConditions
          };
        })
      }));
    }, 10000); // Каждые 10 секунд = 1 игровой день

    return () => clearInterval(gameTimer);
  }, []);

  // Функции игры
  const plantSeed = (plotId, strain) => {
    if (inventory.seeds[strain] <= 0) return;
    
    const plot = greenhouse.plots[plotId];
    if (!plot.equipment.pot) {
      alert('Нужен горшок для посадки!');
      return;
    }
    
    setInventory(prev => ({
      ...prev,
      seeds: { ...prev.seeds, [strain]: prev.seeds[strain] - 1 }
    }));
    
    setGreenhouse(prev => ({
      ...prev,
      plots: prev.plots.map(plot => 
        plot.id === plotId ? {
          ...plot,
          plant: {
            strain,
            phase: 'seed',
            plantedAt: Date.now(),
            currentPhaseDuration: STRAINS[strain].growTimes[0],
            stressHistory: []
          }
        } : plot
      )
    }));
  };

  const harvestPlant = (plotId) => {
    const plot = greenhouse.plots[plotId];
    if (!plot.plant || plot.plant.phase !== 'harvest') return;
    
    const strain = plot.plant.strain;
    const baseYield = STRAINS[strain].baseYield;
    
    const quality = calculatePlantQuality(plot.conditions, plot.equipment, plot.plant.phase);
    const yieldMultiplier = calculateYieldMultiplier(plot.conditions, plot.equipment);
    const finalYield = Math.floor(baseYield * yieldMultiplier);
    
    setInventory(prev => ({
      ...prev,
      harvest: { 
        ...prev.harvest, 
        [strain]: {
          ...prev.harvest[strain],
          [quality]: prev.harvest[strain][quality] + finalYield
        }
      }
    }));
    
    const experienceGain = 50 + (quality === 'A' ? 50 : quality === 'B' ? 25 : 0);
    setGameState(prev => ({
      ...prev,
      experience: prev.experience + experienceGain
    }));

    // Обновляем статистику
    setGameStats(prev => ({
      ...prev,
      totalHarvests: prev.totalHarvests + 1
    }));
    
    alert(`Урожай собран!\nКоличество: ${finalYield}г\nКачество: ${QUALITY_GRADES[quality].name}\nМодификатор цены: ${Math.floor(QUALITY_GRADES[quality].multiplier * 100)}%`);
    
    setGreenhouse(prev => ({
      ...prev,
      plots: prev.plots.map(plot => 
        plot.id === plotId ? {
          ...plot,
          plant: null,
          conditions: { water: 50, light: 30, temp: 60, nutrients: 40, health: 100 },
          diseases: []
        } : plot
      )
    }));
  };

  const waterPlant = (plotId) => {
    const plot = greenhouse.plots[plotId];
    
    // Нельзя поливать если уже слишком влажно
    if (plot.conditions.water > 75) {
      alert('⚠️ Почва еще влажная! Переувлажнение может привести к корневой гнили.');
      return;
    }
    
    // Количество воды зависит от размера горшка
    let waterAmount = 20; // Базовое количество
    
    if (plot.equipment.pot === 'pot_5l') waterAmount = 25;
    else if (plot.equipment.pot === 'pot_10l') waterAmount = 35;
    else if (plot.equipment.pot === 'pot_smart_20l') waterAmount = 40;
    
    setGreenhouse(prev => ({
      ...prev,
      plots: prev.plots.map(plot => 
        plot.id === plotId ? {
          ...plot,
          conditions: {
            ...plot.conditions,
            water: Math.min(100, plot.conditions.water + waterAmount)
          }
        } : plot
      )
    }));
  };

  const addNutrients = (plotId) => {
    if (inventory.fertilizer <= 0) {
      alert('⚠️ Нет удобрений! Купите в магазине.');
      return;
    }
    
    const plot = greenhouse.plots[plotId];
    
    // Нельзя перекармливать
    if (plot.conditions.nutrients > 85) {
      alert('⚠️ Растение уже получило достаточно питательных веществ! Перекорм может вызвать ожог.');
      return;
    }
    
    setInventory(prev => ({
      ...prev,
      fertilizer: prev.fertilizer - 1
    }));
    
    setGreenhouse(prev => ({
      ...prev,
      plots: prev.plots.map(plot => 
        plot.id === plotId ? {
          ...plot,
          conditions: {
            ...plot.conditions,
            nutrients: Math.min(100, plot.conditions.nutrients + 30)
          }
        } : plot
      )
    }));
  };

  // Новая функция: промывка корней при передозировке
  const flushRoots = (plotId) => {
    const plot = greenhouse.plots[plotId];
    
    if (plot.conditions.nutrients < 70) {
      alert('ℹ️ Промывка не нужна - уровень питательных веществ нормальный.');
      return;
    }
    
    setGreenhouse(prev => ({
      ...prev,
      plots: prev.plots.map(plot => 
        plot.id === plotId ? {
          ...plot,
          conditions: {
            ...plot.conditions,
            nutrients: 20, // Сбрасываем до минимума
            water: Math.min(100, plot.conditions.water + 15) // Добавляем немного воды
          }
        } : plot
      )
    }));
    
    alert('💧 Корни промыты! Питательные вещества сброшены до безопасного уровня.');
  };

  // Функция использования лекарств
  const useMedicine = (plotId, medicineType) => {
    if (!inventory.medicines[medicineType] || inventory.medicines[medicineType] <= 0) {
      alert('⚠️ Нет нужного лекарства! Купите в магазине.');
      return;
    }
    
    setInventory(prev => ({
      ...prev,
      medicines: {
        ...prev.medicines,
        [medicineType]: prev.medicines[medicineType] - 1
      }
    }));
    
    const plot = greenhouse.plots[plotId];
    
    // Эффекты лекарств
    let healthBonus = 0;
    let message = '';
    
    switch(medicineType) {
      case 'fungicide':
        healthBonus = 15;
        message = '🍄 Фунгицид применен! Грибковые заболевания вылечены.';
        break;
      case 'insecticide':
        healthBonus = 10;
        message = '🐛 Инсектицид применен! Вредители уничтожены.';
        break;
      case 'root_stimulator':
        healthBonus = 20;
        message = '🌱 Стимулятор корней применен! Растение восстанавливается.';
        break;
    }
    
    setGreenhouse(prev => ({
      ...prev,
      plots: prev.plots.map(plot => 
        plot.id === plotId ? {
          ...plot,
          conditions: {
            ...plot.conditions,
            health: Math.min(100, plot.conditions.health + healthBonus)
          }
        } : plot
      )
    }));
    
    alert(message);
  };

  const buySeeds = (strain) => {
    const price = STRAINS[strain].seedPrice;
    if (gameState.money < price) return;
    
    setGameState(prev => ({ ...prev, money: prev.money - price }));
    setInventory(prev => ({
      ...prev,
      seeds: { ...prev.seeds, [strain]: prev.seeds[strain] + 1 }
    }));
  };

  const buyItem = (itemKey, isGlobal = false) => {
    const item = isGlobal ? GLOBAL_EQUIPMENT[itemKey] : INDIVIDUAL_EQUIPMENT[itemKey];
    if (!item) return;
    
    const price = item.price;
    if (gameState.money < price) return;
    
    setGameState(prev => ({ ...prev, money: prev.money - price }));
    
    if (item.consumable) {
      // Обработка расходников
      if (item.type === 'nutrients') {
        setInventory(prev => ({
          ...prev,
          fertilizer: prev.fertilizer + 1
        }));
      } else if (item.type === 'medicine') {
        setInventory(prev => ({
          ...prev,
          medicines: { 
            ...prev.medicines, 
            [itemKey]: (prev.medicines[itemKey] || 0) + 1 
          }
        }));
      }
    } else if (isGlobal) {
      setInventory(prev => ({
        ...prev,
        globalEquipment: { ...prev.globalEquipment, [itemKey]: (prev.globalEquipment[itemKey] || 0) + 1 }
      }));
      
      // Активируем глобальное оборудование
      const globalItems = ['led_system', 'auto_watering', 'climate_control', 'carbon_filter', 'monitoring_hub', 'ventilation_system', 'security_system', 'backup_power'];
      if (globalItems.includes(itemKey)) {
        setGreenhouse(prev => ({
          ...prev,
          globalEquipment: { ...prev.globalEquipment, [itemKey]: true }
        }));
      }
    } else {
      setInventory(prev => ({
        ...prev,
        individualEquipment: { ...prev.individualEquipment, [itemKey]: (prev.individualEquipment[itemKey] || 0) + 1 }
      }));
    }
  };

  const equipItem = (plotId, itemKey) => {
    const item = INDIVIDUAL_EQUIPMENT[itemKey];
    const currentCount = inventory.individualEquipment[itemKey] || 0;
    
    if (!item || currentCount <= 0) return;
    
    setInventory(prev => ({
      ...prev,
      individualEquipment: { 
        ...prev.individualEquipment, 
        [itemKey]: currentCount - 1 
      }
    }));
    
    setGreenhouse(prev => ({
      ...prev,
      plots: prev.plots.map(plot => 
        plot.id === plotId ? {
          ...plot,
          equipment: { ...plot.equipment, [item.type]: itemKey }
        } : plot
      )
    }));
  };

  const sellHarvest = (strain, quality, amount, isBlackMarket = false) => {
    if (inventory.harvest[strain][quality] < amount) return;
    
    const basePrice = STRAINS[strain].price;
    const qualityMultiplier = QUALITY_GRADES[quality].multiplier;
    const marketMultiplier = isBlackMarket ? 1.5 + Math.random() * 0.5 : 1;
    
    const riskFactor = calculateRaidRisk(greenhouse.globalEquipment, isBlackMarket);
    
    if (riskFactor) {
      setInventory(prev => ({
        ...prev,
        harvest: { 
          ...prev.harvest, 
          [strain]: {
            ...prev.harvest[strain],
            [quality]: prev.harvest[strain][quality] - amount
          }
        }
      }));
      alert('Рейд! Товар конфискован!');
      return;
    }
    
    const totalPrice = Math.floor(basePrice * qualityMultiplier * amount * marketMultiplier);
    
    setInventory(prev => ({
      ...prev,
      harvest: { 
        ...prev.harvest, 
        [strain]: {
          ...prev.harvest[strain],
          [quality]: prev.harvest[strain][quality] - amount
        }
      }
    }));
    
    setGameState(prev => ({
      ...prev,
      money: prev.money + totalPrice,
      experience: prev.experience + amount * 10
    }));
  };

  // Компоненты UI
  const PlotComponent = ({ plot, onSelect }) => {
    const getPlotColor = () => {
      if (!plot.plant) return 'bg-gray-300';
      const avgCondition = (plot.conditions.water + plot.conditions.light + plot.conditions.temp + plot.conditions.nutrients) / 4;
      if (avgCondition < 30) return 'bg-red-200';
      if (avgCondition > 70) return 'bg-green-200';
      return 'bg-yellow-200';
    };

    const getEquipmentIcons = () => {
      const icons = [];
      if (plot.equipment.pot) icons.push('📦');
      if (plot.equipment.light) icons.push('💡');
      if (plot.equipment.drainage) icons.push('🚰');
      if (plot.equipment.reflector) icons.push('🪞');
      if (plot.equipment.ventilation) icons.push('🌪️');
      if (plot.equipment.monitoring) icons.push('📊');
      return icons;
    };

    return (
      <div 
        className={`w-28 h-28 rounded-lg border-2 border-gray-400 ${getPlotColor()} cursor-pointer flex flex-col items-center justify-center text-xs relative`}
        onClick={() => onSelect(plot.id)}
      >
        {plot.plant ? (
          <React.Fragment>
            <div className="text-2xl">{GROWTH_PHASES[plot.plant.phase].icon}</div>
            <div className="font-medium">{STRAINS[plot.plant.strain].name.split(' ')[0]}</div>
            <div>❤️{Math.floor(plot.conditions.health)}%</div>
            
            {/* Индикаторы проблем */}
            {getStatusIndicators().length > 0 && (
              <div className="absolute top-1 right-1 flex">
                {getStatusIndicators().map((indicator, index) => (
                  <span key={index} className="text-xs">{indicator}</span>
                ))}
              </div>
            )}
          </React.Fragment>
        ) : (
          <div className="text-gray-500 text-center">
            {plot.equipment.pot ? (
              <div>
                <div className="text-green-600 font-medium">📦 Готов</div>
                <div className="text-xs">к посадке</div>
              </div>
            ) : (
              <div>
                <div className="text-red-600 font-medium">Пусто</div>
                <div className="text-xs">нужен горшок</div>
              </div>
            )}
          </div>
        )}
        
        {/* Индикаторы оборудования */}
        <div className="absolute bottom-1 right-1 flex flex-wrap gap-1">
          {getEquipmentIcons().map((icon, index) => (
            <span key={index} className="text-xs">{icon}</span>
          ))}
        </div>
      </div>
    );
  };

  // Функции рендеринга
  const renderSeedButtons = () => {
    const availableSeeds = Object.entries(inventory.seeds).filter(([strain, count]) => count > 0);
    return availableSeeds.map(([strain, count]) => (
      <button
        key={strain}
        onClick={() => plantSeed(selectedPlot, strain)}
        className="w-full bg-green-500 text-white px-3 py-1 rounded text-sm mb-1"
      >
        🌱 {STRAINS[strain].name} ({count})
      </button>
    ));
  };

  const renderEquipmentButtons = () => {
    const availableEquipment = Object.entries(inventory.individualEquipment).filter(([item, count]) => count > 0);
    return availableEquipment.map(([itemKey, count]) => (
      <button
        key={itemKey}
        onClick={() => equipItem(selectedPlot, itemKey)}
        className="w-full bg-blue-500 text-white px-2 py-1 rounded text-xs mb-1"
      >
        {INDIVIDUAL_EQUIPMENT[itemKey].name} ({count})
      </button>
    ));
  };

  const renderLegalMarket = () => {
    const allHarvest = [];
    Object.entries(inventory.harvest).forEach(([strain, qualities]) => {
      Object.entries(qualities).forEach(([quality, amount]) => {
        if (amount > 0) {
          allHarvest.push({ strain, quality, amount });
        }
      });
    });

    return allHarvest.map(({ strain, quality, amount }) => (
      <div key={`${strain}-${quality}`} className="border-b pb-2 mb-2">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <span>{STRAINS[strain].name}</span>
              <span className={`text-xs font-bold ${QUALITY_GRADES[quality].color}`}>
                {QUALITY_GRADES[quality].name}
              </span>
            </div>
            <div className="text-sm">Есть: {amount}г</div>
            <div className="text-sm">
              Цена: ฿{Math.floor(STRAINS[strain].price * QUALITY_GRADES[quality].multiplier)}/г
            </div>
          </div>
          <button
            onClick={() => sellHarvest(strain, quality, Math.min(amount, 10), false)}
            disabled={amount === 0}
            className="bg-green-500 text-white px-3 py-1 rounded text-sm disabled:bg-gray-300"
          >
            Продать 10г
          </button>
        </div>
      </div>
    ));
  };

  const renderBlackMarket = () => {
    const allHarvest = [];
    Object.entries(inventory.harvest).forEach(([strain, qualities]) => {
      Object.entries(qualities).forEach(([quality, amount]) => {
        if (amount > 0) {
          allHarvest.push({ strain, quality, amount });
        }
      });
    });

    return allHarvest.map(({ strain, quality, amount }) => (
      <div key={`${strain}-${quality}`} className="border-b pb-2 mb-2">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <span>{STRAINS[strain].name}</span>
              <span className={`text-xs font-bold ${QUALITY_GRADES[quality].color}`}>
                {QUALITY_GRADES[quality].name}
              </span>
            </div>
            <div className="text-sm">Есть: {amount}г</div>
            <div className="text-sm">
              Цена: ฿{Math.floor(STRAINS[strain].price * QUALITY_GRADES[quality].multiplier * 1.5)}-{Math.floor(STRAINS[strain].price * QUALITY_GRADES[quality].multiplier * 2)}/г
            </div>
          </div>
          <button
            onClick={() => sellHarvest(strain, quality, Math.min(amount, 10), true)}
            disabled={amount === 0}
            className="bg-red-500 text-white px-3 py-1 rounded text-sm disabled:bg-gray-300"
          >
            Продать 10г ⚠️
          </button>
        </div>
      </div>
    ));
  };

  return (
    <div className="max-w-6xl mx-auto p-4 bg-green-50 min-h-screen">
      {/* Заголовок */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-green-800 mb-2">🌿 Cannabis Simulator Thailand 🇹🇭</h1>
        <div className="flex justify-center space-x-6 text-sm">
          <span>💰 Деньги: ฿{gameState.money.toLocaleString()}</span>
          <span>📅 День: {gameState.day}</span>
          <span>⭐ Уровень: {gameState.level}</span>
          <span>🎯 Опыт: {gameState.experience}</span>
        </div>
        
        {/* Кнопки сохранения */}
        <div className="flex justify-center gap-2 mt-4 relative">
          <button
            onClick={handleManualSave}
            className="bg-blue-500 text-white px-4 py-2 rounded text-sm hover:bg-blue-600"
          >
            💾 Сохранить
          </button>
          <button
            onClick={() => setShowSaveMenu(!showSaveMenu)}
            className="bg-gray-500 text-white px-4 py-2 rounded text-sm hover:bg-gray-600"
          >
            ⚙️ Игра
          </button>
          {saveStatus && (
            <div className="absolute top-12 bg-white border rounded px-3 py-1 shadow-lg text-sm z-10">
              {saveStatus}
            </div>
          )}
        </div>

        {/* Меню сохранения */}
        {showSaveMenu && (
          <div className="mt-4 bg-white border rounded-lg p-4 shadow-lg max-w-md mx-auto">
            <h3 className="font-bold mb-3">⚙️ Управление игрой</h3>
            
            {saveInfo && (
              <div className="bg-green-50 p-3 rounded mb-3 text-sm">
                <div className="font-medium">💾 Последнее сохранение:</div>
                <div>📅 День: {saveInfo.day}</div>
                <div>💰 Деньги: ฿{saveInfo.money}</div>
                <div>📊 Уровень: {saveInfo.level}</div>
                <div className="text-xs text-gray-600 mt-1">
                  {new Date(saveInfo.timestamp).toLocaleString('ru-RU')}
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <button
                onClick={handleManualSave}
                className="w-full bg-blue-500 text-white px-4 py-2 rounded text-sm hover:bg-blue-600"
              >
                💾 Сохранить сейчас
              </button>
              
              <button
                onClick={handleNewGame}
                className="w-full bg-red-500 text-white px-4 py-2 rounded text-sm hover:bg-red-600"
              >
                🔄 Новая игра
              </button>
              
              <button
                onClick={() => setShowSaveMenu(false)}
                className="w-full bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-400"
              >
                ❌ Закрыть
              </button>
            </div>
            
            <div className="mt-3 text-xs text-gray-600 bg-gray-50 p-2 rounded">
              ℹ️ Автосохранение каждые 30 секунд
            </div>
          </div>
        )}
      </div>

      {/* Навигация */}
      <div className="flex justify-center mb-6">
        <div className="bg-white rounded-lg p-1 shadow-md">
          {[
            { id: 'greenhouse', name: 'Теплица', icon: '🏠' },
            { id: 'shop', name: 'Магазин', icon: '🛒' },
            { id: 'inventory', name: 'Инвентарь', icon: '🎒' },
            { id: 'market', name: 'Рынок', icon: '💰' },
            { id: 'education', name: 'Учебник', icon: '📚' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-md mr-1 ${activeTab === tab.id ? 'bg-green-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              {tab.icon} {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Основной контент - Теплица */}
      {activeTab === 'greenhouse' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">🏠 Теплица</h2>
              
              {/* Глобальные системы статус */}
              <div className="bg-white rounded-lg p-4 shadow-md border">
                <div className="text-sm font-bold mb-3 text-center">🌐 Глобальные системы</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={`flex items-center gap-2 p-2 rounded ${greenhouse.globalEquipment.led_system ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                    <span>💡</span>
                    <div>
                      <div className="font-medium">LED система</div>
                      <div className="text-xs">{greenhouse.globalEquipment.led_system ? 'Активна' : 'Отключена'}</div>
                    </div>
                  </div>
                  
                  <div className={`flex items-center gap-2 p-2 rounded ${greenhouse.globalEquipment.auto_watering ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-500'}`}>
                    <span>🚿</span>
                    <div>
                      <div className="font-medium">Автополив</div>
                      <div className="text-xs">{greenhouse.globalEquipment.auto_watering ? 'Активен' : 'Отключен'}</div>
                    </div>
                  </div>
                  
                  <div className={`flex items-center gap-2 p-2 rounded ${greenhouse.globalEquipment.climate_control ? 'bg-orange-50 text-orange-700' : 'bg-gray-50 text-gray-500'}`}>
                    <span>🌡️</span>
                    <div>
                      <div className="font-medium">Климат</div>
                      <div className="text-xs">{greenhouse.globalEquipment.climate_control ? 'Активен' : 'Отключен'}</div>
                    </div>
                  </div>
                  
                  <div className={`flex items-center gap-2 p-2 rounded ${greenhouse.globalEquipment.carbon_filter ? 'bg-purple-50 text-purple-700' : 'bg-gray-50 text-gray-500'}`}>
                    <span>🔰</span>
                    <div>
                      <div className="font-medium">Фильтр</div>
                      <div className="text-xs">{greenhouse.globalEquipment.carbon_filter ? 'Активен' : 'Отключен'}</div>
                    </div>
                  </div>
                  
                  <div className={`flex items-center gap-2 p-2 rounded ${greenhouse.globalEquipment.monitoring_hub ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-50 text-gray-500'}`}>
                    <span>📊</span>
                    <div>
                      <div className="font-medium">Мониторинг</div>
                      <div className="text-xs">{greenhouse.globalEquipment.monitoring_hub ? 'Активен' : 'Отключен'}</div>
                    </div>
                  </div>
                  
                  <div className={`flex items-center gap-2 p-2 rounded ${greenhouse.globalEquipment.ventilation_system ? 'bg-cyan-50 text-cyan-700' : 'bg-gray-50 text-gray-500'}`}>
                    <span>🌪️</span>
                    <div>
                      <div className="font-medium">Вентиляция</div>
                      <div className="text-xs">{greenhouse.globalEquipment.ventilation_system ? 'Активна' : 'Отключена'}</div>
                    </div>
                  </div>
                  
                  <div className={`flex items-center gap-2 p-2 rounded ${greenhouse.globalEquipment.security_system ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-500'}`}>
                    <span>🔒</span>
                    <div>
                      <div className="font-medium">Безопасность</div>
                      <div className="text-xs">{greenhouse.globalEquipment.security_system ? 'Активна' : 'Отключена'}</div>
                    </div>
                  </div>
                  
                  <div className={`flex items-center gap-2 p-2 rounded ${greenhouse.globalEquipment.backup_power ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-50 text-gray-500'}`}>
                    <span>⚡</span>
                    <div>
                      <div className="font-medium">Резерв</div>
                      <div className="text-xs">{greenhouse.globalEquipment.backup_power ? 'Активен' : 'Отключен'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 mb-6">
              {greenhouse.plots.map(plot => (
                <PlotComponent key={plot.id} plot={plot} onSelect={setSelectedPlot} />
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-md">
            <h3 className="font-bold mb-4">🎮 Управление</h3>
            {selectedPlot !== null && (
              <div>
                <h4 className="font-semibold mb-2">Грядка #{selectedPlot + 1}</h4>
                
                {/* Детальный статус оборудования */}
                <div className="bg-gray-50 p-3 rounded mb-3">
                  <div className="text-xs font-semibold mb-2">🔧 Установленное оборудование:</div>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div className={greenhouse.plots[selectedPlot].equipment.pot ? 'text-green-600' : 'text-red-500'}>
                      📦 Горшок: {greenhouse.plots[selectedPlot].equipment.pot ? 
                        INDIVIDUAL_EQUIPMENT[greenhouse.plots[selectedPlot].equipment.pot]?.name : 'НЕТ'}
                    </div>
                    <div className={greenhouse.plots[selectedPlot].equipment.light ? 'text-green-600' : 'text-gray-400'}>
                      💡 Свет: {greenhouse.plots[selectedPlot].equipment.light ? 
                        INDIVIDUAL_EQUIPMENT[greenhouse.plots[selectedPlot].equipment.light]?.name : 'НЕТ'}
                    </div>
                    <div className={greenhouse.plots[selectedPlot].equipment.drainage ? 'text-green-600' : 'text-gray-400'}>
                      🚰 Дренаж: {greenhouse.plots[selectedPlot].equipment.drainage ? 'ДА' : 'НЕТ'}
                    </div>
                    <div className={greenhouse.plots[selectedPlot].equipment.reflector ? 'text-green-600' : 'text-gray-400'}>
                      🪞 Рефлектор: {greenhouse.plots[selectedPlot].equipment.reflector ? 'ДА' : 'НЕТ'}
                    </div>
                    <div className={greenhouse.plots[selectedPlot].equipment.ventilation ? 'text-green-600' : 'text-gray-400'}>
                      🌪️ Вентиляция: {greenhouse.plots[selectedPlot].equipment.ventilation ? 'ДА' : 'НЕТ'}
                    </div>
                    <div className={greenhouse.plots[selectedPlot].equipment.monitoring ? 'text-green-600' : 'text-gray-400'}>
                      📊 pH метр: {greenhouse.plots[selectedPlot].equipment.monitoring ? 'ДА' : 'НЕТ'}
                    </div>
                  </div>
                </div>

                {greenhouse.plots[selectedPlot].plant ? (
                  <div className="space-y-2">
                    <div className="bg-blue-50 p-3 rounded">
                      <div className="font-semibold">Сорт: {STRAINS[greenhouse.plots[selectedPlot].plant.strain].name}</div>
                      <div className="text-sm text-gray-600">{STRAINS[greenhouse.plots[selectedPlot].plant.strain].genetics}</div>
                      <div className="text-sm">THC: {STRAINS[greenhouse.plots[selectedPlot].plant.strain].thc}</div>
                    </div>
                    
                    <div className="bg-green-50 p-3 rounded">
                      <div className="font-semibold">Фаза: {GROWTH_PHASES[greenhouse.plots[selectedPlot].plant.phase].name}</div>
                      <div className="text-xs text-gray-700 mt-1">
                        {GROWTH_PHASES[greenhouse.plots[selectedPlot].plant.phase].description}
                      </div>
                      
                      {/* Показываем идеальные условия для текущей фазы */}
                      <div className="mt-2 p-2 bg-blue-100 rounded text-xs">
                        <div className="font-semibold mb-1">🎯 Идеальные условия:</div>
                        <div className="grid grid-cols-2 gap-1">
                          <div>💧 {GROWTH_PHASES[greenhouse.plots[selectedPlot].plant.phase].idealConditions.water[0]}-{GROWTH_PHASES[greenhouse.plots[selectedPlot].plant.phase].idealConditions.water[1]}%</div>
                          <div>☀️ {GROWTH_PHASES[greenhouse.plots[selectedPlot].plant.phase].idealConditions.light[0]}-{GROWTH_PHASES[greenhouse.plots[selectedPlot].plant.phase].idealConditions.light[1]}%</div>
                          <div>🌡️ {GROWTH_PHASES[greenhouse.plots[selectedPlot].plant.phase].idealConditions.temp[0]}-{GROWTH_PHASES[greenhouse.plots[selectedPlot].plant.phase].idealConditions.temp[1]}%</div>
                          <div>🧪 {GROWTH_PHASES[greenhouse.plots[selectedPlot].plant.phase].idealConditions.nutrients[0]}-{GROWTH_PHASES[greenhouse.plots[selectedPlot].plant.phase].idealConditions.nutrients[1]}%</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-xs space-y-1 bg-gray-50 p-2 rounded">
                      <div className="font-semibold">📊 Текущие параметры:</div>
                      <div className="grid grid-cols-2 gap-1">
                        <div className={`${greenhouse.plots[selectedPlot].conditions.water >= GROWTH_PHASES[greenhouse.plots[selectedPlot].plant.phase].idealConditions.water[0] && 
                          greenhouse.plots[selectedPlot].conditions.water <= GROWTH_PHASES[greenhouse.plots[selectedPlot].plant.phase].idealConditions.water[1] ? 
                          'text-green-600' : 'text-red-600'}`}>
                          💧 {Math.floor(greenhouse.plots[selectedPlot].conditions.water)}%
                          {greenhouse.plots[selectedPlot].conditions.water < 30 && <span className="ml-1">📉</span>}
                          {greenhouse.plots[selectedPlot].conditions.water > 85 && <span className="ml-1">📈</span>}
                        </div>
                        <div className={`${greenhouse.plots[selectedPlot].conditions.light >= GROWTH_PHASES[greenhouse.plots[selectedPlot].plant.phase].idealConditions.light[0] && 
                          greenhouse.plots[selectedPlot].conditions.light <= GROWTH_PHASES[greenhouse.plots[selectedPlot].plant.phase].idealConditions.light[1] ? 
                          'text-green-600' : 'text-red-600'}`}>
                          ☀️ {Math.floor(greenhouse.plots[selectedPlot].conditions.light)}%
                        </div>
                        <div className={`${greenhouse.plots[selectedPlot].conditions.temp >= GROWTH_PHASES[greenhouse.plots[selectedPlot].plant.phase].idealConditions.temp[0] && 
                          greenhouse.plots[selectedPlot].conditions.temp <= GROWTH_PHASES[greenhouse.plots[selectedPlot].plant.phase].idealConditions.temp[1] ? 
                          'text-green-600' : 'text-red-600'}`}>
                          🌡️ {Math.floor(greenhouse.plots[selectedPlot].conditions.temp)}%
                          {greenhouse.plots[selectedPlot].conditions.temp > 85 && <span className="ml-1">🔥</span>}
                        </div>
                        <div className={`${greenhouse.plots[selectedPlot].conditions.nutrients >= GROWTH_PHASES[greenhouse.plots[selectedPlot].plant.phase].idealConditions.nutrients[0] && 
                          greenhouse.plots[selectedPlot].conditions.nutrients <= GROWTH_PHASES[greenhouse.plots[selectedPlot].plant.phase].idealConditions.nutrients[1] ? 
                          'text-green-600' : 'text-red-600'}`}>
                          🧪 {Math.floor(greenhouse.plots[selectedPlot].conditions.nutrients)}%
                          {greenhouse.plots[selectedPlot].conditions.nutrients < 15 && <span className="ml-1">📉</span>}
                          {greenhouse.plots[selectedPlot].conditions.nutrients > 90 && <span className="ml-1 text-red-600">⚠️</span>}
                        </div>
                      </div>
                      <div className="mt-1 flex items-center">
                        <span>❤️ Здоровье: {Math.floor(greenhouse.plots[selectedPlot].conditions.health)}%</span>
                        {greenhouse.plots[selectedPlot].conditions.health < 50 && <span className="ml-2 text-red-600 animate-pulse">🚨</span>}
                        {greenhouse.plots[selectedPlot].conditions.health < 30 && <span className="ml-1 text-red-600">💀</span>}
                      </div>

                      {/* Потребление ресурсов */}
                      {greenhouse.plots[selectedPlot].plant && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                          <div className="font-semibold mb-1">📉 Потребление в час:</div>
                          <div className="grid grid-cols-2 gap-1 text-xs">
                            <div>💧 Вода: -{greenhouse.plots[selectedPlot].plant.phase === 'veg' ? '24%' : 
                                                greenhouse.plots[selectedPlot].plant.phase === 'flower' ? '18%' :
                                                greenhouse.plots[selectedPlot].plant.phase === 'sprout' ? '12%' : '6%'}</div>
                            <div>🧪 Питание: -{greenhouse.plots[selectedPlot].plant.phase === 'veg' ? '18%' : 
                                                   greenhouse.plots[selectedPlot].plant.phase === 'flower' ? '15%' :
                                                   greenhouse.plots[selectedPlot].plant.phase === 'sprout' ? '6%' : '3%'}</div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 mt-4">
                      <button 
                        onClick={() => waterPlant(selectedPlot)}
                        disabled={greenhouse.plots[selectedPlot].conditions.water > 75}
                        className="w-full bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        title={greenhouse.plots[selectedPlot].conditions.water > 75 ? "Почва еще влажная" : "Полить растение"}
                      >
                        💧 Полить {greenhouse.plots[selectedPlot].conditions.water > 75 ? "(слишком влажно)" : "(+20-40% воды)"}
                      </button>
                      
                      <button 
                        onClick={() => addNutrients(selectedPlot)}
                        disabled={inventory.fertilizer <= 0 || greenhouse.plots[selectedPlot].conditions.nutrients > 85}
                        className="w-full bg-green-500 text-white px-3 py-1 rounded text-sm disabled:bg-gray-300 hover:bg-green-600 disabled:cursor-not-allowed"
                        title={greenhouse.plots[selectedPlot].conditions.nutrients > 85 ? "Риск перекорма" : "Добавить удобрения"}
                      >
                        🧪 Удобрить ({inventory.fertilizer}) {greenhouse.plots[selectedPlot].conditions.nutrients > 85 ? "(перекорм!)" : ""}
                      </button>

                      {/* Промывка корней при передозировке */}
                      {greenhouse.plots[selectedPlot].conditions.nutrients > 90 && (
                        <button 
                          onClick={() => flushRoots(selectedPlot)}
                          className="w-full bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                        >
                          💧 Промыть корни (сброс питательных веществ)
                        </button>
                      )}

                      {/* Лекарства */}
                      {greenhouse.plots[selectedPlot].conditions.health < 80 && (
                        <div className="border-t pt-2 mt-2">
                          <div className="text-xs font-semibold mb-2 text-red-600">🏥 Лечение:</div>
                          
                          {inventory.medicines?.fungicide > 0 && (
                            <button 
                              onClick={() => useMedicine(selectedPlot, 'fungicide')}
                              className="w-full bg-orange-500 text-white px-3 py-1 rounded text-xs mb-1 hover:bg-orange-600"
                            >
                              🍄 Фунгицид ({inventory.medicines.fungicide}) - +15 здоровья
                            </button>
                          )}
                          
                          {inventory.medicines?.insecticide > 0 && (
                            <button 
                              onClick={() => useMedicine(selectedPlot, 'insecticide')}
                              className="w-full bg-red-500 text-white px-3 py-1 rounded text-xs mb-1 hover:bg-red-600"
                            >
                              🐛 Инсектицид ({inventory.medicines.insecticide}) - +10 здоровья
                            </button>
                          )}
                          
                          {inventory.medicines?.root_stimulator > 0 && (
                            <button 
                              onClick={() => useMedicine(selectedPlot, 'root_stimulator')}
                              className="w-full bg-purple-500 text-white px-3 py-1 rounded text-xs mb-1 hover:bg-purple-600"
                            >
                              🌱 Стимулятор ({inventory.medicines.root_stimulator}) - +20 здоровья
                            </button>
                          )}
                        </div>
                      )}
                      
                      {greenhouse.plots[selectedPlot].plant.phase === 'harvest' && (
                        <button 
                          onClick={() => harvestPlant(selectedPlot)}
                          className="w-full bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600 animate-pulse"
                        >
                          🌿 Собрать урожай!
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    {!greenhouse.plots[selectedPlot].equipment.pot ? (
                      <div className="bg-red-50 p-3 rounded mb-3 border border-red-200">
                        <div className="text-red-700 font-semibold text-sm">⚠️ Необходим горшок!</div>
                        <div className="text-red-600 text-xs mt-1">
                          Перед посадкой нужно купить и установить горшок в магазине → 
                          индивидуальное оборудование
                        </div>
                      </div>
                    ) : (
                      <div className="bg-green-50 p-3 rounded mb-3 border border-green-200">
                        <div className="text-green-700 font-semibold text-sm">✅ Готов к посадке!</div>
                        <div className="text-green-600 text-xs mt-1">
                          Горшок установлен, можете выбрать семена для посадки
                        </div>
                      </div>
                    )}
                    
                    {greenhouse.plots[selectedPlot].equipment.pot && (
                      <div>
                        <p className="mb-2 font-medium">🌱 Семена для посадки:</p>
                        {renderSeedButtons()}
                      </div>
                    )}
                    
                    <p className="mb-2 mt-4 font-medium">🔧 Установить оборудование:</p>
                    {renderEquipmentButtons()}
                    
                    {renderEquipmentButtons().length === 0 && (
                      <div className="text-gray-500 text-xs bg-gray-50 p-2 rounded">
                        Нет доступного оборудования. Купите в магазине!
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {selectedPlot === null && (
              <div className="text-gray-500 text-center py-8">
                <div className="text-2xl mb-2">👆</div>
                <div>Выберите грядку для управления</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Магазин */}
      {activeTab === 'shop' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-4 shadow-md">
            <h3 className="font-bold mb-4">🌱 Семена</h3>
            {Object.entries(STRAINS).map(([key, strain]) => (
              <div key={key} className="border-b pb-3 mb-3 last:border-b-0">
                <div className="flex justify-between items-start">
                  <div className="flex-1 mr-3">
                    <div className="font-semibold">{strain.name}</div>
                    <div className="text-xs text-gray-600 mb-1">{strain.description}</div>
                    <div className="text-xs space-y-1">
                      <div><strong>Генетика:</strong> {strain.genetics}</div>
                      <div><strong>THC:</strong> {strain.thc}</div>
                      <div><strong>Урожай:</strong> ~{strain.baseYield}г</div>
                    </div>
                  </div>
                  <button
                    onClick={() => buySeeds(key)}
                    disabled={gameState.money < strain.seedPrice}
                    className="bg-green-500 text-white px-3 py-1 rounded text-sm disabled:bg-gray-300"
                  >
                    ฿{strain.seedPrice.toLocaleString()}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-lg p-4 shadow-md">
            <h3 className="font-bold mb-4">🔧 Индивидуальное оборудование</h3>
            
            {/* Горшки */}
            <div className="mb-4">
              <h4 className="font-semibold text-sm mb-2 text-green-700">📦 Горшки</h4>
              {Object.entries(INDIVIDUAL_EQUIPMENT).filter(([key, item]) => item.type === 'pot').map(([key, item]) => (
                <div key={key} className="border-b pb-2 mb-2 last:border-b-0">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-sm">{item.name}</div>
                      <div className="text-xs text-gray-600">{item.description}</div>
                    </div>
                    <button
                      onClick={() => buyItem(key, false)}
                      disabled={gameState.money < item.price}
                      className="bg-blue-500 text-white px-2 py-1 rounded text-xs disabled:bg-gray-300"
                    >
                      ฿{item.price.toLocaleString()}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Освещение */}
            <div className="mb-4">
              <h4 className="font-semibold text-sm mb-2 text-yellow-700">💡 Освещение</h4>
              {Object.entries(INDIVIDUAL_EQUIPMENT).filter(([key, item]) => item.type === 'light').map(([key, item]) => (
                <div key={key} className="border-b pb-2 mb-2 last:border-b-0">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-sm">{item.name}</div>
                      <div className="text-xs text-gray-600">{item.description}</div>
                    </div>
                    <button
                      onClick={() => buyItem(key, false)}
                      disabled={gameState.money < item.price}
                      className="bg-blue-500 text-white px-2 py-1 rounded text-xs disabled:bg-gray-300"
                    >
                      ฿{item.price.toLocaleString()}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Остальное оборудование */}
            <div>
              <h4 className="font-semibold text-sm mb-2 text-purple-700">🔧 Аксессуары</h4>
              {Object.entries(INDIVIDUAL_EQUIPMENT).filter(([key, item]) => !['pot', 'light'].includes(item.type)).map(([key, item]) => (
                <div key={key} className="border-b pb-2 mb-2 last:border-b-0">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-sm">{item.name}</div>
                      <div className="text-xs text-gray-600">{item.description}</div>
                    </div>
                    <button
                      onClick={() => buyItem(key, false)}
                      disabled={gameState.money < item.price}
                      className="bg-blue-500 text-white px-2 py-1 rounded text-xs disabled:bg-gray-300"
                    >
                      ฿{item.price.toLocaleString()}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-md">
            <h3 className="font-bold mb-4">⚡ Глобальные системы</h3>
            
            {/* Системы автоматизации */}
            <div className="mb-4">
              <h4 className="font-semibold text-sm mb-2 text-purple-700">🤖 Автоматизация</h4>
              {Object.entries(GLOBAL_EQUIPMENT).filter(([key, item]) => 
                !item.consumable && ['global_water', 'global_light', 'global_climate', 'monitoring'].includes(item.type)
              ).map(([key, item]) => (
                <div key={key} className="border-b pb-2 mb-2 last:border-b-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 mr-2">
                      <div className="font-semibold text-xs">{item.name}</div>
                      <div className="text-xs text-gray-600 mb-1">{item.description}</div>
                      {greenhouse.globalEquipment[key] === true && (
                        <div className="text-xs text-green-600 font-bold">✅ Активна</div>
                      )}
                    </div>
                    <button
                      onClick={() => buyItem(key, true)}
                      disabled={gameState.money < item.price || greenhouse.globalEquipment[key] === true}
                      className="bg-purple-500 text-white px-2 py-1 rounded text-xs disabled:bg-gray-300 hover:bg-purple-600"
                    >
                      ฿{item.price.toLocaleString()}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Безопасность и дополнительно */}
            <div className="mb-4">
              <h4 className="font-semibold text-sm mb-2 text-red-700">🔒 Безопасность</h4>
              {Object.entries(GLOBAL_EQUIPMENT).filter(([key, item]) => 
                !item.consumable && ['security', 'stealth', 'ventilation', 'power', 'health'].includes(item.type)
              ).map(([key, item]) => (
                <div key={key} className="border-b pb-2 mb-2 last:border-b-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 mr-2">
                      <div className="font-semibold text-xs">{item.name}</div>
                      <div className="text-xs text-gray-600 mb-1">{item.description}</div>
                      {greenhouse.globalEquipment[key] === true && (
                        <div className="text-xs text-green-600 font-bold">✅ Активна</div>
                      )}
                    </div>
                    <button
                      onClick={() => buyItem(key, true)}
                      disabled={gameState.money < item.price || greenhouse.globalEquipment[key] === true}
                      className="bg-red-500 text-white px-2 py-1 rounded text-xs disabled:bg-gray-300 hover:bg-red-600"
                    >
                      ฿{item.price.toLocaleString()}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Расходные материалы */}
            <div className="border-t pt-3">
              <h4 className="font-semibold text-sm mb-2 text-green-700">🧪 Расходники</h4>
              
              {/* Удобрения */}
              <div className="mb-3">
                <div className="text-xs font-medium text-gray-700 mb-1">Удобрения:</div>
                {Object.entries(GLOBAL_EQUIPMENT).filter(([key, item]) => 
                  item.consumable && item.type === 'nutrients'
                ).map(([key, item]) => (
                  <div key={key} className="flex justify-between items-center mb-1">
                    <div className="flex-1">
                      <div className="font-medium text-xs">{item.name}</div>
                      <div className="text-xs text-gray-600">{item.description}</div>
                    </div>
                    <button
                      onClick={() => buyItem(key, true)}
                      disabled={gameState.money < item.price}
                      className="bg-green-500 text-white px-2 py-1 rounded text-xs disabled:bg-gray-300 hover:bg-green-600 ml-2"
                    >
                      ฿{item.price}
                    </button>
                  </div>
                ))}
              </div>

              {/* Лекарства */}
              <div>
                <div className="text-xs font-medium text-gray-700 mb-1">Лечение:</div>
                {Object.entries(GLOBAL_EQUIPMENT).filter(([key, item]) => 
                  item.consumable && item.type === 'medicine'
                ).map(([key, item]) => (
                  <div key={key} className="flex justify-between items-center mb-1">
                    <div className="flex-1">
                      <div className="font-medium text-xs">{item.name}</div>
                      <div className="text-xs text-gray-600">{item.description}</div>
                    </div>
                    <button
                      onClick={() => buyItem(key, true)}
                      disabled={gameState.money < item.price}
                      className="bg-blue-500 text-white px-2 py-1 rounded text-xs disabled:bg-gray-300 hover:bg-blue-600 ml-2"
                    >
                      ฿{item.price}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Инвентарь */}
      {activeTab === 'inventory' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-4 shadow-md">
            <h3 className="font-bold mb-4">🌱 Семена и урожай</h3>
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Семена:</h4>
              {Object.entries(inventory.seeds).map(([strain, count]) => (
                <div key={strain} className="flex justify-between">
                  <span>{STRAINS[strain].name}</span>
                  <span>{count}</span>
                </div>
              ))}
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Урожай:</h4>
              {Object.entries(inventory.harvest).map(([strain, qualities]) => (
                <div key={strain} className="mb-2">
                  <div className="font-medium">{STRAINS[strain].name}:</div>
                  {Object.entries(qualities).map(([quality, amount]) => (
                    amount > 0 ? (
                      <div key={quality} className="flex justify-between text-sm ml-4">
                        <span className={QUALITY_GRADES[quality].color}>
                          {QUALITY_GRADES[quality].name}
                        </span>
                        <span>{amount}г</span>
                      </div>
                    ) : null
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-md">
            <h3 className="font-bold mb-4">🔧 Оборудование и расходники</h3>
            
            <div className="mb-4">
              <h4 className="font-semibold mb-2">💊 Расходники:</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>🧪 Удобрения</span>
                  <span>{inventory.fertilizer}</span>
                </div>
                <div className="flex justify-between">
                  <span>🍄 Фунгицид</span>
                  <span>{inventory.medicines?.fungicide || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>🐛 Инсектицид</span>
                  <span>{inventory.medicines?.insecticide || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>🌱 Стимулятор корней</span>
                  <span>{inventory.medicines?.root_stimulator || 0}</span>
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <h4 className="font-semibold mb-2">🔧 Индивидуальное:</h4>
              {Object.entries(inventory.individualEquipment || {}).length > 0 ? (
                Object.entries(inventory.individualEquipment).map(([item, count]) => (
                  <div key={item} className="flex justify-between text-sm">
                    <span>{INDIVIDUAL_EQUIPMENT[item]?.name}</span>
                    <span>{count}</span>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 text-sm">Нет оборудования</div>
              )}
            </div>

            <div>
              <h4 className="font-semibold mb-2">🌐 Глобальное:</h4>
              {Object.entries(inventory.globalEquipment || {}).length > 0 ? (
                Object.entries(inventory.globalEquipment).map(([item, count]) => (
                  <div key={item} className="flex justify-between text-sm">
                    <span>{GLOBAL_EQUIPMENT[item]?.name}</span>
                    <span>{count}</span>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 text-sm">Нет систем</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Рынок */}
      {activeTab === 'market' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-4 shadow-md">
            <h3 className="font-bold mb-4">🏛️ Легальный рынок</h3>
            <p className="text-sm text-gray-600 mb-4">Безопасные, но стандартные цены</p>
            {renderLegalMarket()}
          </div>

          <div className="bg-white rounded-lg p-4 shadow-md">
            <h3 className="font-bold mb-4">🌚 Чёрный рынок</h3>
            <p className="text-sm text-gray-600 mb-4">Высокие цены, но есть риск рейда (10%)</p>
            {renderBlackMarket()}
          </div>
        </div>
      )}

      {/* Учебник */}
      {activeTab === 'education' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-4 shadow-md">
            <h3 className="font-bold mb-4">📖 Фазы роста каннабиса</h3>
            {Object.entries(GROWTH_PHASES).map(([phase, info]) => (
              <div key={phase} className="border-b pb-4 mb-4 last:border-b-0">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">{info.icon}</span>
                  <span className="font-semibold">{info.name}</span>
                </div>
                <p className="text-sm text-gray-700 mb-2">{info.description}</p>
                
                {/* Идеальные условия для фазы */}
                <div className="bg-blue-50 p-3 rounded mb-2">
                  <div className="font-semibold text-sm mb-2">🎯 Идеальные условия:</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>💧 Вода: {info.idealConditions.water[0]}-{info.idealConditions.water[1]}%</div>
                    <div>☀️ Свет: {info.idealConditions.light[0]}-{info.idealConditions.light[1]}%</div>
                    <div>🌡️ Температура: {info.idealConditions.temp[0]}-{info.idealConditions.temp[1]}%</div>
                    <div>🧪 Питание: {info.idealConditions.nutrients[0]}-{info.idealConditions.nutrients[1]}%</div>
                  </div>
                </div>
                
                <div className="bg-yellow-50 p-2 rounded text-xs">
                  <strong>💡 Совет:</strong> {info.tips}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-lg p-4 shadow-md">
            <h3 className="font-bold mb-4">🌱 Основы выращивания</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-green-700 mb-2">💧 Полив</h4>
                <p className="text-sm text-gray-700">
                  Поливайте когда верхний слой почвы подсох. Переувлажнение опаснее засухи.
                  Требования к воде меняются по фазам: прорастание требует больше влаги (70-90%), 
                  а цветение - меньше (40-60%).
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-yellow-600 mb-2">☀️ Освещение</h4>
                <p className="text-sm text-gray-700">
                  Освещение критично! Прорастание: слабый свет (20-40%), вегетация: интенсивный свет (60-90%), 
                  цветение: мощное освещение (70-95%) строго 12/12 часов.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-red-600 mb-2">🌡️ Климат</h4>
                <p className="text-sm text-gray-700">
                  Температурные требования растут с возрастом: прорастание 60-80%, 
                  вегетация 70-90%, цветение снижается до 60-80% для плотных шишек.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-purple-600 mb-2">🧪 Питание</h4>
                <p className="text-sm text-gray-700">
                  Питание по фазам: прорастание - минимум (20-40%), вегетация - много азота (60-80%), 
                  цветение - максимум фосфора и калия (70-90%).
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-indigo-600 mb-2">🎯 Система качества</h4>
                <div className="space-y-1 text-xs">
                  {Object.entries(QUALITY_GRADES).map(([grade, info]) => (
                    <div key={grade} className={`${info.color} font-medium`}>
                      {info.name}: {Math.floor(info.multiplier * 100)}% от базовой цены
                    </div>
                  ))}
                  <div className="mt-2 text-gray-600">
                    <strong>Совет:</strong> Соблюдайте идеальные условия для каждой фазы, 
                    чтобы получить Grade A качество!
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
