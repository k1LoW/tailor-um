import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface Props {
  mode: "create" | "edit";
  initialValues?: { id: string; name: string; disabled: boolean };
  onSubmitCreate: (values: { name: string; password: string }) => Promise<void>;
  onSubmitUpdate: (values: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}

export default function IdPUserForm({
  mode,
  initialValues,
  onSubmitCreate,
  onSubmitUpdate,
  onCancel,
}: Props) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [password, setPassword] = useState("");
  const [disabled, setDisabled] = useState(initialValues?.disabled ?? false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (mode === "create") {
        await onSubmitCreate({ name, password });
      } else {
        const data: Record<string, unknown> = { disabled };
        if (name !== initialValues?.name) data.name = name;
        if (password) data.password = password;
        await onSubmitUpdate(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="idp-name">
          Name (email)
          <span className="text-destructive ml-1">*</span>
        </Label>
        <Input
          id="idp-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="idp-password">
          Password
          {mode === "create" && <span className="text-destructive ml-1">*</span>}
          {mode === "edit" && (
            <span className="text-muted-foreground text-xs ml-2">
              (leave empty to keep current)
            </span>
          )}
        </Label>
        <Input
          id="idp-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required={mode === "create"}
        />
      </div>
      {mode === "edit" && (
        <div className="flex items-center gap-2">
          <input
            id="idp-disabled"
            type="checkbox"
            checked={disabled}
            onChange={(e) => setDisabled(e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          <Label htmlFor="idp-disabled">Disabled</Label>
        </div>
      )}
      <div className="flex gap-2 pt-2">
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? "Saving..." : "Save"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
