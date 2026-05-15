package tailor

import (
	"context"
	"log/slog"

	tailorv1 "buf.build/gen/go/tailor-inc/tailor/protocolbuffers/go/tailor/v1"
	"connectrpc.com/connect"

	tailorclient "github.com/k1LoW/tailor-client-go"
)

type Client struct {
	*tailorclient.Client
	workspaceID string
	authNS      string
	machineUser string
}

func NewClient(cc *tailorclient.Client, workspaceID string) *Client {
	return &Client{
		Client:      cc,
		workspaceID: workspaceID,
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
	res, err := c.TestExecScript(ctx, connect.NewRequest(req))
	if err != nil {
		slog.Error("RPC TestExecScript failed", "name", name, "error", err)
		return "", err
	}
	return res.Msg.GetResult(), nil
}
