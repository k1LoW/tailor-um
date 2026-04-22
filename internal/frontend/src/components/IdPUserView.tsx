import { useEffect, useState } from "react";
import type { AppConfig, IdPUser, UserProfile } from "../api/types";
import {
  getIdPUser,
  listUserProfiles,
  updateIdPUser,
  deleteIdPUser,
  updateUserProfile,
  deleteUserProfile,
  sendPasswordResetEmail,
} from "../api/client";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ChevronRight, ArrowLeft, Link2, Loader2, Pencil, Trash2, Mail } from "lucide-react";
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
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetSending, setResetSending] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetRedirectUri, setResetRedirectUri] = useState("");
  const [resetFromName, setResetFromName] = useState("");
  const [resetSubject, setResetSubject] = useState("");

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
    setShowResetForm(false);
    setResetSending(false);
    setResetSuccess(false);
    setResetError(null);
    setResetRedirectUri("");
    setResetFromName("");
    setResetSubject("");
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

  const handleSendPasswordResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetSending(true);
    setResetError(null);
    setResetSuccess(false);
    try {
      const data: { redirectUri: string; fromName?: string; subject?: string } = {
        redirectUri: resetRedirectUri,
      };
      if (resetFromName) data.fromName = resetFromName;
      if (resetSubject) data.subject = resetSubject;
      await sendPasswordResetEmail(id, data);
      setShowResetForm(false);
      setResetSuccess(true);
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setResetSending(false);
    }
  };

  const handleCloseResetForm = () => {
    setShowResetForm(false);
    setResetError(null);
    setResetSuccess(false);
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
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (showResetForm) {
                        handleCloseResetForm();
                      } else {
                        setResetError(null);
                        setResetSuccess(false);
                        setShowResetForm(true);
                      }
                    }}
                  >
                    <Mail className="h-3 w-3" />
                    Password Reset Email
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setEditingIdPUser(true)}>
                    <Pencil className="h-3 w-3" />
                    Edit
                  </Button>
                </div>
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
                <div className="space-y-4">
                  {resetSuccess && (
                    <div className="rounded-md border border-green-500/50 bg-green-500/10 p-2 text-sm text-green-700 dark:text-green-400">
                      Password reset email sent successfully.
                    </div>
                  )}
                  <div className="grid grid-cols-[200px_1fr] gap-y-0">
                    <div className="py-3 text-sm font-medium text-muted-foreground border-b">
                      ID
                    </div>
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

                  {showResetForm && (
                    <div className="rounded-lg border p-4 space-y-4">
                      <h4 className="text-sm font-medium">Send Password Reset Email</h4>
                      <form onSubmit={handleSendPasswordResetEmail} className="space-y-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="reset-redirect-uri">Redirect URI</Label>
                          <Input
                            id="reset-redirect-uri"
                            type="url"
                            value={resetRedirectUri}
                            onChange={(e) => setResetRedirectUri(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="reset-subject">
                            Subject
                            <span className="text-muted-foreground font-normal ml-1">
                              (optional, has default)
                            </span>
                          </Label>
                          <Input
                            id="reset-subject"
                            value={resetSubject}
                            onChange={(e) => setResetSubject(e.target.value)}
                            placeholder="Leave empty to use default"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="reset-from-name">
                            Sender Name
                            <span className="text-muted-foreground font-normal ml-1">
                              (optional, defaults to &quot;Tailor Platform IdP&quot;)
                            </span>
                          </Label>
                          <Input
                            id="reset-from-name"
                            value={resetFromName}
                            onChange={(e) => setResetFromName(e.target.value)}
                            placeholder="Tailor Platform IdP"
                          />
                        </div>
                        {resetError && (
                          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
                            {resetError}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Button type="submit" size="sm" disabled={resetSending}>
                            {resetSending && <Loader2 className="h-3 w-3 animate-spin" />}
                            Send
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleCloseResetForm}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </div>
                  )}
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
