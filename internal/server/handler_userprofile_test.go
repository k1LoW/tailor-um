package server

import (
	"encoding/json"
	"testing"

	"github.com/k1LoW/tailor-um/internal/tailor"
)

func TestSortedFieldNames(t *testing.T) {
	tests := []struct {
		name   string
		fields map[string]*tailor.FieldInfo
		want   []string
	}{
		{"nil map", nil, []string{}},
		{"empty map", map[string]*tailor.FieldInfo{}, []string{}},
		{"single", map[string]*tailor.FieldInfo{"alpha": {}}, []string{"alpha"}},
		{
			"multiple unsorted",
			map[string]*tailor.FieldInfo{
				"charlie": {},
				"alpha":   {},
				"bravo":   {},
			},
			[]string{"alpha", "bravo", "charlie"},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := sortedFieldNames(tt.fields)
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
}

func TestMustJSON(t *testing.T) {
	tests := []struct {
		name  string
		input any
		want  string
	}{
		{"string", "hello", `"hello"`},
		{"int", 42, `42`},
		{"map", map[string]string{"id": "123"}, `{"id":"123"}`},
		{"nil", nil, `null`},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := mustJSON(tt.input)
			if got != tt.want {
				t.Errorf("mustJSON(%v) = %q, want %q", tt.input, got, tt.want)
			}
		})
	}

	t.Run("valid JSON output", func(t *testing.T) {
		got := mustJSON(map[string]any{"a": 1, "b": "two"})
		var m map[string]any
		if err := json.Unmarshal([]byte(got), &m); err != nil {
			t.Errorf("mustJSON produced invalid JSON: %v", err)
		}
	})
}
