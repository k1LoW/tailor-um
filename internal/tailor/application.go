package tailor

import (
	"context"
	"fmt"
	"log/slog"

	"connectrpc.com/connect"

	tailorv1 "buf.build/gen/go/tailor-inc/tailor/protocolbuffers/go/tailor/v1"
)

type AppInfo struct {
	Name             string
	AuthNamespace    string
	AuthIdpConfigName string
	URL              string
}

func (c *Client) GetApplication(ctx context.Context, appName string) (*AppInfo, error) {
	slog.Info("RPC GetApplication", "workspaceId", c.workspaceID, "appName", appName)
	res, err := c.operator.GetApplication(ctx, connect.NewRequest(&tailorv1.GetApplicationRequest{
		WorkspaceId:     c.workspaceID,
		ApplicationName: appName,
	}))
	if err != nil {
		return nil, fmt.Errorf("get application %q: %w", appName, err)
	}
	app := res.Msg.GetApplication()
	return &AppInfo{
		Name:             app.GetName(),
		AuthNamespace:    app.GetAuthNamespace(),
		AuthIdpConfigName: app.GetAuthIdpConfigName(),
		URL:              app.GetUrl(),
	}, nil
}
