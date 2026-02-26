# Быстрый старт

## Запуск проекта в Docker

### Шаг 1: Проверка требований

Убедитесь, что у вас установлен Docker:

```bash
docker --version
docker compose version
```

Должны быть версии:
- Docker >= 20.10
- Docker Compose >= 2.0

### Шаг 2: Сборка образов

```bash
# Используя Makefile
make build

# Или напрямую через Docker Compose
docker compose build
```

### Шаг 3: Запуск сервисов

```bash
# Используя Makefile
make up

# Или напрямую
docker compose up -d
```

### Шаг 4: Проверка статуса

```bash
# Используя Makefile
make ps

# Или напрямую
docker compose ps
```

Все сервисы должны быть в статусе "Up" или "healthy".

### Шаг 5: Проверка работоспособности

1. **Frontend**: откройте http://localhost:3000
2. **Kong API Gateway**: откройте http://localhost:8000
3. **Kong Admin**: откройте http://localhost:8001

Проверка API:

```bash
# Health check через Kong
curl http://localhost:8000/api/auth/../health

# Прямой доступ к Auth Service (внутри сети Docker)
docker compose exec auth-service curl http://localhost:3001/health
```

### Шаг 6: Просмотр логов

```bash
# Все логи
make logs

# Логи конкретного сервиса
make logs-auth
make logs-kong

# Или напрямую
docker compose logs -f auth-service
docker compose logs -f kong
```

## Остановка проекта

```bash
# Остановка без удаления данных
make down

# Полная очистка (включая volumes)
make clean
```

## Подключение к базе данных

```bash
make db-shell

# Или напрямую
docker compose exec postgres psql -U serviceuser -d service_manager
```

Полезные SQL команды:

```sql
-- Список таблиц
\dt

-- Описание таблицы
\d users

-- Количество пользователей
SELECT COUNT(*) FROM users;

-- Все заказы
SELECT * FROM orders;
```

## Работа с Redis

```bash
make redis-shell

# Или напрямую
docker compose exec redis redis-cli
```

## Разработка

### Локальная разработка сервиса

1. Установите зависимости:

```bash
cd services/auth
npm install
```

2. Запустите в режиме разработки:

```bash
npm run dev
```

### Локальная разработка Frontend

```bash
cd frontend
npm install
npm run dev
```

## Тестирование API

### Регистрация пользователя

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Тест",
    "lastName": "Пользователь",
    "role": "technician"
  }'
```

### Вход в систему

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

Ответ содержит JWT токен, который нужно использовать для защищенных запросов:

```bash
TOKEN="your-jwt-token-here"

curl -X GET http://localhost:8000/api/users \
  -H "Authorization: Bearer $TOKEN"
```

## Решение проблем

### Порты заняты

Если порты 3000, 8000, 8001, 5432 заняты, измените их в `docker-compose.yml`:

```yaml
ports:
  - "3001:3000"  # Вместо 3000:3000
```

### Контейнер не запускается

Проверьте логи:

```bash
docker compose logs service-name
```

Пересоберите образ:

```bash
docker compose build --no-cache service-name
docker compose up -d service-name
```

### База данных не инициализируется

Удалите volume и пересоздайте:

```bash
docker compose down -v
docker compose up -d
```

### Kong не может подключиться к сервисам

Проверьте, что все сервисы запущены:

```bash
docker compose ps
```

Проверьте сеть Docker:

```bash
docker network ls
docker network inspect workflow_service-network
```

## Полезные команды

```bash
# Перезапуск сервиса
docker compose restart auth-service

# Пересборка и перезапуск
docker compose build auth-service
docker compose up -d auth-service

# Выполнение команды в контейнере
docker compose exec auth-service sh

# Просмотр использования ресурсов
docker stats

# Очистка неиспользуемых образов
docker image prune -a
```

## Следующие шаги

1. Изучите [README.md](README.md) для полной документации
2. Посмотрите схему базы данных в `database/init/01-create-tables.sql`
3. Изучите Kong конфигурацию в `kong.yaml`
4. Настройте переменные окружения, скопировав `.env.example` в `.env`

## Вопросы?

Если возникли проблемы, проверьте:
- Логи сервисов: `docker compose logs`
- Статус контейнеров: `docker compose ps`
- Здоровье сервисов: `curl http://localhost:8000/api/auth/../health`
