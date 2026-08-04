"use client";

import { useRef, useState } from "react";
import { SectionHeader } from "@/components/primitives/section-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { InviteMemberDialog } from "@/components/settings/invite-member-dialog";
import { useUiSimulation } from "@/lib/hooks/use-ui-simulation";
import { useCurrentUser } from "@/lib/hooks/queries/use-current-user";
import { useSettings } from "@/lib/hooks/queries/use-settings";
import { useUsers } from "@/lib/hooks/queries/use-users";
import { useUpdateWorkspaceSetting } from "@/lib/hooks/mutations/use-update-workspace-setting";
import { useUpdateUserRole } from "@/lib/hooks/mutations/use-update-user-role";

const NOTIFICATION_PREFS = [
  { id: "weekly-digest", label: "Weekly executive digest", description: "A summary of growth metrics every Monday." },
  { id: "keyword-alerts", label: "Keyword ranking alerts", description: "Notify when a tracked keyword enters or exits the Top 10." },
  { id: "reddit-mentions", label: "Reddit mention alerts", description: "Notify on new high-priority Reddit mentions." },
  { id: "backlink-alerts", label: "Backlink alerts", description: "Notify on new or lost high-authority backlinks." },
];

export function SettingsPageContent() {
  const { simulateError, setSimulateError, simulateOffline, setSimulateOffline } = useUiSimulation();
  const { data: currentUser } = useCurrentUser();
  const { data: settings } = useSettings();
  const { data: users } = useUsers();
  const updateWorkspaceSetting = useUpdateWorkspaceSetting();
  const updateUserRole = useUpdateUserRole();
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    "weekly-digest": true,
    "keyword-alerts": true,
    "reddit-mentions": true,
    "backlink-alerts": false,
  });

  const isAdmin = currentUser?.role === "admin";
  const workspaceName = typeof settings?.["workspace.name"] === "string" ? (settings["workspace.name"] as string) : "";
  const workspaceNameInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="max-w-2xl space-y-6">
      <SectionHeader title="Settings" description="Manage your profile, notifications, and preview tools." />

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-medium">Profile</h3>
        <div className="mt-4 flex items-center gap-4">
          <Avatar className="size-14">
            <AvatarFallback className="text-lg">{currentUser?.initials ?? ""}</AvatarFallback>
          </Avatar>
          {currentUser && (
            <div>
              <p className="text-sm font-medium">{currentUser.name}</p>
              <p className="text-xs text-muted-foreground">{currentUser.role}</p>
            </div>
          )}
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" defaultValue={currentUser?.name ?? ""} key={currentUser?.name} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" defaultValue={currentUser?.email ?? ""} key={currentUser?.email} />
          </div>
        </div>
        <Button size="sm" className="mt-4">
          Save changes
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-medium">Workspace</h3>
        <div className="mt-4 max-w-sm space-y-1.5">
          <Label htmlFor="workspace-name">Workspace name</Label>
          {isAdmin ? (
            <Input id="workspace-name" ref={workspaceNameInputRef} defaultValue={workspaceName} key={workspaceName} />
          ) : (
            <p className="text-sm">{workspaceName}</p>
          )}
        </div>
        {isAdmin && (
          <Button
            size="sm"
            className="mt-4"
            disabled={updateWorkspaceSetting.isPending}
            onClick={() => {
              const value = workspaceNameInputRef.current?.value;
              if (value) updateWorkspaceSetting.mutate(value);
            }}
          >
            Save changes
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Members</h3>
          {isAdmin && <InviteMemberDialog />}
        </div>
        <div className="mt-4 space-y-3">
          {users?.map((user) => (
            <div key={user.id} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="size-8">
                  <AvatarFallback className="text-xs">{user.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {user.status === "pending" && <Badge variant="outline">Pending</Badge>}
                {isAdmin ? (
                  <Select
                    value={user.role}
                    onValueChange={(role) => updateUserRole.mutate({ id: user.id, role: role as "admin" | "member" })}
                  >
                    <SelectTrigger size="sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="secondary">{user.role}</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-medium">Notifications</h3>
        <div className="mt-4 space-y-4">
          {NOTIFICATION_PREFS.map((pref) => (
            <div key={pref.id} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm">{pref.label}</p>
                <p className="text-xs text-muted-foreground">{pref.description}</p>
              </div>
              <Switch
                checked={prefs[pref.id]}
                onCheckedChange={(checked) => setPrefs((prev) => ({ ...prev, [pref.id]: checked }))}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-border bg-card p-5">
        <h3 className="text-sm font-medium">Developer / Preview</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Preview loading, error, and offline states without waiting for a real failure.
        </p>
        <Separator className="my-4" />
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm">Simulate error state</p>
              <p className="text-xs text-muted-foreground">Force charts and tables to render their error state.</p>
            </div>
            <Switch checked={simulateError} onCheckedChange={setSimulateError} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm">Simulate offline state</p>
              <p className="text-xs text-muted-foreground">Show the offline banner regardless of real connectivity.</p>
            </div>
            <Switch checked={simulateOffline} onCheckedChange={setSimulateOffline} />
          </div>
        </div>
      </div>
    </div>
  );
}
