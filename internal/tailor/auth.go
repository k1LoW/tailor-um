package tailor

import (
	"context"
	"fmt"
	"log/slog"
	"net/url"
	"strings"

	"connectrpc.com/connect"

	tailorv1 "buf.build/gen/go/tailor-inc/tailor/protocolbuffers/go/tailor/v1"
)

type UserProfileInfo struct {
	TailorDBNamespace string
	TypeName          string
	UsernameField     string
	AttributesFields  []string
}

func (c *Client) UserProfileConfig(ctx context.Context, namespace string) (*UserProfileInfo, error) {
	slog.Info("RPC GetUserProfileConfig", "workspaceId", c.workspaceID, "namespace", namespace)
	res, err := c.operator.GetUserProfileConfig(ctx, connect.NewRequest(&tailorv1.GetUserProfileConfigRequest{
		WorkspaceId:   c.workspaceID,
		NamespaceName: namespace,
	}))
	if err != nil {
		return nil, fmt.Errorf("get user profile config: %w", err)
	}
	cfg := res.Msg.GetUserProfileProviderConfig()
	if cfg == nil || cfg.GetConfig() == nil {
		return nil, fmt.Errorf("user profile provider config is empty")
	}
	tdb := cfg.GetConfig().GetTailordb()
	if tdb == nil {
		return nil, fmt.Errorf("user profile provider config is not TailorDB type")
	}
	return &UserProfileInfo{
		TailorDBNamespace: tdb.GetNamespace(),
		TypeName:          tdb.GetType(),
		UsernameField:     tdb.GetUsernameField(),
		AttributesFields:  tdb.GetAttributesFields(),
	}, nil
}

type IdPInfo struct {
	Namespace     string
	UsernameClaim string
}

// IsBuiltInIdP checks whether the given IdP config name corresponds to a Built-in IdP.
// Returns the IdP namespace and username_claim extracted from the OIDC config.
func (c *Client) IsBuiltInIdP(ctx context.Context, authNamespace, idpConfigName string) (bool, *IdPInfo, error) {
	if idpConfigName == "" {
		return false, nil, nil
	}
	slog.Info("RPC ListAuthIDPConfigs", "workspaceId", c.workspaceID, "namespace", authNamespace, "idpConfigName", idpConfigName)
	res, err := c.operator.ListAuthIDPConfigs(ctx, connect.NewRequest(&tailorv1.ListAuthIDPConfigsRequest{
		WorkspaceId:   c.workspaceID,
		NamespaceName: authNamespace,
	}))
	if err != nil {
		return false, nil, fmt.Errorf("list auth idp configs: %w", err)
	}
	for _, cfg := range res.Msg.GetIdpConfigs() {
		if cfg.GetName() != idpConfigName {
			continue
		}
		if cfg.GetAuthType() != tailorv1.AuthIDPConfig_AUTH_TYPE_OIDC {
			return false, nil, nil
		}
		oidcCfg := cfg.GetConfig().GetOidc()
		if oidcCfg == nil {
			return false, nil, nil
		}
		providerURL := oidcCfg.GetProviderUrl()
		slog.Debug("OIDC provider URL", "url", providerURL)
		ns := extractIdPNamespace(providerURL)
		if ns == "" {
			return false, nil, nil
		}
		return true, &IdPInfo{
			Namespace:     ns,
			UsernameClaim: oidcCfg.GetUsernameClaim(),
		}, nil
	}
	return false, nil, nil
}

// extractIdPNamespace extracts the IdP namespace from a Built-in IdP provider URL.
// Provider URL format: https://<host>/<namespace>/.well-known/openid-configuration
// or: https://<host>/idp/<namespace>/...
func extractIdPNamespace(providerURL string) string {
	u, err := url.Parse(providerURL)
	if err != nil {
		return ""
	}
	parts := strings.Split(strings.Trim(u.Path, "/"), "/")
	for i, p := range parts {
		if p == ".well-known" && i > 0 {
			return parts[i-1]
		}
	}
	// Fallback: try last meaningful path segment
	for i := len(parts) - 1; i >= 0; i-- {
		if parts[i] != "" && parts[i] != ".well-known" && parts[i] != "openid-configuration" {
			return parts[i]
		}
	}
	return ""
}
