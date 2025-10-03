# Шаблон для выполнения тестового задания

## Описание

Шаблон подготовлен для того, чтобы попробовать сократить трудоемкость выполнения тестового задания.

В шаблоне настоены контейнеры для `postgres` и приложения на `nodejs`.  
Для взаимодействия с БД используется `knex.js`.  
В контейнере `app` используется `build` для приложения на `ts`, но можно использовать и `js`.

Шаблон не является обязательным!\
Можно использовать как есть или изменять на свой вкус.

Все настройки можно найти в файлах:

- compose.yaml
- dockerfile
- package.json
- tsconfig.json
- src/config/env/env.ts
- src/config/knex/knexfile.ts

## Команды:

Запуск базы данных:

```bash
docker compose up -d --build postgres
```

Для выполнения миграций и сидов не из контейнера:

```bash
npm run knex:dev migrate latest
```

```bash
npm run knex:dev seed run
```

Также можно использовать и остальные команды (`migrate make <name>`,`migrate up`, `migrate down` и т.д.)

Для запуска приложения в режиме разработки:

```bash
npm run dev
```

Запуск проверки самого приложения:

```bash
docker compose up -d --build app
```

ТЕСТОВЫЕ GOOGLE ТАБЛИЦЫ ДЛЯ ОБНОВЛЕНИЯ:

1. https://docs.google.com/spreadsheets/d/1Am7tplNy0P1oYeHLdtngIBG1FvJjjdHv0xR6ojU3UUU/edit?gid=832038722#gid=832038722
2. https://docs.google.com/spreadsheets/d/1lg5uQNnsUra2e6lqi4M3Zm0hFVtT-pqyZO1iYlosEm0/edit?gid=621363503#gid=621363503

Можно добавить id своей таблицы в .env, но обязательно нужно выдать права редактирования для пользователя: wb-tariffs-service@wb-tariffs-service-473914.iam.gserviceaccount.com
