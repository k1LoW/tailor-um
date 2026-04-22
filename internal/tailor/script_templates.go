package tailor

import (
	"fmt"
	"strings"
)

// BuildListScript generates JS code for listing UserProfile records via tailordb.Client SQL.
// Supports optional exact-match search via args.searchField and args.searchValue.
func BuildListScript(namespace, typeName string, fields []string) string {
	cols := "id, " + strings.Join(quoteFields(fields), ", ")
	return fmt.Sprintf(`export default async (args) => {
  const client = new tailordb.Client({ namespace: "%s" });
  await client.connect();
  const size = args.size || 50;
  const offset = (args.page || 0) * size;
  let where = "";
  const params = [];
  if (args.searchField && args.searchValue !== undefined && args.searchValue !== "") {
    where = " WHERE " + args.searchField + " = $1";
    params.push(args.searchValue);
  }
  const countResult = await client.queryObject("SELECT count(*) as cnt FROM %s" + where, params);
  const totalCount = countResult.rows.length > 0 ? Number(countResult.rows[0].cnt) : 0;
  const limitParams = [...params];
  const pi = params.length + 1;
  limitParams.push(size);
  limitParams.push(offset);
  const result = await client.queryObject("SELECT %s FROM %s" + where + " ORDER BY id LIMIT $" + pi + " OFFSET $" + (pi + 1), limitParams);
  await client.end();
  return { collection: result.rows, totalCount };
};`, namespace, typeName, cols, typeName)
}

// BuildGetScript generates JS code for getting a single UserProfile record by ID.
func BuildGetScript(namespace, typeName string, fields []string) string {
	cols := "id, " + strings.Join(quoteFields(fields), ", ")
	return fmt.Sprintf(`export default async (args) => {
  const client = new tailordb.Client({ namespace: "%s" });
  await client.connect();
  const result = await client.queryObject("SELECT %s FROM %s WHERE id = $1", [args.id]);
  await client.end();
  return result.rows.length > 0 ? result.rows[0] : null;
};`, namespace, cols, typeName)
}

// BuildCreateScript generates JS code for creating a UserProfile record.
func BuildCreateScript(namespace, typeName string, fields []string) string {
	return fmt.Sprintf(`export default async (args) => {
  const client = new tailordb.Client({ namespace: "%s" });
  await client.connect();
  const fields = %s;
  const cols = [];
  const vals = [];
  const params = [];
  let i = 1;
  for (const f of fields) {
    if (args[f] !== undefined && args[f] !== "") {
      cols.push(f);
      params.push("$" + i);
      vals.push(args[f]);
      i++;
    }
  }
  const sql = "INSERT INTO %s (" + cols.join(", ") + ") VALUES (" + params.join(", ") + ") RETURNING id, " + cols.join(", ");
  const result = await client.queryObject(sql, vals);
  await client.end();
  return result.rows[0];
};`, namespace, fieldArrayLiteral(fields), typeName)
}

// BuildUpdateScript generates JS code for updating a UserProfile record.
func BuildUpdateScript(namespace, typeName string, fields []string) string {
	return fmt.Sprintf(`export default async (args) => {
  const client = new tailordb.Client({ namespace: "%s" });
  await client.connect();
  const fields = %s;
  const sets = [];
  const vals = [];
  let i = 1;
  for (const f of fields) {
    if (args[f] !== undefined) {
      sets.push(f + " = $" + i);
      vals.push(args[f]);
      i++;
    }
  }
  vals.push(args.id);
  const sql = "UPDATE %s SET " + sets.join(", ") + " WHERE id = $" + i + " RETURNING id, " + fields.join(", ");
  const result = await client.queryObject(sql, vals);
  await client.end();
  return result.rows[0];
};`, namespace, fieldArrayLiteral(fields), typeName)
}

// BuildDeleteScript generates JS code for deleting a UserProfile record.
func BuildDeleteScript(namespace, typeName string) string {
	return fmt.Sprintf(`export default async (args) => {
  const client = new tailordb.Client({ namespace: "%s" });
  await client.connect();
  const result = await client.queryObject("DELETE FROM %s WHERE id = $1 RETURNING id", [args.id]);
  await client.end();
  return result.rows[0];
};`, namespace, typeName)
}

// BuildIdPListScript generates JS code for listing IdP users.
// Supports optional search via args.searchName and cursor pagination via args.after.
func BuildIdPListScript(idpConfigName string) string {
	return fmt.Sprintf(`export default async (args) => {
  const client = new tailor.idp.Client({ namespace: "%s" });
  const opts = { first: args.first || 50 };
  if (args.after) {
    opts.after = args.after;
  }
  if (args.searchName && args.searchName !== "") {
    opts.query = { names: [args.searchName] };
  }
  return await client.users(opts);
};`, idpConfigName)
}

// BuildIdPGetScript generates JS code for getting a single IdP user.
func BuildIdPGetScript(idpConfigName string) string {
	return fmt.Sprintf(`export default async (args) => {
  const client = new tailor.idp.Client({ namespace: "%s" });
  return await client.user(args.id);
};`, idpConfigName)
}

// BuildIdPCreateScript generates JS code for creating an IdP user.
func BuildIdPCreateScript(idpConfigName string) string {
	return fmt.Sprintf(`export default async (args) => {
  const client = new tailor.idp.Client({ namespace: "%s" });
  return await client.createUser({ name: args.name, password: args.password });
};`, idpConfigName)
}

// BuildIdPUpdateScript generates JS code for updating an IdP user.
func BuildIdPUpdateScript(idpConfigName string) string {
	return fmt.Sprintf(`export default async (args) => {
  const client = new tailor.idp.Client({ namespace: "%s" });
  const input = {};
  if (args.name !== undefined) input.name = args.name;
  if (args.password !== undefined) input.password = args.password;
  if (args.disabled !== undefined) input.disabled = args.disabled;
  return await client.updateUser(args.id, input);
};`, idpConfigName)
}

// BuildIdPDeleteScript generates JS code for deleting an IdP user.
func BuildIdPDeleteScript(idpConfigName string) string {
	return fmt.Sprintf(`export default async (args) => {
  const client = new tailor.idp.Client({ namespace: "%s" });
  return await client.deleteUser(args.id);
};`, idpConfigName)
}

// BuildIdPSendPasswordResetEmailScript generates JS code for sending a password reset email.
func BuildIdPSendPasswordResetEmailScript(idpConfigName string) string {
	return fmt.Sprintf(`export default async (args) => {
  if (!args.userId) throw new Error("userId is required");
  if (!args.redirectUri) throw new Error("redirectUri is required");
  const client = new tailor.idp.Client({ namespace: "%s" });
  const input = { userId: args.userId, redirectUri: args.redirectUri };
  if (args.fromName !== undefined && args.fromName !== "") input.fromName = args.fromName;
  if (args.subject !== undefined && args.subject !== "") input.subject = args.subject;
  await client.sendPasswordResetEmail(input);
  return { ok: true };
};`, idpConfigName)
}

func quoteFields(fields []string) []string {
	out := make([]string, len(fields))
	copy(out, fields)
	return out
}

func fieldArrayLiteral(fields []string) string {
	quoted := make([]string, len(fields))
	for i, f := range fields {
		quoted[i] = fmt.Sprintf(`"%s"`, f)
	}
	return "[" + strings.Join(quoted, ", ") + "]"
}
