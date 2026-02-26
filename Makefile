.PHONY: help build up down restart logs ps clean install test

help: ## Показать справку
	@echo "Доступные команды:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

build: ## Собрать все Docker образы
	docker-compose build

up: ## Запустить все сервисы
	docker-compose up -d
	@echo "Сервисы запущены!"
	@echo "Frontend: http://localhost:3000"
	@echo "Kong API: http://localhost:8000"
	@echo "Kong Admin: http://localhost:8001"

down: ## Остановить все сервисы
	docker-compose down

restart: ## Перезапустить все сервисы
	docker-compose restart

logs: ## Показать логи всех сервисов
	docker-compose logs -f

logs-auth: ## Показать логи Auth Service
	docker-compose logs -f auth-service

logs-users: ## Показать логи Users Service
	docker-compose logs -f users-service

logs-tasks: ## Показать логи Tasks Service
	docker-compose logs -f tasks-service

logs-kong: ## Показать логи Kong
	docker-compose logs -f kong

ps: ## Показать статус всех сервисов
	docker-compose ps

clean: ## Удалить все контейнеры и volumes
	docker-compose down -v
	docker system prune -f

install-auth: ## Установить зависимости для Auth Service
	cd services/auth && npm install

install-users: ## Установить зависимости для Users Service
	cd services/users && npm install

install-tasks: ## Установить зависимости для Tasks Service
	cd services/tasks && npm install

install-frontend: ## Установить зависимости для Frontend
	cd frontend && npm install

install-all: ## Установить зависимости для всех сервисов
	@echo "Установка зависимостей..."
	cd services/auth && npm install
	cd services/users && npm install
	cd services/tasks && npm install
	cd services/schedule && npm install
	cd services/notifications && npm install
	cd services/reports && npm install
	cd frontend && npm install
	@echo "Зависимости установлены!"

db-shell: ## Подключиться к PostgreSQL
	docker-compose exec postgres psql -U serviceuser -d service_manager

redis-shell: ## Подключиться к Redis
	docker-compose exec redis redis-cli

test: ## Запустить тесты
	@echo "Запуск тестов..."
	# TODO: добавить команды для тестирования

dev-auth: ## Запустить Auth Service в режиме разработки
	cd services/auth && npm run dev

dev-frontend: ## Запустить Frontend в режиме разработки
	cd frontend && npm run dev
