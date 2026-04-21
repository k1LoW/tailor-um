PKG = github.com/k1LoW/tailor-um
COMMIT = $(shell git rev-parse --short HEAD)
BUILD_LDFLAGS = "-s -w -X $(PKG)/version.Revision=$(COMMIT)"

default: build

generate:
	go generate ./internal/static/

build: generate
	go build -ldflags=$(BUILD_LDFLAGS) -trimpath -o tailor-um .

test:
	go test ./... -coverprofile=coverage.out -covermode=count

dev-frontend:
	cd internal/frontend && pnpm dev

lint:
	golangci-lint run ./...

.PHONY: default generate build test dev-frontend lint
