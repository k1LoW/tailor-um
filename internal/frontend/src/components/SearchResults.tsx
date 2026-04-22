import { useEffect, useState } from "react";
import type { AppConfig, UserProfile, IdPUser } from "../api/types";
import { listUserProfiles, listIdPUsers } from "../api/client";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Loader2, Link2 } from "lucide-react";

interface Props {
  config: AppConfig;
  query: string;
  navigate: (path: string) => void;
}

export default function SearchResults({ config, query, navigate }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [idpUser, setIdpUser] = useState<IdPUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setProfile(null);
    setIdpUser(null);

    const fetchAll = async () => {
      const results = await Promise.allSettled([
        config.usernameField
          ? listUserProfiles(0, 1, config.usernameField, query)
          : Promise.resolve({ collection: [], totalCount: 0 }),
        config.hasBuiltInIdP
          ? listIdPUsers(1, query)
          : Promise.resolve({ collection: [], totalCount: 0 }),
      ]);

      if (results[0].status === "fulfilled") {
        setProfile(results[0].value.collection[0] ?? null);
      }
      if (results[1].status === "fulfilled") {
        setIdpUser(results[1].value.collection[0] ?? null);
      }

      const errors = results
        .filter((r) => r.status === "rejected")
        .map((r) => (r as PromiseRejectedResult).reason?.message);
      if (errors.length > 0) {
        setError(errors.join(", "));
      }
    };

    fetchAll().finally(() => setLoading(false));
  }, [query, config]);

  const fieldNames = Object.keys(config.fields).sort();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Search results for "{query}"</h2>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Searching...
        </div>
      )}

      {!loading && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {config.typeName}
                {config.usernameField && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    {config.usernameField} = "{query}"
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-[120px_1fr] gap-y-0">
                    <div className="py-2 text-sm font-medium text-muted-foreground border-b">
                      id
                    </div>
                    <div className="py-2 text-sm font-mono border-b">
                      <button
                        onClick={() => navigate(`/user-profiles/${profile.id}`)}
                        className="text-primary hover:underline"
                      >
                        {profile.id}
                      </button>
                    </div>
                    {fieldNames.map((f) => (
                      <div key={f} className="contents">
                        <div className="py-2 text-sm font-medium text-muted-foreground border-b flex items-center gap-1">
                          {f}
                          {f === config.usernameField && (
                            <Badge variant="secondary" className="text-[10px] py-0">
                              username
                            </Badge>
                          )}
                        </div>
                        <div className="py-2 text-sm border-b">{formatValue(profile[f])}</div>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/user-profiles/${profile.id}`)}
                  >
                    View detail
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Not found</p>
              )}
            </CardContent>
          </Card>

          {config.hasBuiltInIdP && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-1.5">
                  <Link2 className="h-4 w-4 text-muted-foreground" />
                  IdP User
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    name = "{query}"
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {idpUser ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-[120px_1fr] gap-y-0">
                      <div className="py-2 text-sm font-medium text-muted-foreground border-b">
                        ID
                      </div>
                      <div className="py-2 text-sm font-mono border-b">
                        <button
                          onClick={() => navigate(`/idp-users/${idpUser.id}`)}
                          className="text-primary hover:underline"
                        >
                          {idpUser.id}
                        </button>
                      </div>
                      <div className="py-2 text-sm font-medium text-muted-foreground border-b flex items-center gap-1">
                        Name
                        <Badge variant="secondary" className="text-[10px] py-0">
                          username
                        </Badge>
                      </div>
                      <div className="py-2 text-sm border-b">{idpUser.name}</div>
                      <div className="py-2 text-sm font-medium text-muted-foreground">Status</div>
                      <div className="py-2 text-sm">
                        {idpUser.disabled ? (
                          <Badge variant="destructive">Disabled</Badge>
                        ) : (
                          <Badge variant="secondary">Active</Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/idp-users/${idpUser.id}`)}
                    >
                      View detail
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Not found</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
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
