import { useState } from "react";
import type { AppConfig, UserProfile } from "../api/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { X, Plus } from "lucide-react";

interface Props {
  config: AppConfig;
  initialValues?: UserProfile;
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}

export default function UserProfileForm({
  config,
  initialValues,
  onSubmit,
  onCancel,
}: Props) {
  const fieldNames = Object.keys(config.fields).sort();
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const init: Record<string, unknown> = {};
    for (const f of fieldNames) {
      const fi = config.fields[f];
      const raw = initialValues?.[f];
      if (fi.array) {
        init[f] = Array.isArray(raw) ? raw : [];
      } else {
        init[f] = raw ?? "";
      }
    }
    return init;
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {fieldNames.map((f) => {
        const fi = config.fields[f];
        const utcSuffix = fi.type === "datetime" || fi.type === "date" ? ", UTC" : "";
        const typeLabel = fi.array ? `${fi.type}[]${utcSuffix}` : `${fi.type}${utcSuffix}`;
        return (
          <div key={f} className="space-y-1.5">
            <Label htmlFor={f}>
              {f}
              {fi.required && <span className="text-destructive ml-1">*</span>}
              <Badge variant="outline" className="ml-2 text-[10px] py-0 font-normal">
                {typeLabel}
              </Badge>
            </Label>
            {fi.array ? (
              <ArrayInput
                type={fi.type}
                allowedValues={fi.allowedValues}
                value={values[f] as unknown[]}
                onChange={(v) => handleChange(f, v)}
              />
            ) : (
              renderScalarInput(f, fi.type, fi.allowedValues, values[f], (v) =>
                handleChange(f, v)
              )
            )}
          </div>
        );
      })}
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

function ArrayInput({
  type,
  allowedValues,
  value,
  onChange,
}: {
  type: string;
  allowedValues?: string[];
  value: unknown[];
  onChange: (v: unknown[]) => void;
}) {
  const items = Array.isArray(value) ? value : [];

  const addItem = () => {
    onChange([...items, type === "boolean" ? false : ""]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, val: unknown) => {
    const next = [...items];
    next[index] = val;
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="flex-1">
            {renderScalarInput(`item-${i}`, type, allowedValues, item, (v) =>
              updateItem(i, v)
            )}
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(i)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addItem}>
        <Plus className="h-3 w-3" />
        Add
      </Button>
    </div>
  );
}

function renderScalarInput(
  id: string,
  type: string,
  allowedValues: string[] | undefined,
  value: unknown,
  onChange: (v: unknown) => void
) {
  if (allowedValues && allowedValues.length > 0) {
    return (
      <select
        id={id}
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <option value="">--</option>
        {allowedValues.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>
    );
  }

  switch (type) {
    case "boolean":
      return (
        <input
          id={id}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-input"
        />
      );
    case "integer":
      return (
        <Input
          id={id}
          type="number"
          step="1"
          value={value === "" ? "" : Number(value)}
          onChange={(e) =>
            onChange(e.target.value === "" ? "" : parseInt(e.target.value))
          }
        />
      );
    case "float":
      return (
        <Input
          id={id}
          type="number"
          step="any"
          value={value === "" ? "" : Number(value)}
          onChange={(e) =>
            onChange(e.target.value === "" ? "" : parseFloat(e.target.value))
          }
        />
      );
    case "datetime":
      return (
        <Input
          id={id}
          type="datetime-local"
          value={toDatetimeLocalValue(value)}
          onChange={(e) => onChange(fromDatetimeLocalValue(e.target.value))}
        />
      );
    case "date":
      return <Input id={id} type="date" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
    case "time":
      return <Input id={id} type="time" step="1" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
    default:
      return <Input id={id} type="text" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
  }
}

function toDatetimeLocalValue(v: unknown): string {
  if (!v || v === "") return "";
  const s = String(v);
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

function fromDatetimeLocalValue(v: string): string {
  if (!v) return "";
  return v + "Z";
}
