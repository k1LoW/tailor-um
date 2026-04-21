package tailor

import (
	"context"
	"fmt"
	"log/slog"
	"strings"
	"unicode"

	"connectrpc.com/connect"

	tailorv1 "buf.build/gen/go/tailor-inc/tailor/protocolbuffers/go/tailor/v1"
)

type FieldInfo struct {
	Name          string              `json:"name"`
	Type          string              `json:"type"`
	Required      bool                `json:"required"`
	Array         bool                `json:"array"`
	Description   string              `json:"description,omitempty"`
	AllowedValues []string            `json:"allowedValues,omitempty"`
	Fields        map[string]*FieldInfo `json:"fields,omitempty"`
}

type TypeSchema struct {
	Name       string                `json:"name"`
	PluralForm string                `json:"pluralForm"`
	Fields     map[string]*FieldInfo `json:"fields"`
}

func (c *Client) GetTailorDBType(ctx context.Context, namespace, typeName string) (*TypeSchema, error) {
	slog.Info("RPC GetTailorDBType", "workspaceId", c.workspaceID, "namespace", namespace, "typeName", typeName)
	res, err := c.operator.GetTailorDBType(ctx, connect.NewRequest(&tailorv1.GetTailorDBTypeRequest{
		WorkspaceId:      c.workspaceID,
		NamespaceName:    namespace,
		TailordbTypeName: typeName,
	}))
	if err != nil {
		return nil, fmt.Errorf("get tailordb type %q: %w", typeName, err)
	}
	t := res.Msg.GetTailordbType()
	schema := t.GetSchema()

	pluralForm := ""
	if schema.GetSettings() != nil && schema.GetSettings().GetPluralForm() != "" {
		pluralForm = schema.GetSettings().GetPluralForm()
	}
	if pluralForm == "" {
		pluralForm = defaultPluralForm(typeName)
	}

	fields := make(map[string]*FieldInfo)
	for name, fc := range schema.GetFields() {
		fields[name] = convertFieldConfig(name, fc)
	}

	return &TypeSchema{
		Name:       typeName,
		PluralForm: pluralForm,
		Fields:     fields,
	}, nil
}

func convertFieldConfig(name string, fc *tailorv1.TailorDBType_FieldConfig) *FieldInfo {
	fi := &FieldInfo{
		Name:        name,
		Type:        fc.GetType(),
		Required:    fc.GetRequired(),
		Array:       fc.GetArray(),
		Description: fc.GetDescription(),
	}
	for _, v := range fc.GetAllowedValues() {
		fi.AllowedValues = append(fi.AllowedValues, v.GetValue())
	}
	if len(fc.GetFields()) > 0 {
		fi.Fields = make(map[string]*FieldInfo)
		for n, f := range fc.GetFields() {
			fi.Fields[n] = convertFieldConfig(n, f)
		}
	}
	return fi
}

func defaultPluralForm(typeName string) string {
	if typeName == "" {
		return ""
	}
	runes := []rune(typeName)
	runes[0] = unicode.ToLower(runes[0])
	s := string(runes)
	if strings.HasSuffix(s, "s") {
		return s + "es"
	}
	return s + "s"
}
