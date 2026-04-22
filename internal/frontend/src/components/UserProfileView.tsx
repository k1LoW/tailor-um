import { useEffect, useState } from "react";
import type { AppConfig, UserProfile, IdPUser } from "../api/types";
import {
  getUserProfile,
  listIdPUsers,
  updateUserProfile,
  deleteUserProfile,
  updateIdPUser,
  deleteIdPUser,
} from "../api/client";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { ChevronRight, ArrowLeft, Link2, Loader2, Pencil, Trash2 } from "lucide-react";
import UserProfileForm from "./UserProfileForm";
import IdPUserForm from "./IdPUserForm";

interface Props {
  config: AppConfig;
  id: string;
  navigate: (path: string) => void;
}

export default function UserProfileView({ config, id, navigate }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [linkedIdPUser, setLinkedIdPUser] = useState<IdPUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingIdPUser, setEditingIdPUser] = useState(false);

  const loadData = () => {
    setLoading(true);
    setError(null);
    getUserProfile(id)
      .then(async (p) => {
        setProfile(p);
        if (config.hasBuiltInIdP && config.usernameField) {
          const usernameValue = String(p[config.usernameField] ?? "");
          if (usernameValue) {
            const idpUsers = await listIdPUsers(100, usernameValue);
            const match = idpUsers.collection.find((u) => u.name === usernameValue);
            setLinkedIdPUser(match ?? null);
          }
        }
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [id, config]);

  const handleUpdateProfile = async (values: Record<string, unknown>) => {
    await updateUserProfile(id, values);
    setEditingProfile(false);
    loadData();
  };

  const handleDeleteProfile = async () => {
    if (!confirm(`Delete this ${config.typeName}?`)) return;
    await deleteUserProfile(id);
    navigate("/");
  };

  const handleUpdateIdPUser = async (values: Record<string, unknown>) => {
    if (!linkedIdPUser) return;
    await updateIdPUser(linkedIdPUser.id, values);
    setEditingIdPUser(false);
    loadData();
  };

  const handleDeleteIdPUser = async () => {
    if (!linkedIdPUser || !confirm("Delete this IdP user?")) return;
    await deleteIdPUser(linkedIdPUser.id);
    setLinkedIdPUser(null);
    setEditingIdPUser(false);
  };

  const fieldNames = Object.keys(config.fields).sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4" />
          {config.typeName}
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

      {profile && (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{config.typeName} Detail</CardTitle>
              {!editingProfile && (
                <Button variant="outline" size="sm" onClick={() => setEditingProfile(true)}>
                  <Pencil className="h-3 w-3" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {editingProfile ? (
                <div className="space-y-4">
                  <UserProfileForm
                    config={config}
                    initialValues={profile}
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
                  <div className="py-3 text-sm font-medium text-muted-foreground border-b">id</div>
                  <div className="py-3 text-sm font-mono border-b">{profile.id}</div>
                  {fieldNames.map((f) => (
                    <div key={f} className="contents">
                      <div className="py-3 text-sm font-medium text-muted-foreground border-b flex items-center gap-1.5">
                        {f}
                        {f === config.usernameField && config.hasBuiltInIdP && (
                          <Badge variant="secondary" className="text-[10px] py-0">
                            username
                          </Badge>
                        )}
                      </div>
                      <div className="py-3 text-sm border-b">{formatValue(profile[f])}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {config.hasBuiltInIdP && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-1.5">
                  <Link2 className="h-4 w-4 text-muted-foreground" />
                  Linked IdP User
                </CardTitle>
                {linkedIdPUser && !editingIdPUser && (
                  <Button variant="outline" size="sm" onClick={() => setEditingIdPUser(true)}>
                    <Pencil className="h-3 w-3" />
                    Edit
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {linkedIdPUser ? (
                  editingIdPUser ? (
                    <div className="space-y-4">
                      <IdPUserForm
                        mode="edit"
                        initialValues={linkedIdPUser}
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
                      <div className="py-3 text-sm font-medium text-muted-foreground border-b">
                        ID
                      </div>
                      <div className="py-3 text-sm font-mono border-b">
                        <button
                          onClick={() => navigate(`/idp-users/${linkedIdPUser.id}`)}
                          className="text-primary hover:underline"
                        >
                          {linkedIdPUser.id}
                        </button>
                      </div>
                      <div className="py-3 text-sm font-medium text-muted-foreground border-b flex items-center gap-1.5">
                        Name
                        <Badge variant="secondary" className="text-[10px] py-0">
                          username
                        </Badge>
                      </div>
                      <div className="py-3 text-sm border-b">{linkedIdPUser.name}</div>
                      <div className="py-3 text-sm font-medium text-muted-foreground">Status</div>
                      <div className="py-3 text-sm">
                        {linkedIdPUser.disabled ? (
                          <Badge variant="destructive">Disabled</Badge>
                        ) : (
                          <Badge variant="secondary">Active</Badge>
                        )}
                      </div>
                    </div>
                  )
                ) : (
                  <p className="text-sm text-muted-foreground">No linked IdP user found</p>
                )}
              </CardContent>
            </Card>
          )}
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
