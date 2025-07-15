// Система сохранения игры в памяти (для Claude.ai среды)
const SAVE_VERSION = '1.0';

// Хранилище в памяти
let memoryStorage = null;

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
    
    memoryStorage = saveData;
    console.log('💾 Игра сохранена в память');
    return true;
  } catch (error) {
    console.error('Ошибка сохранения игры:', error);
    return false;
  }
};

// Функция загрузки игры
export const loadGame = () => {
  try {
    if (!memoryStorage) return null;
    
    // Проверка версии сохранения
    if (memoryStorage.version !== SAVE_VERSION) {
      console.warn('Устаревшая версия сохранения, возможны проблемы совместимости');
    }
    
    console.log('📂 Игра загружена из памяти');
    return {
      gameState: memoryStorage.gameState,
      greenhouse: memoryStorage.greenhouse,
      inventory: memoryStorage.inventory,
      timestamp: memoryStorage.timestamp
    };
  } catch (error) {
    console.error('Ошибка загрузки игры:', error);
    return null;
  }
};

// Функция удаления сохранения
export const deleteSave = () => {
  try {
    memoryStorage = null;
    console.log('🗑️ Сохранение удалено из памяти');
    return true;
  } catch (error) {
    console.error('Ошибка удаления сохранения:', error);
    return false;
  }
};

// Функция проверки наличия сохранения
export const hasSave = () => {
  return memoryStorage !== null;
};

// Функция получения информации о сохранении
export const getSaveInfo = () => {
  try {
    if (!memoryStorage) return null;
    
    return {
      version: memoryStorage.version,
      timestamp: memoryStorage.timestamp,
      day: memoryStorage.gameState?.day || 0,
      money: memoryStorage.gameState?.money || 0,
      level: memoryStorage.gameState?.level || 1
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
    if (!memoryStorage) return null;
    
    const dataStr = JSON.stringify(memoryStorage, null, 2);
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
        memoryStorage = saveData;
        resolve(saveData);
      } catch (error) {
        reject(error);
      }
    };
    reader.readAsText(file);
  });
};
