LOCAL_BIN:=$(CURDIR)/bin
PATH:=$(LOCAL_BIN):$(PATH)

.PHONY: help

help: ## Display this help screen
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Docker Compose

compose-up: ### Run application stack
	docker-compose up --build -d zvonim-app

compose-down: ### Stop and remove all containers
	docker-compose down --remove-orphans

##@ Application

run: ### Run application locally
	go run ./cmd/app

build: ### Build application binary
	go build -o $(LOCAL_BIN)/app ./cmd/app

##@ Testing

test: ### Run unit tests with race detection
	go test -v -cover -race ./internal/...

##@ Development

generate-docs: ### Generate API documentation using Swagger
	swag init -g cmd/app/main.go