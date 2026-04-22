import { useEffect, useState } from "react";
import type { AppConfig, UserProfile } from "../api/types";
import { useUserProfiles } from "../hooks/useUserProfiles";
import UserProfileForm from "./UserProfileForm";
import Pagination from "./Pagination";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Plus, Eye, Pencil } from "lucide-react";

const PAGE_SIZE = 50;

interface Props {
  config: AppConfig;
  navigate: (path: string) => void;
}

export default function UserProfileTable({ config, navigate }: Props) {
  const { data, loading, error, load, create, update } = useUserProfiles();
  const [showForm, setShowForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [page, setPage] = useState(0);

  useEffect(() => {
    load(page, PAGE_SIZE);
  }, [load, page]);

  const fieldNames = Object.keys(config.fields).sort();

  const handleCreate = async (values: Record<string, unknown>) => {
    await create(values);
    setShowForm(false);
    load(page, PAGE_SIZE);
  };

  const handleUpdate = async (values: Record<string, unknown>) => {
    if (!editingProfile) return;
    await update(editingProfile.id, values);
    setEditingProfile(null);
    load(page, PAGE_SIZE);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{config.typeName}</h2>
          {data && <p className="text-sm text-muted-foreground">{data.totalCount} record(s)</p>}
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditingProfile(null);
            setShowForm(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Create
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {(showForm || editingProfile) && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">
              {editingProfile ? "Edit" : "Create"} {config.typeName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <UserProfileForm
              config={config}
              initialValues={editingProfile ?? undefined}
              onSubmit={editingProfile ? handleUpdate : handleCreate}
              onCancel={() => {
                setShowForm(false);
                setEditingProfile(null);
              }}
            />
          </CardContent>
        </Card>
      )}

      {loading && !data && <p className="text-sm text-muted-foreground">Loading...</p>}

      {data && (
        <>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-mono text-xs">ID</TableHead>
                  {fieldNames.map((f) => (
                    <TableHead key={f}>
                      {f}
                      {f === config.usernameField && config.hasBuiltInIdP && (
                        <Badge variant="secondary" className="ml-1.5 text-[10px] py-0">
                          username
                        </Badge>
                      )}
                    </TableHead>
                  ))}
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.collection.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-xs">
                      <button
                        onClick={() => navigate(`/user-profiles/${row.id}`)}
                        className="text-primary hover:underline"
                      >
                        {row.id.substring(0, 8)}...
                      </button>
                    </TableCell>
                    {fieldNames.map((f) => (
                      <TableCell key={f}>{formatValue(row[f])}</TableCell>
                    ))}
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/user-profiles/${row.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setShowForm(false);
                            setEditingProfile(row);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            totalCount={data.totalCount}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}
