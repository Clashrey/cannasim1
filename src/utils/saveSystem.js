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
      gameState: memory
