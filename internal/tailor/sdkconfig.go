package tailor

import (
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"sync"

	"github.com/goccy/go-yaml"
)

// SDKConfig represents the Tailor SDK config.yaml (v1 format).
// v2 with keyring storage is not supported; tailor-um reads/writes the file-based v1 format.
type SDKConfig struct {
	Version     int                       `yaml:"version"`
	Users       map[string]*SDKUserTokens `yaml:"users"`
	Profiles    yaml.MapSlice             `yaml:"profiles,omitempty"`
	CurrentUser *string                   `yaml:"current_user"`
}

type SDKUserTokens struct {
	AccessToken    string  `yaml:"access_token"`
	RefreshToken   string  `yaml:"refresh_token,omitempty"`
	TokenExpiresAt string  `yaml:"token_expires_at"`
	Storage        *string `yaml:"storage,omitempty"`
}

var sdkConfigMu sync.Mutex

func sdkConfigFilePath() string {
	if xdg := os.Getenv("XDG_CONFIG_HOME"); xdg != "" {
		return filepath.Join(xdg, "tailor-platform", "config.yaml")
	}
	home, _ := os.UserHomeDir()
	return filepath.Join(home, ".config", "tailor-platform", "config.yaml")
}

// ReadSDKTokens reads access_token, refresh_token, and token_expires_at from the SDK config for the current_user.
func ReadSDKTokens() (accessToken, refreshToken, tokenExpiresAt string, err error) {
	cfg, err := readSDKConfig()
	if err != nil {
		return "", "", "", err
	}
	if cfg.CurrentUser == nil || *cfg.CurrentUser == "" {
		return "", "", "", fmt.Errorf("current_user is not set in %s", sdkConfigFilePath())
	}
	currentUser := *cfg.CurrentUser
	user, ok := cfg.Users[currentUser]
	if !ok {
		return "", "", "", fmt.Errorf("user %q not found in %s", currentUser, sdkConfigFilePath())
	}
	if user.Storage != nil && *user.Storage == "keyring" {
		return "", "", "", fmt.Errorf("user %q uses keyring storage which is not supported by tailor-um, please use --token flag", currentUser)
	}
	slog.Info("Using SDK config tokens", "user", currentUser, "configPath", sdkConfigFilePath())
	return user.AccessToken, user.RefreshToken, user.TokenExpiresAt, nil
}

// WriteSDKTokens updates the access_token, refresh_token, and token_expires_at for the current_user.
func WriteSDKTokens(accessToken, refreshToken, tokenExpiresAt string) error {
	sdkConfigMu.Lock()
	defer sdkConfigMu.Unlock()

	cfg, err := readSDKConfig()
	if err != nil {
		return err
	}
	if cfg.CurrentUser == nil || *cfg.CurrentUser == "" {
		return fmt.Errorf("current_user is not set")
	}
	currentUser := *cfg.CurrentUser
	user, ok := cfg.Users[currentUser]
	if !ok {
		return fmt.Errorf("user %q not found", currentUser)
	}
	user.AccessToken = accessToken
	user.RefreshToken = refreshToken
	user.TokenExpiresAt = tokenExpiresAt

	return writeSDKConfig(cfg)
}

func readSDKConfig() (*SDKConfig, error) {
	path := sdkConfigFilePath()
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read SDK config %s: %w", path, err)
	}
	var cfg SDKConfig
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, fmt.Errorf("parse SDK config: %w", err)
	}
	return &cfg, nil
}

func writeSDKConfig(cfg *SDKConfig) error {
	path := sdkConfigFilePath()
	data, err := yaml.Marshal(cfg)
	if err != nil {
		return fmt.Errorf("marshal SDK config: %w", err)
	}
	if err := os.WriteFile(path, data, 0600); err != nil {
		return fmt.Errorf("write SDK config %s: %w", path, err)
	}
	slog.Info("SDK config tokens updated", "path", path)
	return nil
}
