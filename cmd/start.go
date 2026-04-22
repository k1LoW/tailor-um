package cmd

import (
	"context"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/k1LoW/tailor-um/internal/server"
	"github.com/k1LoW/tailor-um/internal/tailor"
	"github.com/pkg/browser"
	"github.com/spf13/cobra"
)

var startCmd = &cobra.Command{
	Use:   "start",
	Short: "Start the dataplane user management server for operation",
	Long:  "Start a Web UI server for managing dataplane users in a Tailor Platform application.",
	RunE:  runStart,
}

func init() {
	rootCmd.AddCommand(startCmd)

	startCmd.Flags().String("workspace-id", "", "Tailor Platform workspace ID (env: TAILOR_WORKSPACE_ID)")
	startCmd.Flags().String("app", "", "Application name (env: TAILOR_APP_NAME)")
	startCmd.Flags().String("machine-user", "", "Machine user name (env: TAILOR_MACHINE_USER)")
	startCmd.Flags().String("token", "", "Controlplane access token (env: TAILOR_TOKEN)")
	startCmd.Flags().String("refresh-token", "", "Controlplane refresh token for auto-refresh (env: TAILOR_REFRESH_TOKEN)")
	startCmd.Flags().Int("port", 18686, "Server port")
	startCmd.Flags().String("bind", "localhost", "Bind address")
	startCmd.Flags().Bool("no-open", false, "Do not open browser automatically")
	startCmd.Flags().String("platform-url", "https://api.tailor.tech", "Tailor Platform API URL (env: PLATFORM_URL)")
}

func runStart(cmd *cobra.Command, args []string) error {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	workspaceID := flagOrEnv(cmd, "workspace-id", "TAILOR_WORKSPACE_ID")
	appName := flagOrEnv(cmd, "app", "TAILOR_APP_NAME")
	machineUser := flagOrEnv(cmd, "machine-user", "TAILOR_MACHINE_USER")
	token := flagOrEnv(cmd, "token", "TAILOR_TOKEN")
	platformURL := flagOrEnv(cmd, "platform-url", "PLATFORM_URL")
	port, _ := cmd.Flags().GetInt("port")
	bind, _ := cmd.Flags().GetString("bind")
	noOpen, _ := cmd.Flags().GetBool("no-open")

	refreshToken := flagOrEnv(cmd, "refresh-token", "TAILOR_REFRESH_TOKEN")

	// Fallback: read tokens from SDK config (~/.config/tailor-platform/config.yaml)
	if token == "" {
		slog.Info("No token provided, reading from SDK config")
		at, rt, expiresAt, err := tailor.ReadSDKTokens()
		if err != nil {
			return fmt.Errorf("no token provided and failed to read SDK config: %w", err)
		}
		token = at
		if refreshToken == "" {
			refreshToken = rt
		}
		// If token is expired, refresh proactively
		if tailor.IsTokenExpired(expiresAt) && refreshToken != "" {
			slog.Info("SDK config token is expired, refreshing proactively")
			tr, err := tailor.RefreshAccessToken(platformURL, refreshToken)
			if err != nil {
				return fmt.Errorf("token expired and refresh failed: %w", err)
			}
			token = tr.AccessToken
			if tr.RefreshToken != "" {
				refreshToken = tr.RefreshToken
			}
			newExpiresAt := time.Now().Add(time.Duration(tr.ExpiresIn) * time.Second).UTC().Format(time.RFC3339)
			if err := tailor.WriteSDKTokens(token, refreshToken, newExpiresAt); err != nil {
				slog.Warn("Failed to update SDK config tokens", "error", err)
			}
		}
	}

	if workspaceID == "" || appName == "" || machineUser == "" || token == "" {
		return fmt.Errorf("workspace-id, app, machine-user, and token are all required")
	}

	slog.Info("Connecting to Tailor Platform", "url", platformURL)

	client := tailor.NewClient(tailor.ClientConfig{
		PlatformURL:  platformURL,
		AccessToken:  token,
		RefreshToken: refreshToken,
		WorkspaceID:  workspaceID,
		OnTokenRefresh: func(at, rt, expiresAt string) {
			if err := tailor.WriteSDKTokens(at, rt, expiresAt); err != nil {
				slog.Warn("Failed to update SDK config tokens", "error", err)
			}
		},
	})
	client.SetMachineUser(machineUser)

	// 1. Get Application
	appInfo, err := client.GetApplication(ctx, appName)
	if err != nil {
		return err
	}
	slog.Info("Application found", "name", appInfo.Name, "authNamespace", appInfo.AuthNamespace)
	client.SetAuthNamespace(appInfo.AuthNamespace)

	// 2. Get UserProfile config
	upInfo, err := client.GetUserProfileConfig(ctx, appInfo.AuthNamespace)
	if err != nil {
		return err
	}
	slog.Info("UserProfile config", "namespace", upInfo.TailorDBNamespace, "type", upInfo.TypeName, "usernameField", upInfo.UsernameField, "attributesFields", upInfo.AttributesFields)

	// 3. Get TailorDB Type schema
	typeSchema, err := client.GetTailorDBType(ctx, upInfo.TailorDBNamespace, upInfo.TypeName)
	if err != nil {
		return err
	}
	slog.Info("TailorDB type loaded", "type", typeSchema.Name, "fields", len(typeSchema.Fields))

	// 4. Check Built-in IdP
	hasBuiltInIdP, idpInfo, err := client.IsBuiltInIdP(ctx, appInfo.AuthNamespace, appInfo.AuthIdpConfigName)
	if err != nil {
		return err
	}
	var idpNamespace, usernameClaim string
	if hasBuiltInIdP {
		idpNamespace = idpInfo.Namespace
		usernameClaim = idpInfo.UsernameClaim
		slog.Info("Built-in IdP detected", "config", appInfo.AuthIdpConfigName, "idpNamespace", idpNamespace, "usernameClaim", usernameClaim)
	}

	// 5. Build state and start server
	state := &server.AppState{
		Client:          client,
		AppInfo:         appInfo,
		UserProfileInfo: upInfo,
		TypeSchema:      typeSchema,
		HasBuiltInIdP:   hasBuiltInIdP,
		IdPConfigName:   idpNamespace,
		UsernameClaim:   usernameClaim,
	}

	addr := fmt.Sprintf("%s:%d", bind, port)
	handler := server.NewHandler(state)
	srv := &http.Server{
		Addr:              addr,
		Handler:           handler,
		ReadHeaderTimeout: 10 * time.Second,
	}

	ln, err := net.Listen("tcp", addr)
	if err != nil {
		return fmt.Errorf("listen %s: %w", addr, err)
	}

	go func() {
		<-ctx.Done()
		slog.Info("Shutting down server")
		srv.Close()
	}()

	url := fmt.Sprintf("http://%s", addr)
	slog.Info("Server started", "url", url)

	if !noOpen {
		_ = browser.OpenURL(url)
	}

	if err := srv.Serve(ln); err != nil && err != http.ErrServerClosed {
		return err
	}
	return nil
}

func flagOrEnv(cmd *cobra.Command, flagName, envName string) string {
	v, _ := cmd.Flags().GetString(flagName)
	if v != "" {
		return v
	}
	return os.Getenv(envName)
}
