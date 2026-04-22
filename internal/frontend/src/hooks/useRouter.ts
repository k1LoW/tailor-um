import { useState, useEffect, useCallback } from "react";

interface Route {
  page: "user-profiles" | "idp-users" | "user-profile-view" | "idp-user-view";
  id?: string;
}

function parseRoute(pathname: string): Route {
  const parts = pathname.replace(/^\//, "").split("/");
  if (parts[0] === "idp-users" && parts[1]) {
    return { page: "idp-user-view", id: parts[1] };
  }
  if (parts[0] === "idp-users") {
    return { page: "idp-users" };
  }
  if (parts[0] === "user-profiles" && parts[1]) {
    return { page: "user-profile-view", id: parts[1] };
  }
  return { page: "user-profiles" };
}

export function useRouter() {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.pathname));

  useEffect(() => {
    const onPopState = () => setRoute(parseRoute(window.location.pathname));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = useCallback((path: string) => {
    window.history.pushState(null, "", path);
    setRoute(parseRoute(path));
  }, []);

  return { route, navigate };
}
