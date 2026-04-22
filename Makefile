PKG = github.com/k1LoW/tailor-um
COMMIT = $(shell git rev-parse --short HEAD)
BUILD_LDFLAGS = "-s -w -X $(PKG)/version.Revision=$(COMMIT)"

default: build

ci: depsdev generate test

generate:
	go generate ./internal/static/

build: generate
	go build -ldflags=$(BUILD_LDFLAGS) -trimpath -o tailor-um .

test:
	go test ./... -coverprofile=coverage.out -covermode=count -count=1

dev-frontend:
	cd internal/frontend && pnpm dev

lint:
	golangci-lint run ./...
	go vet -vettool=`which gostyle` -gostyle.config=$(PWD)/.gostyle.yml ./...
	cd internal/frontend && pnpm install && pnpm run lint
	cd internal/frontend && pnpm run fmt:check

depsdev:
	go install github.com/Songmu/gocredits/cmd/gocredits@latest
	go install github.com/k1LoW/gostyle@latest

credits: depsdev
	go mod download
	gocredits -w .

prerelease_for_tagpr:
	git add CHANGELOG.md CREDITS go.mod go.sum

.PHONY: default ci generate build test dev-frontend lint depsdev credits prerelease_for_tagpr
