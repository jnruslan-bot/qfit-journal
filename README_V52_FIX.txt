QFit Journal v52 — real responsive CSS fix

Что сделать:
1) Заменить файл styles.css в репозитории на этот styles.css.
2) В index.html заменить styles.css?v=51 или ?v=47 на styles.css?v=52.
3) В sw.js обновить CACHE_NAME на qfit-journal-v52 и желательно добавить styles.css?v=52 в список кэша.
4) На телефоне открыть: https://jnruslan-bot.github.io/qfit-journal/?v=52&clear=1
5) Если стоит PWA-иконка, удалить старую и установить заново.

Суть фикса:
- Web/Desktop больше не рисуется как телефон-макет.
- Phone/PWA больше не рисует телефон внутри телефона.
- Стартовый экран снова настоящий HTML/CSS, а не картинка start-screen-mobile*.png.
- Скрыт фейковый status-bar 9:41 на рабочих экранах.
- Поля ввода имеют 16px, чтобы мобильный браузер не зумил страницу.
