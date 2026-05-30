const STATUS_META = {
  pending: {
    label: "Pending",
    color: "slate",
  },
  in_progress: {
    label: "In Progress",
    color: "blue",
  },
  on_track: {
    label: "On Track",
    color: "emerald",
  },
  completed: {
    label: "Completed",
    color: "green",
  },
};

export function numericValue(value) {
  if (value === "" || value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function clampProgress(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function latestCheckin(checkins = []) {
  return [...checkins].sort((a, b) => {
    const bUpdated = new Date(b.updated_at || b.created_at || 0).getTime();
    const aUpdated = new Date(a.updated_at || a.created_at || 0).getTime();

    if (bUpdated !== aUpdated) return bUpdated - aUpdated;

    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  })[0] || null;
}

export function achievementStatus(progress, goalStatus) {
  if (goalStatus === "completed" || progress >= 100) {
    return { key: "completed", ...STATUS_META.completed };
  }

  if (progress >= 75) {
    return { key: "on_track", ...STATUS_META.on_track };
  }

  if (progress > 0) {
    return { key: "in_progress", ...STATUS_META.in_progress };
  }

  return { key: "pending", ...STATUS_META.pending };
}

export function calculateProgress({
  uomType,
  targetValue,
  actualValue,
  goalStatus,
} = {}) {
  const target = numericValue(targetValue);
  const actual = numericValue(actualValue) ?? 0;

  if (goalStatus === "completed") return 100;

  switch (uomType) {
    case "max": {
      if (target == null) return 0;
      if (actual <= target) return 100;
      if (actual <= 0) return target >= 0 ? 100 : 0;
      return clampProgress((target / actual) * 100);
    }

    case "zero": {
      if (actual <= 0) return 100;
      if (target == null || target <= 0) return 0;
      return clampProgress(((target - actual) / target) * 100);
    }

    case "timeline": {
      if (actual <= 0) return 0;
      if (actual <= 100 && (target == null || target <= 100)) {
        return clampProgress(actual);
      }
      if (target == null || target === 0) return 0;
      return clampProgress((actual / target) * 100);
    }

    case "min":
    default: {
      if (target == null) return 0;
      if (target === 0) return actual > 0 ? 100 : 0;
      return clampProgress((actual / target) * 100);
    }
  }
}

export function buildAchievementMeta(goal = {}, latestGoalCheckin = null) {
  const targetValue = numericValue(goal.target_value ?? latestGoalCheckin?.planned_value) ?? 0;
  const actualValue = numericValue(latestGoalCheckin?.actual_value) ?? 0;
  const progress = calculateProgress({
    uomType: goal.uom_type,
    targetValue,
    actualValue,
    goalStatus: goal.status,
  });
  const status = achievementStatus(progress, goal.status);

  return {
    targetValue,
    actualValue,
    progress,
    statusKey: status.key,
    statusLabel: status.label,
    statusColor: status.color,
  };
}
