// Система сохранения игры в sessionStorage (для Claude.ai среды)
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
    
    // Используем sessionStorage вместо localStorage
    sessionStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    console.log('💾 Игра сохранена в sessionStorage');
    return true;
  } catch (error) {
    console.error('Ошибка сохранения игры:', error);
    // Fallback к памяти если sessionStorage недоступен
    window.gameBackup = saveData;
    return true;
  }
};

// Функция загрузки игры
export const loadGame = () => {
  try {
    let savedData = null;
    
    // Пробуем загрузить из sessionStorage
    try {
      savedData = sessionStorage.getItem(SAVE_KEY);
    } catch (e) {
      // Если sessionStorage недоступен, пробуем fallback
      savedData = window.gameBackup ? JSON.stringify(window.gameBackup) : null;
    }
    
    if (!savedData) return null;
    
    const saveData = JSON.parse(savedData);
    
    // Проверка версии сохранения
    if (saveData.version !== SAVE_VERSION) {
      console.warn('Устаревшая версия сохранения, возможны проблемы совместимости');
    }
    
    console.log('📂 Игра загружена из сохранения');
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
    try {
      sessionStorage.removeItem(SAVE_KEY);
    } catch (e) {
      window.gameBackup = null;
    }
    console.log('🗑️ Сохранение удалено');
    return true;
  } catch (error) {
    console.error('Ошибка удаления сохранения:', error);
    return false;
  }
};

// Функция проверки наличия сохранения
export const hasSave = () => {
  try {
    const saved = sessionStorage.getItem(SAVE_KEY);
    return saved !== null;
  } catch (e) {
    return window.gameBackup !== null && window.gameBackup !== undefined;
  }
};

// Функция получения информации о сохранении
export const getSaveInfo = () => {
  try {
    let savedData = null;
    
    try {
      savedData = sessionStorage.getItem(SAVE_KEY);
    } catch (e) {
      savedData = window.gameBackup ? JSON.stringify(window.gameBackup) : null;
    }
    
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
    let savedData = null;
    
    try {
      savedData = sessionStorage.getItem(SAVE_KEY);
    } catch (e) {
      savedData = window.gameBackup ? JSON.stringify(window.gameBackup) : null;
    }
    
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
        try {
          sessionStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
        } catch (err) {
          window.gameBackup = saveData;
        }
        resolve(saveData);
      } catch (error) {
        reject(error);
      }
    };
    reader.readAsText(file);
  });
};
