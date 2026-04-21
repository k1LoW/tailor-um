import { useEffect, useState, useCallback } from "react";
import { useIdPUsers } from "../hooks/useIdPUsers";
import IdPUserForm from "./IdPUserForm";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Plus, Eye, Pencil, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 50;

interface Props {
  navigate: (path: string) => void;
}

export default function IdPUserTable({ navigate }: Props) {
  const { data, loading, error, load, create, update } = useIdPUsers();
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<{
    id: string;
    name: string;
    disabled: boolean;
  } | null>(null);
  const [pageTokens, setPageTokens] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);

  const currentAfter = currentPage > 0 ? pageTokens[currentPage - 1] : undefined;

  useEffect(() => {
    load(PAGE_SIZE, undefined, currentAfter);
  }, [load, currentAfter]);

  const handleNext = useCallback(() => {
    if (data?.nextPageToken) {
      const newTokens = [...pageTokens];
      newTokens[currentPage] = data.nextPageToken;
      setPageTokens(newTokens);
      setCurrentPage((p) => p + 1);
    }
  }, [data, pageTokens, currentPage]);

  const handlePrev = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage((p) => p - 1);
    }
  }, [currentPage]);

  const reload = () => load(PAGE_SIZE, undefined, currentAfter);

  const handleCreate = async (values: { name: string; password: string }) => {
    await create(values);
    setShowForm(false);
    reload();
  };

  const handleUpdate = async (values: Record<string, unknown>) => {
    if (!editingUser) return;
    await update(editingUser.id, values);
    setEditingUser(null);
    reload();
  };

  const hasNext = !!data?.nextPageToken;
  const hasPrev = currentPage > 0;
  const showPagination = data && data.totalCount > PAGE_SIZE;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">IdP Users</h2>
          {data && (
            <p className="text-sm text-muted-foreground">
              {data.totalCount} user(s)
            </p>
          )}
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditingUser(null);
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

      {(showForm || editingUser) && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">
              {editingUser ? "Edit" : "Create"} IdP User
            </CardTitle>
          </CardHeader>
          <CardContent>
            <IdPUserForm
              mode={editingUser ? "edit" : "create"}
              initialValues={editingUser ?? undefined}
              onSubmitCreate={handleCreate}
              onSubmitUpdate={handleUpdate}
              onCancel={() => {
                setShowForm(false);
                setEditingUser(null);
              }}
            />
          </CardContent>
        </Card>
      )}

      {loading && !data && (
        <p className="text-sm text-muted-foreground">Loading...</p>
      )}

      {data && (
        <>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-mono text-xs">ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.collection.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono text-xs">
                      <button
                        onClick={() => navigate(`/idp-users/${user.id}`)}
                        className="text-primary hover:underline"
                      >
                        {user.id.substring(0, 12)}...
                      </button>
                    </TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>
                      {user.disabled ? (
                        <Badge variant="destructive">Disabled</Badge>
                      ) : (
                        <Badge variant="secondary">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/idp-users/${user.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setShowForm(false);
                            setEditingUser(user);
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
          {showPagination && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Page {currentPage + 1}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasPrev}
                  onClick={handlePrev}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasNext}
                  onClick={handleNext}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
