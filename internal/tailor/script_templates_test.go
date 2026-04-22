package tailor

import (
	"strings"
	"testing"
)

func TestQuoteFields(t *testing.T) {
	tests := []struct {
		name   string
		input  []string
		want   []string
	}{
		{"empty", []string{}, []string{}},
		{"single", []string{"name"}, []string{"name"}},
		{"multiple", []string{"a", "b", "c"}, []string{"a", "b", "c"}},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := quoteFields(tt.input)
			if len(got) != len(tt.want) {
				t.Fatalf("len = %d, want %d", len(got), len(tt.want))
			}
			for i := range got {
				if got[i] != tt.want[i] {
					t.Errorf("got[%d] = %q, want %q", i, got[i], tt.want[i])
				}
			}
		})
	}

	t.Run("does not mutate original", func(t *testing.T) {
		orig := []string{"x", "y"}
		copied := quoteFields(orig)
		copied[0] = "changed"
		if orig[0] != "x" {
			t.Error("quoteFields mutated the original slice")
		}
	})
}

func TestFieldArrayLiteral(t *testing.T) {
	tests := []struct {
		name  string
		input []string
		want  string
	}{
		{"empty", []string{}, `[]`},
		{"single", []string{"name"}, `["name"]`},
		{"multiple", []string{"a", "b", "c"}, `["a", "b", "c"]`},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := fieldArrayLiteral(tt.input)
			if got != tt.want {
				t.Errorf("got %q, want %q", got, tt.want)
			}
		})
	}
}

func TestBuildListScript(t *testing.T) {
	script := BuildListScript("ns1", "UserProfile", []string{"email", "role"})

	checks := []string{
		`namespace: "ns1"`,
		"FROM UserProfile",
		"id, email, role",
	}
	for _, c := range checks {
		if !strings.Contains(script, c) {
			t.Errorf("script missing %q", c)
		}
	}
}

func TestBuildGetScript(t *testing.T) {
	script := BuildGetScript("ns1", "UserProfile", []string{"email"})

	checks := []string{
		`namespace: "ns1"`,
		"SELECT id, email FROM UserProfile",
		"WHERE id = $1",
	}
	for _, c := range checks {
		if !strings.Contains(script, c) {
			t.Errorf("script missing %q", c)
		}
	}
}

func TestBuildCreateScript(t *testing.T) {
	script := BuildCreateScript("ns1", "UserProfile", []string{"email", "role"})

	checks := []string{
		`namespace: "ns1"`,
		`["email", "role"]`,
		"INSERT INTO UserProfile",
		"RETURNING id",
	}
	for _, c := range checks {
		if !strings.Contains(script, c) {
			t.Errorf("script missing %q", c)
		}
	}
}

func TestBuildUpdateScript(t *testing.T) {
	script := BuildUpdateScript("ns1", "UserProfile", []string{"email", "role"})

	checks := []string{
		`namespace: "ns1"`,
		`["email", "role"]`,
		"UPDATE UserProfile SET",
		"RETURNING id",
	}
	for _, c := range checks {
		if !strings.Contains(script, c) {
			t.Errorf("script missing %q", c)
		}
	}
}

func TestBuildDeleteScript(t *testing.T) {
	script := BuildDeleteScript("ns1", "UserProfile")

	checks := []string{
		`namespace: "ns1"`,
		"DELETE FROM UserProfile WHERE id = $1",
		"RETURNING id",
	}
	for _, c := range checks {
		if !strings.Contains(script, c) {
			t.Errorf("script missing %q", c)
		}
	}
}

func TestBuildIdPListScript(t *testing.T) {
	script := BuildIdPListScript("myIdP")

	checks := []string{
		`namespace: "myIdP"`,
		"client.users(",
	}
	for _, c := range checks {
		if !strings.Contains(script, c) {
			t.Errorf("script missing %q", c)
		}
	}
}

func TestBuildIdPGetScript(t *testing.T) {
	script := BuildIdPGetScript("myIdP")
	if !strings.Contains(script, `namespace: "myIdP"`) {
		t.Error("missing namespace")
	}
	if !strings.Contains(script, "client.user(args.id)") {
		t.Error("missing client.user call")
	}
}

func TestBuildIdPCreateScript(t *testing.T) {
	script := BuildIdPCreateScript("myIdP")
	if !strings.Contains(script, `namespace: "myIdP"`) {
		t.Error("missing namespace")
	}
	if !strings.Contains(script, "client.createUser(") {
		t.Error("missing createUser call")
	}
}

func TestBuildIdPUpdateScript(t *testing.T) {
	script := BuildIdPUpdateScript("myIdP")
	if !strings.Contains(script, `namespace: "myIdP"`) {
		t.Error("missing namespace")
	}
	if !strings.Contains(script, "client.updateUser(args.id") {
		t.Error("missing updateUser call")
	}
}

func TestBuildIdPSendPasswordResetEmailScript(t *testing.T) {
	script := BuildIdPSendPasswordResetEmailScript("myIdP")
	if !strings.Contains(script, `namespace: "myIdP"`) {
		t.Error("missing namespace")
	}
	if !strings.Contains(script, "client.sendPasswordResetEmail(input)") {
		t.Error("missing sendPasswordResetEmail call")
	}
	if !strings.Contains(script, "input.fromName") {
		t.Error("missing fromName handling")
	}
	if !strings.Contains(script, "input.subject") {
		t.Error("missing subject handling")
	}
	if !strings.Contains(script, "return { ok: true }") {
		t.Error("missing stable JSON return value")
	}
}

func TestBuildIdPDeleteScript(t *testing.T) {
	script := BuildIdPDeleteScript("myIdP")
	if !strings.Contains(script, `namespace: "myIdP"`) {
		t.Error("missing namespace")
	}
	if !strings.Contains(script, "client.deleteUser(args.id)") {
		t.Error("missing deleteUser call")
	}
}
