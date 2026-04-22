package server

import (
	"encoding/json"
	"io"
	"net/http"

	"github.com/k1LoW/tailor-um/internal/tailor"
)

func handleListIdPUsers(state *AppState) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !state.HasBuiltInIdP {
			writeError(w, http.StatusNotFound, "Built-in IdP is not configured")
			return
		}
		code := tailor.BuildIdPListScript(state.IdPConfigName)
		arg := r.URL.Query().Get("arg")
		if arg == "" {
			arg = `{"first":50}`
		}
		result, err := state.Client.ExecScript(r.Context(), "list-idp-users.js", code, &arg)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = io.WriteString(w, result) //nolint:gosec // API JSON response from TestExecScript, not user-controlled HTML //nostyle:handlerrors
	}
}

func handleGetIdPUser(state *AppState) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !state.HasBuiltInIdP {
			writeError(w, http.StatusNotFound, "Built-in IdP is not configured")
			return
		}
		id := r.PathValue("id")
		code := tailor.BuildIdPGetScript(state.IdPConfigName)
		arg := mustJSON(map[string]string{"id": id})
		result, err := state.Client.ExecScript(r.Context(), "get-idp-user.js", code, &arg)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = io.WriteString(w, result) //nolint:gosec // API JSON response from TestExecScript, not user-controlled HTML //nostyle:handlerrors
	}
}

func handleCreateIdPUser(state *AppState) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !state.HasBuiltInIdP {
			writeError(w, http.StatusNotFound, "Built-in IdP is not configured")
			return
		}
		var body map[string]any
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			writeError(w, http.StatusBadRequest, "invalid JSON body")
			return
		}
		code := tailor.BuildIdPCreateScript(state.IdPConfigName)
		arg := mustJSON(body)
		result, err := state.Client.ExecScript(r.Context(), "create-idp-user.js", code, &arg)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		_, _ = io.WriteString(w, result) //nolint:gosec // API JSON response from TestExecScript, not user-controlled HTML //nostyle:handlerrors
	}
}

func handleUpdateIdPUser(state *AppState) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !state.HasBuiltInIdP {
			writeError(w, http.StatusNotFound, "Built-in IdP is not configured")
			return
		}
		id := r.PathValue("id")
		var body map[string]any
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			writeError(w, http.StatusBadRequest, "invalid JSON body")
			return
		}
		body["id"] = id
		code := tailor.BuildIdPUpdateScript(state.IdPConfigName)
		arg := mustJSON(body)
		result, err := state.Client.ExecScript(r.Context(), "update-idp-user.js", code, &arg)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = io.WriteString(w, result) //nolint:gosec // API JSON response from TestExecScript, not user-controlled HTML //nostyle:handlerrors
	}
}

func handleSendPasswordResetEmail(state *AppState) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !state.HasBuiltInIdP {
			writeError(w, http.StatusNotFound, "Built-in IdP is not configured")
			return
		}
		id := r.PathValue("id")
		var body map[string]any
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			writeError(w, http.StatusBadRequest, "invalid JSON body")
			return
		}
		redirectURI, _ := body["redirectUri"].(string) //nostyle:handlerrors
		if redirectURI == "" {
			writeError(w, http.StatusBadRequest, "redirectUri is required")
			return
		}
		body["userId"] = id
		code := tailor.BuildIdPSendPasswordResetEmailScript(state.IdPConfigName)
		arg := mustJSON(body)
		result, err := state.Client.ExecScript(r.Context(), "send-password-reset-email.js", code, &arg)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = io.WriteString(w, result) //nolint:gosec // API JSON response from TestExecScript, not user-controlled HTML //nostyle:handlerrors
	}
}

func handleDeleteIdPUser(state *AppState) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !state.HasBuiltInIdP {
			writeError(w, http.StatusNotFound, "Built-in IdP is not configured")
			return
		}
		id := r.PathValue("id")
		code := tailor.BuildIdPDeleteScript(state.IdPConfigName)
		arg := mustJSON(map[string]string{"id": id})
		result, err := state.Client.ExecScript(r.Context(), "delete-idp-user.js", code, &arg)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = io.WriteString(w, result) //nolint:gosec // API JSON response from TestExecScript, not user-controlled HTML //nostyle:handlerrors
	}
}
