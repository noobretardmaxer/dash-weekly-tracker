"use client";

import { useState } from "react";
import { SectionHeader } from "@/components/primitives/section-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useUiSimulation } from "@/lib/hooks/use-ui-simulation";
import { useCurrentUser } from "@/lib/hooks/queries/use-current-user";

const NOTIFICATION_PREFS = [
  { id: "weekly-digest", label: "Weekly executive digest", description: "A summary of growth metrics every Monday." },
  { id: "keyword-alerts", label: "Keyword ranking alerts", description: "Notify when a tracked keyword enters or exits the Top 10." },
  { id: "reddit-mentions", label: "Reddit mention alerts", description: "Notify on new high-priority Reddit mentions." },
  { id: "backlink-alerts", label: "Backlink alerts", description: "Notify on new or lost high-authority backlinks." },
];

export function SettingsPageContent() {
  const { simulateError, setSimulateError, simulateOffline, setSimulateOffline } = useUiSimulation();
  const { data: currentUser } = useCurrentUser();
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    "weekly-digest": true,
    "keyword-alerts": true,
    "reddit-mentions": true,
    "backlink-alerts": false,
  });

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
