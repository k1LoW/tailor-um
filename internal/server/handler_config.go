package server

import (
	"encoding/json"
	"net/http"

	"github.com/k1LoW/tailor-um/internal/tailor"
	"github.com/k1LoW/tailor-um/version"
)

type configResponse struct {
	AppName       string                      `json:"appName"`
	TypeName      string                      `json:"typeName"`
	PluralForm    string                      `json:"pluralForm"`
	Fields        map[string]*tailor.FieldInfo `json:"fields"`
	HasBuiltInIdP bool                        `json:"hasBuiltInIdP"`
	IdPConfigName string                      `json:"idpConfigName,omitempty"`
	UsernameField string                      `json:"usernameField,omitempty"`
	UsernameClaim string                      `json:"usernameClaim,omitempty"`
}

func handleConfig(state *AppState) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		resp := configResponse{
			AppName:       state.AppInfo.Name,
			TypeName:      state.TypeSchema.Name,
			PluralForm:    state.TypeSchema.PluralForm,
			Fields:        state.TypeSchema.Fields,
			HasBuiltInIdP: state.HasBuiltInIdP,
			IdPConfigName: state.IdPConfigName,
			UsernameField: state.UserProfileInfo.UsernameField,
			UsernameClaim: state.UsernameClaim,
		}
		writeJSON(w, http.StatusOK, resp)
	}
}

func handleVersion() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{
			"name":     version.Name,
			"version":  version.Version,
			"revision": version.Revision,
		})
	}
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}
