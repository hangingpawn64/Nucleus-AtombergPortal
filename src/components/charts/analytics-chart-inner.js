"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function useElementWidth(node) {
  const subscribe = useCallback(
    (onStoreChange) => {
      if (!node || typeof ResizeObserver === "undefined") {
        return () => undefined;
      }

      const observer = new ResizeObserver(onStoreChange);
      observer.observe(node);

      return () => observer.disconnect();
    },
    [node],
  );

  const getSnapshot = useCallback(() => {
    if (!node) return 0;
    return Math.floor(node.getBoundingClientRect().width);
  }, [node]);

  return useSyncExternalStore(subscribe, getSnapshot, () => 0);
}

export function AnalyticsChartInner({ data = [] }) {
  const [node, setNode] = useState(null);
  const width = useElementWidth(node);
  const chartWidth = Math.max(width, 320);

  return (
    <div ref={setNode} className="h-full w-full min-w-0 overflow-hidden">
      <AreaChart
        data={data}
        width={chartWidth}
        height={288}
        margin={{ left: -16, right: 8 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="name" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} />
        <Tooltip />
        <Area
          type="monotone"
          dataKey="users"
          stroke="var(--chart-1)"
          fill="var(--chart-1)"
          fillOpacity={0.18}
        />
        <Area
          type="monotone"
          dataKey="activity"
          stroke="var(--chart-2)"
          fill="var(--chart-2)"
          fillOpacity={0.16}
        />
      </AreaChart>
    </div>
  );
}
