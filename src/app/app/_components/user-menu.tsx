"use client";

import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import {
  CheckIcon,
  ChevronsUpDownIcon,
  ContrastIcon,
  CopyIcon,
  ExternalLinkIcon,
  GlobeIcon,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  SettingsIcon,
  SunIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SwitchIndicator } from "@/components/ui/switch";
import type { OwnProfile } from "@/lib/account/profile";
import { displayName } from "@/lib/account/settings";
import { publicProfilePath } from "@/lib/public-profile/handle";
import { cn } from "@/lib/utils";

import { setProfileOnline, signOut } from "../actions";
import { SettingsDialog } from "./settings-dialog";

const THEMES = [
  { value: "light", label: "Clair", icon: SunIcon },
  { value: "dark", label: "Sombre", icon: MoonIcon },
  { value: "system", label: "Système", icon: MonitorIcon },
];

// One line per entry, as in the mockup: text at the left, icon at the right in the submenus.
const ROW = "gap-2.5 rounded-none px-2.5 py-2";
const ROW_ICON = "ml-auto text-muted-foreground";
const SUBMENU = "rounded-none p-1";
// Same look as the other items, for the checkbox and radio items drawn here.
const ITEM =
  "flex cursor-default items-center text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4";

// Profile block at the bottom of the sidebar: the first and last name, or the email address
// without them (docs/settings.md). A click opens the menu just above it, as in the Claude desktop
// app: the address, "Mon profil public ›", "Paramètres", "Thème ›", "Se déconnecter"
// (docs/public-profile.md, "Menu du profil"). Submenus open at the right, on hover or click.
export function UserMenu({
  email,
  avatarUrl,
  profile,
}: {
  email: string;
  avatarUrl: string | null;
  profile: OwnProfile;
}) {
  const [signingOut, startSignOut] = useTransition();
  // Held here and not in the submenu, whose content is rebuilt each time the menu opens. The new
  // state shows at once, until the refreshed page brings the saved one, or the previous one if
  // the change fails.
  const [online, setOptimisticOnline] = useOptimistic(profile.isOnline);
  const [saving, startSaving] = useTransition();
  // The Settings dialog lives outside the menu, which closes when it opens. A new key at each
  // opening starts it again from the saved values.
  const [settings, setSettings] = useState({ open: false, key: 0 });
  const name = displayName(profile, email);

  // Switched at once, without confirmation; a notification confirms it, as every change of the account.
  function toggleOnline(next: boolean) {
    if (saving) return;
    startSaving(async () => {
      setOptimisticOnline(next);
      const result = await setProfileOnline(next);
      if (result.ok) toast.success(next ? "Profil mis en ligne" : "Profil mis hors ligne");
      else toast.error("L'état du profil n'a pas pu être changé. Réessayez.");
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Menu du profil"
          className="flex w-full items-center gap-3 px-2 py-2 text-left transition-colors outline-none hover:bg-sidebar-accent focus-visible:ring-3 focus-visible:ring-ring/50 aria-expanded:bg-sidebar-accent"
        >
          <UserAvatar name={name} avatarUrl={avatarUrl} />
          <span className="min-w-0 flex-1 truncate text-sm">{name}</span>
          <ChevronsUpDownIcon className="size-4 shrink-0 text-muted-foreground" />
        </DropdownMenuTrigger>
        {/* Placed in the window, like the sidebar it hangs from: when the page scrolls (the
            dashboard is taller than the screen), the menu and its submenus stay under the pointer. */}
        <DropdownMenuContent side="top" sideOffset={8} positionMethod="fixed" className="rounded-none">
          <p className="truncate px-2.5 py-2 text-xs text-muted-foreground">{email}</p>
          <DropdownMenuSeparator />
          <PublicProfileSubmenu handle={profile.handle} online={online} onOnlineChange={toggleOnline} />
          <DropdownMenuItem
            className={ROW}
            onClick={() => {
              // The notifications of earlier actions go: shown above the dialog, at the bottom
              // right, they would cover its "Enregistrer" button.
              toast.dismiss();
              setSettings((current) => ({ open: true, key: current.key + 1 }));
            }}
          >
            <SettingsIcon />
            Paramètres
          </DropdownMenuItem>
          <ThemeSubmenu />
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className={ROW}
            disabled={signingOut}
            onClick={() => startSignOut(() => signOut())}
          >
            <LogOutIcon />
            Se déconnecter
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SettingsDialog
        key={settings.key}
        open={settings.open}
        onOpenChange={(open) => setSettings((current) => ({ ...current, open }))}
        email={email}
        profile={{ firstName: profile.firstName, lastName: profile.lastName, handle: profile.handle }}
      />
    </>
  );
}

// "Mon profil public": the online switch, "Copier l'adresse", "Ouvrir mon profil public".
function PublicProfileSubmenu({
  handle,
  online,
  onOnlineChange,
}: {
  handle: string;
  online: boolean;
  onOnlineChange: (online: boolean) => void;
}) {
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const path = publicProfilePath(handle);

  useEffect(() => () => clearTimeout(copiedTimer.current), []);

  async function copyAddress() {
    try {
      // The address on the site we are on: local, preview or production.
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
      setCopied(true);
      clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("L'adresse n'a pas pu être copiée.");
    }
  }

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className={ROW}>
        <GlobeIcon />
        Mon profil public
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className={cn(SUBMENU, "w-64")} sideOffset={9} alignOffset={-5} positionMethod="fixed">
        <MenuPrimitive.CheckboxItem
          checked={online}
          onCheckedChange={onOnlineChange}
          closeOnClick={false}
          className={cn(ITEM, ROW)}
        >
          {online ? "Profil en ligne" : "Profil hors ligne"}
          <SwitchIndicator checked={online} className="ml-auto" />
        </MenuPrimitive.CheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className={ROW} closeOnClick={false} onClick={copyAddress}>
          <span aria-live="polite">{copied ? "Adresse copiée" : "Copier l'adresse"}</span>
          {copied ? <CheckIcon className="ml-auto text-success" /> : <CopyIcon className={ROW_ICON} />}
        </DropdownMenuItem>
        <MenuPrimitive.LinkItem
          href={path}
          target="_blank"
          rel="noopener"
          closeOnClick
          className={cn(ITEM, ROW)}
          aria-label="Ouvrir mon profil public, dans un nouvel onglet"
        >
          Ouvrir mon profil public
          <ExternalLinkIcon className={ROW_ICON} />
        </MenuPrimitive.LinkItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

// "Thème": Clair, Sombre, Système. A check mark right after the label of the active choice,
// the icon at the right.
function ThemeSubmenu() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className={ROW}>
        <ContrastIcon />
        Thème
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className={cn(SUBMENU, "w-[200px]")} sideOffset={9} alignOffset={-5} positionMethod="fixed">
        <DropdownMenuRadioGroup value={theme ?? "system"} onValueChange={(value) => setTheme(value)}>
          {THEMES.map(({ value, label, icon: Icon }) => (
            <MenuPrimitive.RadioItem
              key={value}
              value={value}
              closeOnClick={false}
              className={cn(ITEM, ROW)}
            >
              {label}
              <MenuPrimitive.RadioItemIndicator keepMounted className="data-unchecked:invisible">
                <CheckIcon />
              </MenuPrimitive.RadioItemIndicator>
              <Icon className={ROW_ICON} />
            </MenuPrimitive.RadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

// The photo of the profile (by default the Google one), otherwise the initial of the name shown (first name, or
// email address).
function UserAvatar({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  return (
    <Avatar size="sm">
      {avatarUrl && <AvatarImage src={avatarUrl} alt="" referrerPolicy="no-referrer" />}
      <AvatarFallback>{name.charAt(0).toUpperCase() || "?"}</AvatarFallback>
    </Avatar>
  );
}
