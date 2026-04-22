import { useEffect, useState } from "react";
import type { AppConfig, IdPUser, UserProfile } from "../api/types";
import {
  getIdPUser,
  listUserProfiles,
  updateIdPUser,
  deleteIdPUser,
  updateUserProfile,
  deleteUserProfile,
} from "../api/client";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { ChevronRight, ArrowLeft, Link2, Loader2, Pencil, Trash2 } from "lucide-react";
import IdPUserForm from "./IdPUserForm";
import UserProfileForm from "./UserProfileForm";

interface Props {
  config: AppConfig;
  id: string;
  navigate: (path: string) => void;
}

export default function IdPUserView({ config, id, navigate }: Props) {
  const [user, setUser] = useState<IdPUser | null>(null);
  const [linkedProfile, setLinkedProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingIdPUser, setEditingIdPUser] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);

  const loadData = () => {
    setLoading(true);
    setError(null);
    getIdPUser(id)
      .then(async (u) => {
        setUser(u);
        if (config.usernameField) {
          const profiles = await listUserProfiles(0, 1, config.usernameField, u.name);
          setLinkedProfile(profiles.collection[0] ?? null);
        }
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [id, config]);

  const handleUpdateIdPUser = async (values: Record<string, unknown>) => {
    await updateIdPUser(id, values);
    setEditingIdPUser(false);
    loadData();
  };

  const handleDeleteIdPUser = async () => {
    if (!confirm("Delete this IdP user?")) return;
    await deleteIdPUser(id);
    navigate("/idp-users");
  };

  const handleUpdateProfile = async (values: Record<string, unknown>) => {
    if (!linkedProfile) return;
    await updateUserProfile(linkedProfile.id, values);
    setEditingProfile(false);
    loadData();
  };

  const handleDeleteProfile = async () => {
    if (!linkedProfile || !confirm(`Delete this ${config.typeName}?`)) return;
    await deleteUserProfile(linkedProfile.id);
    setLinkedProfile(null);
    setEditingProfile(false);
  };

  const fieldNames = Object.keys(config.fields).sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <Button variant="ghost" size="sm" onClick={() => navigate("/idp-users")}>
          <ArrowLeft className="h-4 w-4" />
          IdP Users
        </Button>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground font-mono text-xs">{id}</span>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading...
        </div>
      )}

      {user && (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>IdP User Detail</CardTitle>
              {!editingIdPUser && (
                <Button variant="outline" size="sm" onClick={() => setEditingIdPUser(true)}>
                  <Pencil className="h-3 w-3" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {editingIdPUser ? (
                <div className="space-y-4">
                  <IdPUserForm
                    mode="edit"
                    initialValues={user}
                    onSubmitCreate={async () => {}}
                    onSubmitUpdate={handleUpdateIdPUser}
                    onCancel={() => setEditingIdPUser(false)}
                  />
                  <div className="pt-2 border-t">
                    <Button variant="destructive" size="sm" onClick={handleDeleteIdPUser}>
                      <Trash2 className="h-3 w-3" />
                      Delete IdP User
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-[200px_1fr] gap-y-0">
                  <div className="py-3 text-sm font-medium text-muted-foreground border-b">ID</div>
                  <div className="py-3 text-sm font-mono border-b">{user.id}</div>
                  <div className="py-3 text-sm font-medium text-muted-foreground border-b flex items-center gap-1.5">
                    Name
                    <Badge variant="secondary" className="text-[10px] py-0">
                      username
                    </Badge>
                  </div>
                  <div className="py-3 text-sm border-b">{user.name}</div>
                  <div className="py-3 text-sm font-medium text-muted-foreground">Status</div>
                  <div className="py-3 text-sm">
                    {user.disabled ? (
                      <Badge variant="destructive">Disabled</Badge>
                    ) : (
                      <Badge variant="secondary">Active</Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-1.5">
                <Link2 className="h-4 w-4 text-muted-foreground" />
                Linked {config.typeName}
              </CardTitle>
              {linkedProfile && !editingProfile && (
                <Button variant="outline" size="sm" onClick={() => setEditingProfile(true)}>
                  <Pencil className="h-3 w-3" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {linkedProfile ? (
                editingProfile ? (
                  <div className="space-y-4">
                    <UserProfileForm
                      config={config}
                      initialValues={linkedProfile}
                      onSubmit={handleUpdateProfile}
                      onCancel={() => setEditingProfile(false)}
                    />
                    <div className="pt-2 border-t">
                      <Button variant="destructive" size="sm" onClick={handleDeleteProfile}>
                        <Trash2 className="h-3 w-3" />
                        Delete {config.typeName}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-[200px_1fr] gap-y-0">
                    <div className="py-3 text-sm font-medium text-muted-foreground border-b">
                      id
                    </div>
                    <div className="py-3 text-sm font-mono border-b">
                      <button
                        onClick={() => navigate(`/user-profiles/${linkedProfile.id}`)}
                        className="text-primary hover:underline"
                      >
                        {linkedProfile.id}
                      </button>
                    </div>
                    {fieldNames.map((f) => (
                      <div key={f} className="contents">
                        <div className="py-3 text-sm font-medium text-muted-foreground border-b flex items-center gap-1.5">
                          {f}
                          {f === config.usernameField && (
                            <Badge variant="secondary" className="text-[10px] py-0">
                              username
                            </Badge>
                          )}
                        </div>
                        <div className="py-3 text-sm border-b">{formatValue(linkedProfile[f])}</div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <p className="text-sm text-muted-foreground">No linked {config.typeName} found</p>
              )}
            </CardContent>
          </Card>
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
