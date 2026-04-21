import type { ReactNode } from "react";
import { Separator } from "./ui/separator";
import { Button } from "./ui/button";
import { useTheme } from "../hooks/useTheme";
import { Moon, Sun } from "lucide-react";

interface Props {
  appName: string;
  children: ReactNode;
}

export default function Layout({ appName, children }: Props) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="flex h-14 items-center justify-between px-6">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            tailor-um
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              / {appName}
            </span>
          </h1>
          <Button variant="outline" size="icon" onClick={toggleTheme}>
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-foreground" />
            ) : (
              <Moon className="h-4 w-4 text-foreground" />
            )}
          </Button>
        </div>
      </header>
      <Separator />
      <main className="container mx-auto max-w-6xl p-6">{children}</main>
    </div>
  );
}
