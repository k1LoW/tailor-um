package server

import (
	"github.com/k1LoW/tailor-um/internal/tailor"
)

type AppState struct {
	Client          *tailor.Client
	AppInfo         *tailor.AppInfo
	UserProfileInfo *tailor.UserProfileInfo
	TypeSchema      *tailor.TypeSchema
	HasBuiltInIdP   bool
	IdPConfigName   string
	UsernameClaim   string
}
