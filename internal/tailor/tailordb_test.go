package tailor

import "testing"

func TestDefaultPluralForm(t *testing.T) {
	tests := []struct {
		name     string
		typeName string
		want     string
	}{
		{"empty", "", ""},
		{"regular type", "UserProfile", "userProfiles"},
		{"ends with s", "Address", "addresses"},
		{"single char upper", "A", "as"},
		{"already lowercase", "item", "items"},
		{"lowercase ends with s", "status", "statuses"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := defaultPluralForm(tt.typeName)
			if got != tt.want {
				t.Errorf("defaultPluralForm(%q) = %q, want %q", tt.typeName, got, tt.want)
			}
		})
	}
}
