import { useState, useCallback } from "react";
import { useConfig } from "./hooks/useConfig";
import { useRouter } from "./hooks/useRouter";
import Layout from "./components/Layout";
import UserProfileTable from "./components/UserProfileTable";
import UserProfileView from "./components/UserProfileView";
import IdPUserTable from "./components/IdPUserTable";
import IdPUserView from "./components/IdPUserView";
import SearchResults from "./components/SearchResults";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./components/ui/tabs";
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";
import { Loader2, Search, X } from "lucide-react";

export default function App() {
  const { config, error, loading } = useConfig();
  const { route, navigate } = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = useCallback(() => {
    setSearchQuery(searchInput.trim());
  }, [searchInput]);

  const handleClear = useCallback(() => {
    setSearchInput("");
    setSearchQuery("");
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleSearch();
      if (e.key === "Escape") handleClear();
    },
    [handleSearch, handleClear],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading configuration...
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 max-w-md">
          <h2 className="font-semibold text-destructive mb-2">Failed to load configuration</h2>
          <p className="text-sm text-muted-foreground">{error || "Unknown error"}</p>
        </div>
      </div>
    );
  }

  const isListPage = route.page === "user-profiles" || route.page === "idp-users";

  const activeTab = route.page === "idp-users" ? "idp-users" : "user-profiles";

  return (
    <Layout appName={config.appName}>
      {isListPage ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search by ${config.typeName}.${config.usernameField || "username"} or IdP user.name (exact match)`}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-9"
              />
            </div>
            <Button size="sm" onClick={handleSearch}>
              Search
            </Button>
            {searchQuery && (
              <Button size="sm" variant="ghost" onClick={handleClear}>
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>

          {searchQuery ? (
            <SearchResults config={config} query={searchQuery} navigate={navigate} />
          ) : (
            <Tabs
              value={activeTab}
              onValueChange={(v) => navigate(v === "idp-users" ? "/idp-users" : "/")}
            >
              <TabsList>
                <TabsTrigger value="user-profiles">{config.typeName}</TabsTrigger>
                {config.hasBuiltInIdP && <TabsTrigger value="idp-users">IdP Users</TabsTrigger>}
              </TabsList>
              <TabsContent value="user-profiles">
                <UserProfileTable config={config} navigate={navigate} />
              </TabsContent>
              {config.hasBuiltInIdP && (
                <TabsContent value="idp-users">
                  <IdPUserTable navigate={navigate} />
                </TabsContent>
              )}
            </Tabs>
          )}
        </div>
      ) : (
        <>
          {route.page === "user-profile-view" && route.id && (
            <UserProfileView config={config} id={route.id} navigate={navigate} />
          )}
          {route.page === "idp-user-view" && route.id && config.hasBuiltInIdP && (
            <IdPUserView config={config} id={route.id} navigate={navigate} />
          )}
        </>
      )}
    </Layout>
  );
}
