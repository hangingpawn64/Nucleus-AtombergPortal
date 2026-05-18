"use client";

import { useMemo, useState } from "react";
import { Activity, Search } from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/empty-states/empty-state";
import { UserAvatar } from "@/components/profile/user-avatar";
import { formatDateTime, personName } from "@/lib/utils";

function normalizeAction(action = "") {
  return action.replaceAll("_", " ");
}

export function ActivityLogList({ logs = [], showActor = true }) {
  const [query, setQuery] = useState("");

  const filteredLogs = useMemo(() => {
    const normalizedQuery = query.toLowerCase();

    return logs.filter((log) => {
      const actor = personName(log.actor, "System");
      const haystack = [
        log.action,
        log.entity_type,
        actor,
        log.formatted_created_at,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return !normalizedQuery || haystack.includes(normalizedQuery);
    });
  }, [logs, query]);

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search activity"
          className="pl-9"
        />
      </div>

      {filteredLogs.length === 0 ? (
        <EmptyState
          title="No activity found"
          description="Workflow events will appear here when they match your search."
        />
      ) : (
        <div className="grid gap-3">
          {filteredLogs.map((log) => {
            const actorName = personName(log.actor, "System");

            return (
              <Card key={log.id} className="rounded-md">
                <CardContent className="flex gap-3 p-4">
                  {showActor && log.actor ? (
                    <UserAvatar person={log.actor} size="lg" />
                  ) : (
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                      <Activity className="size-5" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <p className="font-medium capitalize">
                        {normalizeAction(log.action)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {log.formatted_created_at || formatDateTime(log.created_at)}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {showActor ? `${actorName} acted on ${log.entity_type || "workflow"}` : log.entity_type || "Workflow event"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
