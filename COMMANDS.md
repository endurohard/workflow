# Справочник команд

## Быстрые команды (через Makefile)

### Основные команды

```bash
make help          # Показать все доступные команды
make build         # Собрать все Docker образы
make up            # Запустить все сервисы
make down          # Остановить все сервисы
make restart       # Перезапустить все сервисы
make ps            # Показать статус сервисов
make logs          # Показать логи всех сервисов
make clean         # Удалить все контейнеры и данные
```

### Логи отдельных сервисов

```bash
make logs-auth     # Логи Auth Service
make logs-users    # Логи Users Service
make logs-tasks    # Логи Tasks Service
make logs-kong     # Логи Kong Gateway
```

### Установка зависимостей

```bash
make install-all       # Установить зависимости для всех сервисов
make install-auth      # Установить зависимости для Auth Service
make install-frontend  # Установить зависимости для Frontend
```

### Подключение к БД

```bash
make db-shell      # Подключиться к PostgreSQL
make redis-shell   # Подключиться к Redis
```

### Режим разработки

```bash
make dev-auth      # Запустить Auth Service локально
make dev-frontend  # Запустить Frontend локально
```

## Docker Compose команды

### Управление контейнерами

```bash
# Запуск
docker compose up -d                    # Запустить в фоне
docker compose up                       # Запустить с выводом логов
docker compose up auth-service          # Запустить только Auth Service

# Остановка
docker compose down                     # Остановить все сервисы
docker compose down -v                  # Остановить и удалить volumes
docker compose stop                     # Остановить без удаления
docker compose stop auth-service        # Остановить Auth Service

# Перезапуск
docker compose restart                  # Перезапустить все
docker compose restart auth-service     # Перезапустить Auth Service
```

### Сборка образов

```bash
# Полная сборка
docker compose build                    # Собрать все сервисы
docker compose build --no-cache         # Собрать без кеша
docker compose build auth-service       # Собрать Auth Service

# Пересборка и перезапуск
docker compose up -d --build            # Пересобрать и запустить
docker compose up -d --build --force-recreate  # Принудительно пересоздать
```

### Просмотр логов

```bash
# Все сервисы
docker compose logs                     # Показать все логи
docker compose logs -f                  # Следить за логами в реальном времени
docker compose logs --tail=100          # Последние 100 строк

# Конкретный сервис
docker compose logs auth-service        # Логи Auth Service
docker compose logs -f kong             # Следить за логами Kong
docker compose logs --tail=50 postgres  # Последние 50 строк PostgreSQL
```

### Статус и информация

```bash
docker compose ps                       # Статус всех контейнеров
docker compose ps -a                    # Включая остановленные
docker compose top                      # Процессы в контейнерах
docker compose images                   # Список образов
docker compose config                   # Проверить конфигурацию
```

### Выполнение команд в контейнерах

```bash
# Войти в контейнер
docker compose exec auth-service sh     # Shell в Auth Service
docker compose exec postgres bash       # Bash в PostgreSQL

# Выполнить команду
docker compose exec auth-service npm run build
docker compose exec postgres psql -U serviceuser -d service_manager
docker compose exec redis redis-cli
```

### Масштабирование

```bash
docker compose up -d --scale tasks-service=3    # Запустить 3 экземпляра Tasks Service
```

## PostgreSQL команды

### Подключение к БД

```bash
# Через docker compose
docker compose exec postgres psql -U serviceuser -d service_manager

# Прямое подключение (если порт открыт)
psql -h localhost -U serviceuser -d service_manager
```

### SQL команды в psql

```sql
-- Список баз данных
\l

-- Подключиться к БД
\c service_manager

-- Список таблиц
\dt

-- Описание таблицы
\d users
\d+ orders

-- Список индексов
\di

-- Выход
\q
```

### Полезные SQL запросы

```sql
-- Количество пользователей
SELECT COUNT(*) FROM users;

-- Все заявки
SELECT * FROM orders ORDER BY created_at DESC LIMIT 10;

-- Активные задачи
SELECT * FROM tasks WHERE status = 'in_progress';

-- Статистика по техникам
SELECT 
  u.first_name, 
  u.last_name, 
  COUNT(t.id) as tasks_count
FROM users u
JOIN technicians tech ON u.id = tech.user_id
LEFT JOIN tasks t ON tech.id = t.technician_id
GROUP BY u.id;
```

### Backup и восстановление

```bash
# Создать backup
docker compose exec postgres pg_dump -U serviceuser service_manager > backup.sql

# Восстановить из backup
docker compose exec -T postgres psql -U serviceuser service_manager < backup.sql
```

## Redis команды

### Подключение

```bash
docker compose exec redis redis-cli
```

### Основные команды Redis

```bash
# Проверка подключения
PING

# Просмотр всех ключей
KEYS *

# Получить значение
GET key_name

# Установить значение
SET key_name value

# Удалить ключ
DEL key_name

# Очистить всё
FLUSHALL

# Статистика
INFO

# Выход
EXIT
```

## Kong API Gateway команды

### Kong Admin API

```bash
# Список сервисов
curl http://localhost:8001/services

# Список маршрутов
curl http://localhost:8001/routes

# Список плагинов
curl http://localhost:8001/plugins

# Статус Kong
curl http://localhost:8001/status

# Информация о Kong
curl http://localhost:8001
```

### Обновление конфигурации

```bash
# Перезагрузить конфигурацию
docker compose restart kong

# Применить новую конфигурацию
docker compose exec kong kong reload
```

### Тестирование через Kong

```bash
# Health check
curl http://localhost:8000/api/auth/../health

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password123"}'

# Получить пользователей (с токеном)
curl http://localhost:8000/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Docker команды

### Управление образами

```bash
# Список образов
docker images

# Удалить образ
docker rmi workflow-auth-service

# Очистка неиспользуемых образов
docker image prune -a
```

### Управление контейнерами

```bash
# Список запущенных контейнеров
docker ps

# Все контейнеры (включая остановленные)
docker ps -a

# Остановить контейнер
docker stop service-manager-auth

# Удалить контейнер
docker rm service-manager-auth

# Очистка остановленных контейнеров
docker container prune
```

### Управление volumes

```bash
# Список volumes
docker volume ls

# Информация о volume
docker volume inspect workflow_postgres-data

# Удалить volume
docker volume rm workflow_postgres-data

# Очистка неиспользуемых volumes
docker volume prune
```

### Мониторинг

```bash
# Использование ресурсов
docker stats

# Логи контейнера
docker logs service-manager-auth
docker logs -f service-manager-auth  # В реальном времени
docker logs --tail=100 service-manager-auth  # Последние 100 строк

# Информация о контейнере
docker inspect service-manager-auth
```

### Сети

```bash
# Список сетей
docker network ls

# Информация о сети
docker network inspect workflow_service-network

# Подключенные контейнеры
docker network inspect workflow_service-network | grep Name
```

## npm команды (для разработки)

### Установка зависимостей

```bash
cd services/auth
npm install              # Установить зависимости
npm ci                   # Чистая установка (из lock-файла)
```

### Разработка

```bash
npm run dev              # Запустить в режиме разработки
npm run build            # Собрать проект
npm run start            # Запустить production сборку
npm run lint             # Проверить код линтером
npm run test             # Запустить тесты
```

## Полезные комбинации

### Полная перезагрузка

```bash
docker compose down -v
docker compose build --no-cache
docker compose up -d
docker compose logs -f
```

### Быстрый перезапуск сервиса

```bash
docker compose build auth-service && docker compose up -d auth-service && docker compose logs -f auth-service
```

### Очистка системы

```bash
docker compose down -v
docker system prune -a --volumes
```

### Backup всего проекта

```bash
# Backup БД
docker compose exec postgres pg_dump -U serviceuser service_manager > backup_$(date +%Y%m%d).sql

# Backup Redis (опционально)
docker compose exec redis redis-cli SAVE
docker compose cp redis:/data/dump.rdb ./redis_backup_$(date +%Y%m%d).rdb
```

## Troubleshooting команды

```bash
# Проверка портов
netstat -tulpn | grep LISTEN
lsof -i :8000

# Проверка сети Docker
docker network inspect workflow_service-network

# Перезапуск Docker демона
sudo systemctl restart docker

# Логи Docker демона
sudo journalctl -u docker.service -f

# Проверка здоровья контейнеров
docker compose ps
docker inspect --format='{{.State.Health.Status}}' service-manager-auth
```
