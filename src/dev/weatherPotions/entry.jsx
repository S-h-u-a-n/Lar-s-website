if (import.meta.env.DEV) import('./mount.jsx')
else document.getElementById('weather-potions-root').textContent = '魔法天氣藥水目前僅在開發模式開放。'
