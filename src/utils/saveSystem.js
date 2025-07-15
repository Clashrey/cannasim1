// Система сохранения игры в localStorage
const SAVE_KEY = 'cannabis_simulator_save';
const SAVE_VERSION = '1.0';

// Функция сохранения игры
export const saveGame = (gameState, greenhouse, inventory) => {
  try {
    const saveData = {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      gameState,
      greenhouse,
      inventory
    };
    
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    return true;
  } catch (error) {
    console.error('Ошибка сохранения игры:', error);
    return false;
  }
};

// Функция загрузки игры
export const loadGame = () => {
  try {
    const savedData = localStorage.getItem(SAVE_KEY);
    if (!savedData) return null;
    
    const saveData = JSON.parse(savedData);
    
    // Проверка версии сохранения
    if (saveData.version !== SAVE_VERSION) {
      console.warn('Устаревшая версия сохранения, возможны проблемы совместимости');
    }
    
    return {
      gameState: saveData.gameState,
      greenhouse: saveData.greenhouse,
      inventory: saveData.inventory,
      timestamp: saveData.timestamp
    };
  } catch (error) {
    console.error('Ошибка загрузки игры:', error);
    return null;
  }
};

// Функция удаления сохранения
export const deleteSave = () => {
  try {
    localStorage.removeItem(SAVE_KEY);
    return true;
  } catch (error) {
    console.error('Ошибка удаления сохранения:', error);
    return false;
  }
};

// Функция проверки наличия сохранения
export const hasSave = () => {
  return localStorage.getItem(SAVE_KEY) !== null;
};

// Функция получения информации о сохранении
export const getSaveInfo = () => {
  try {
    const savedData = localStorage.getItem(SAVE_KEY);
    if (!savedData) return null;
    
    const saveData = JSON.parse(savedData);
    return {
      version: saveData.version,
      timestamp: saveData.timestamp,
      day: saveData.gameState?.day || 0,
      money: saveData.gameState?.money || 0,
      level: saveData.gameState?.level || 1
    };
  } catch (error) {
    console.error('Ошибка получения информации о сохранении:', error);
    return null;
  }
};

// Автосохранение каждые N секунд
export const setupAutoSave = (gameState, greenhouse, inventory, intervalSeconds = 30) => {
  const autoSaveInterval = setInterval(() => {
    const success = saveGame(gameState, greenhouse, inventory);
    if (success) {
      console.log('🎮 Автосохранение выполнено');
    }
  }, intervalSeconds * 1000);
  
  return autoSaveInterval;
};

// Функция экспорта сохранения в JSON файл
export const exportSave = () => {
  try {
    const savedData = localStorage.getItem(SAVE_KEY);
    if (!savedData) return null;
    
    const saveData = JSON.parse(savedData);
    const dataStr = JSON.stringify(saveData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cannabis_simulator_save_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Ошибка экспорта сохранения:', error);
    return false;
  }
};

// Функция импорта сохранения из файла
export const importSave = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const saveData = JSON.parse(e.target.result);
        localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
        resolve(saveData);
      } catch (error) {
        reject(error);
      }
    };
    reader.readAsText(file);
  });
};
