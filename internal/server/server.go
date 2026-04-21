package server

import (
	"io/fs"
	"log/slog"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/k1LoW/tailor-um/internal/static"
)

func NewHandler(state *AppState) http.Handler {
	mux := http.NewServeMux()

	// Config
	mux.HandleFunc("GET /_/api/config", handleConfig(state))

	// UserProfile CRUD
	mux.HandleFunc("GET /_/api/user-profiles", handleListUserProfiles(state))
	mux.HandleFunc("POST /_/api/user-profiles", handleCreateUserProfile(state))
	mux.HandleFunc("GET /_/api/user-profiles/{id}", handleGetUserProfile(state))
	mux.HandleFunc("PUT /_/api/user-profiles/{id}", handleUpdateUserProfile(state))
	mux.HandleFunc("DELETE /_/api/user-profiles/{id}", handleDeleteUserProfile(state))

	// IdP User CRUD
	mux.HandleFunc("GET /_/api/idp-users", handleListIdPUsers(state))
	mux.HandleFunc("POST /_/api/idp-users", handleCreateIdPUser(state))
	mux.HandleFunc("GET /_/api/idp-users/{id}", handleGetIdPUser(state))
	mux.HandleFunc("PUT /_/api/idp-users/{id}", handleUpdateIdPUser(state))
	mux.HandleFunc("DELETE /_/api/idp-users/{id}", handleDeleteIdPUser(state))

	// Version
	mux.HandleFunc("GET /_/api/version", handleVersion())

	// SPA fallback
	mux.HandleFunc("GET /", handleSPA())

	return withRequestLog(mux)
}

func withRequestLog(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/_/api/") {
			start := time.Now()
			rw := &statusRecorder{ResponseWriter: w, status: 200}
			next.ServeHTTP(rw, r)
			slog.Info("HTTP", "method", r.Method, "path", r.URL.Path, "status", rw.status, "duration", time.Since(start).String())
			return
		}
		next.ServeHTTP(w, r)
	})
}

type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (r *statusRecorder) WriteHeader(code int) {
	r.status = code
	r.ResponseWriter.WriteHeader(code)
}

func handleSPA() http.HandlerFunc {
	distFS, err := fs.Sub(static.Frontend, "dist")
	if err != nil {
		slog.Error("failed to create sub filesystem", "error", err)
		os.Exit(1)
	}
	fileServer := http.FileServer(http.FS(distFS))

	return func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		if path == "/" {
			path = "/index.html"
		}

		f, err := distFS.Open(strings.TrimPrefix(path, "/"))
		if err == nil {
			f.Close()
			fileServer.ServeHTTP(w, r)
			return
		}

		// SPA fallback: serve index.html for all non-file routes
		r.URL.Path = "/"
		fileServer.ServeHTTP(w, r)
	}
}
