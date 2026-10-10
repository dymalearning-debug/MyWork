"use client";

import { ChevronsUpDownIcon, LogOutIcon, MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useTransition } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { signOut } from "../actions";

const THEMES = [
  { value: "light", label: "Clair", icon: SunIcon },
  { value: "dark", label: "Sombre", icon: MoonIcon },
  { value: "system", label: "Système", icon: MonitorIcon },
];

// Profile block at the bottom of the sidebar. A click opens the menu just above it,
// as in the Claude desktop app: the address, the theme, "Se déconnecter".
export function UserMenu({ email, avatarUrl }: { email: string; avatarUrl: string | null }) {
  const { theme, setTheme } = useTheme();
  const [signingOut, startSignOut] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Menu du profil"
        className="flex w-full items-center gap-3 px-2 py-2 text-left transition-colors outline-none hover:bg-sidebar-accent focus-visible:ring-3 focus-visible:ring-ring/50 aria-expanded:bg-sidebar-accent"
      >
        <UserAvatar email={email} avatarUrl={avatarUrl} />
        <span className="min-w-0 flex-1 truncate text-sm">{email}</span>
        <ChevronsUpDownIcon className="size-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" sideOffset={8} className="rounded-none">
        <p className="truncate px-1.5 py-1.5 text-xs text-muted-foreground">{email}</p>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Thème</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={theme ?? "system"} onValueChange={(value) => setTheme(value)}>
            {THEMES.map(({ value, label, icon: Icon }) => (
              <DropdownMenuRadioItem key={value} value={value} closeOnClick={false} className="rounded-none">
                <Icon />
                {label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="rounded-none"
          disabled={signingOut}
          onClick={() => startSignOut(() => signOut())}
        >
          <LogOutIcon />
          Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// The Google photo when there is one, otherwise the initial of the email address.
function UserAvatar({ email, avatarUrl }: { email: string; avatarUrl: string | null }) {
  return (
    <Avatar size="sm">
      {avatarUrl && <AvatarImage src={avatarUrl} alt="" referrerPolicy="no-referrer" />}
      <AvatarFallback>{email.charAt(0).toUpperCase() || "?"}</AvatarFallback>
    </Avatar>
  );
}
