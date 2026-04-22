package server

import (
	"encoding/json"
	"io"
	"net/http"
	"sort"

	"github.com/k1LoW/tailor-um/internal/tailor"
)

func handleListUserProfiles(state *AppState) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		fields := sortedFieldNames(state.TypeSchema.Fields)
		code := tailor.BuildListScript(state.UserProfileInfo.TailorDBNamespace, state.TypeSchema.Name, fields)
		arg := r.URL.Query().Get("arg")
		if arg == "" {
			arg = `{"size":50,"page":0}`
		}
		result, err := state.Client.ExecScript(r.Context(), "list-user-profiles.js", code, &arg)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = io.WriteString(w, result) //nolint:gosec // API JSON response from TestExecScript, not user-controlled HTML
	}
}

func handleGetUserProfile(state *AppState) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")
		fields := sortedFieldNames(state.TypeSchema.Fields)
		code := tailor.BuildGetScript(state.UserProfileInfo.TailorDBNamespace, state.TypeSchema.Name, fields)
		arg := mustJSON(map[string]string{"id": id})
		result, err := state.Client.ExecScript(r.Context(), "get-user-profile.js", code, &arg)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = io.WriteString(w, result) //nolint:gosec // API JSON response from TestExecScript, not user-controlled HTML
	}
}

func handleCreateUserProfile(state *AppState) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var body map[string]any
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			writeError(w, http.StatusBadRequest, "invalid JSON body")
			return
		}
		fields := sortedFieldNames(state.TypeSchema.Fields)
		code := tailor.BuildCreateScript(state.UserProfileInfo.TailorDBNamespace, state.TypeSchema.Name, fields)
		arg := mustJSON(body)
		result, err := state.Client.ExecScript(r.Context(), "create-user-profile.js", code, &arg)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		_, _ = io.WriteString(w, result) //nolint:gosec // API JSON response from TestExecScript, not user-controlled HTML
	}
}

func handleUpdateUserProfile(state *AppState) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")
		var body map[string]any
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			writeError(w, http.StatusBadRequest, "invalid JSON body")
			return
		}
		body["id"] = id
		fields := sortedFieldNames(state.TypeSchema.Fields)
		code := tailor.BuildUpdateScript(state.UserProfileInfo.TailorDBNamespace, state.TypeSchema.Name, fields)
		arg := mustJSON(body)
		result, err := state.Client.ExecScript(r.Context(), "update-user-profile.js", code, &arg)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = io.WriteString(w, result) //nolint:gosec // API JSON response from TestExecScript, not user-controlled HTML
	}
}

func handleDeleteUserProfile(state *AppState) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")
		code := tailor.BuildDeleteScript(state.UserProfileInfo.TailorDBNamespace, state.TypeSchema.Name)
		arg := mustJSON(map[string]string{"id": id})
		result, err := state.Client.ExecScript(r.Context(), "delete-user-profile.js", code, &arg)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = io.WriteString(w, result) //nolint:gosec // API JSON response from TestExecScript, not user-controlled HTML
	}
}

func sortedFieldNames(fields map[string]*tailor.FieldInfo) []string {
	names := make([]string, 0, len(fields))
	for n := range fields {
		names = append(names, n)
	}
	sort.Strings(names)
	return names
}

func mustJSON(v any) string {
	b, _ := json.Marshal(v)
	return string(b)
}
