QFit Journal v44 — No Mockup Cache Fix

Что исправлено:
1. Стартовый экран больше не использует assets/start-mockup.png как основной экран.
2. На телефоне больше не должен появляться «телефон внутри телефона».
3. В index.html добавлены cache-busting ссылки: styles.css?v=44, app.js?v=44, manifest.json?v=44.
4. Service Worker переведен на network-first, чтобы обновления GitHub Pages подтягивались быстрее.
5. manifest start_url изменен на ./index.html?v=44.

После загрузки на GitHub открыть на телефоне:
https://jnruslan-bot.github.io/qfit-journal/?v=44

Если старая версия все равно видна: удалить старую иконку PWA, в Chrome очистить данные сайта jnruslan-bot.github.io и открыть ссылку снова.
