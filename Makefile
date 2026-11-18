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

# Not @latest because gostyle v0.26.1 and later require Go 1.26.8 or newer, which the go directive in go.mod does not satisfy.
depsdev:
	go install github.com/k1LoW/gostyle@v0.26.0

credits: generate
	go install github.com/Songmu/gocredits/cmd/gocredits@v1.0.0
	gocredits . > CREDITS

prerelease_for_tagpr:
	$(MAKE) credits
	git add CHANGELOG.md CREDITS go.mod go.sum

.PHONY: default ci generate build test dev-frontend lint depsdev credits prerelease_for_tagpr
