package tailor

import "testing"

func TestExtractIdPNamespace(t *testing.T) {
	tests := []struct {
		name        string
		providerURL string
		want        string
	}{
		{
			"well-known format",
			"https://host.example.com/my-namespace/.well-known/openid-configuration",
			"my-namespace",
		},
		{
			"well-known with deeper path",
			"https://host.example.com/idp/my-ns/.well-known/openid-configuration",
			"my-ns",
		},
		{
			"no well-known fallback",
			"https://host.example.com/idp/my-ns/some-path",
			"some-path",
		},
		{
			"empty URL",
			"",
			"",
		},
		{
			"root only",
			"https://host.example.com/",
			"",
		},
		{
			"single segment",
			"https://host.example.com/my-ns",
			"my-ns",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := extractIdPNamespace(tt.providerURL)
			if got != tt.want {
				t.Errorf("extractIdPNamespace(%q) = %q, want %q", tt.providerURL, got, tt.want)
			}
		})
	}
}
