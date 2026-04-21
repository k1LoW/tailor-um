package tailor

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"strings"
	"sync"

	"connectrpc.com/connect"

	tailorv1 "buf.build/gen/go/tailor-inc/tailor/protocolbuffers/go/tailor/v1"
	"buf.build/gen/go/tailor-inc/tailor/connectrpc/go/tailor/v1/tailorv1connect"
)

type Client struct {
	operator    tailorv1connect.OperatorServiceClient
	workspaceID string
	authNS      string
	machineUser string
}

type ClientConfig struct {
	PlatformURL  string
	AccessToken  string
	RefreshToken string
	WorkspaceID  string
}

func NewClient(cfg ClientConfig) *Client {
	interceptor := newAutoRefreshInterceptor(cfg.PlatformURL, cfg.AccessToken, cfg.RefreshToken)
	return &Client{
		operator: tailorv1connect.NewOperatorServiceClient(
			&http.Client{},
			cfg.PlatformURL,
			connect.WithInterceptors(interceptor),
		),
		workspaceID: cfg.WorkspaceID,
	}
}

func (c *Client) SetAuthNamespace(ns string) {
	c.authNS = ns
}

func (c *Client) SetMachineUser(mu string) {
	c.machineUser = mu
}

func (c *Client) WorkspaceID() string {
	return c.workspaceID
}

// ExecScript executes a JavaScript code via TestExecScript RPC.
func (c *Client) ExecScript(ctx context.Context, name, code string, arg *string) (string, error) {
	req := &tailorv1.TestExecScriptRequest{
		WorkspaceId: c.workspaceID,
		Name:        name,
		Code:        code,
		Invoker: &tailorv1.AuthInvoker{
			Namespace:       c.authNS,
			MachineUserName: c.machineUser,
		},
	}
	if arg != nil {
		req.Arg = arg
	}
	slog.Info("RPC TestExecScript", "name", name)
	res, err := c.operator.TestExecScript(ctx, connect.NewRequest(req))
	if err != nil {
		slog.Error("RPC TestExecScript failed", "name", name, "error", err)
		return "", err
	}
	return res.Msg.GetResult(), nil
}

// autoRefreshInterceptor handles bearer token auth with automatic refresh on unauthenticated errors.
type autoRefreshInterceptor struct {
	platformURL  string
	token        string
	refreshToken string
	mu           sync.Mutex
}

func newAutoRefreshInterceptor(platformURL, token, refreshToken string) *autoRefreshInterceptor {
	return &autoRefreshInterceptor{
		platformURL:  platformURL,
		token:        token,
		refreshToken: refreshToken,
	}
}

func (i *autoRefreshInterceptor) WrapUnary(next connect.UnaryFunc) connect.UnaryFunc {
	return func(ctx context.Context, req connect.AnyRequest) (connect.AnyResponse, error) {
		i.mu.Lock()
		token := i.token
		i.mu.Unlock()

		req.Header().Set("Authorization", "Bearer "+token)
		resp, err := next(ctx, req)
		if err != nil && i.isUnauthenticated(err) {
			if i.refreshToken == "" {
				return nil, fmt.Errorf("%w (no refresh token available, please provide a valid token via --token or TAILOR_TOKEN)", err)
			}
			slog.Info("Token rejected, attempting refresh")
			newToken, refreshErr := i.doRefresh()
			if refreshErr != nil {
				return nil, fmt.Errorf("%w (token refresh also failed: %v, please provide a valid token via --token or TAILOR_TOKEN)", err, refreshErr)
			}
			req.Header().Set("Authorization", "Bearer "+newToken)
			return next(ctx, req)
		}
		return resp, err
	}
}

func (i *autoRefreshInterceptor) doRefresh() (string, error) {
	i.mu.Lock()
	defer i.mu.Unlock()

	tr, err := RefreshAccessToken(i.platformURL, i.refreshToken)
	if err != nil {
		return "", err
	}
	i.token = tr.AccessToken
	if tr.RefreshToken != "" {
		i.refreshToken = tr.RefreshToken
	}
	slog.Info("Access token refreshed successfully")
	return i.token, nil
}

func (i *autoRefreshInterceptor) isUnauthenticated(err error) bool {
	s := err.Error()
	return strings.Contains(s, "unauthenticated") || strings.Contains(s, "Unauthenticated")
}

func (i *autoRefreshInterceptor) WrapStreamingClient(next connect.StreamingClientFunc) connect.StreamingClientFunc {
	return next
}

func (i *autoRefreshInterceptor) WrapStreamingHandler(next connect.StreamingHandlerFunc) connect.StreamingHandlerFunc {
	return next
}
