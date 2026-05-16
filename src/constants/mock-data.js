export const stats = [
  { label: "Active users", value: "1,248", delta: "+12.5%" },
  { label: "Open items", value: "86", delta: "-4.2%" },
  { label: "Completion rate", value: "94%", delta: "+3.1%" },
  { label: "Realtime events", value: "327", delta: "+18.4%" },
];

export const chartData = [
  { name: "Mon", users: 120, activity: 80 },
  { name: "Tue", users: 180, activity: 120 },
  { name: "Wed", users: 150, activity: 135 },
  { name: "Thu", users: 240, activity: 170 },
  { name: "Fri", users: 220, activity: 190 },
  { name: "Sat", users: 260, activity: 210 },
  { name: "Sun", users: 310, activity: 260 },
];

export const activityFeed = [
  { id: "1", title: "New user session", time: "2 min ago" },
  { id: "2", title: "Notification delivered", time: "18 min ago" },
  { id: "3", title: "Profile updated", time: "1 hr ago" },
  { id: "4", title: "Realtime subscription refreshed", time: "3 hrs ago" },
];

export const sampleUsers = [
  { id: "1", name: "Demo Admin", email: "admin@example.com", role: "admin", status: "active" },
  { id: "2", name: "Demo User", email: "user@example.com", role: "employee", status: "active" },
  { id: "3", name: "Pending User", email: "pending@example.com", role: "employee", status: "pending" },
];

export const sampleLogs = [
  { id: "1", action: "auth.login", actor: "admin@example.com", created_at: "2026-05-14T10:30:00Z" },
  { id: "2", action: "profile.update", actor: "user@example.com", created_at: "2026-05-14T11:00:00Z" },
  { id: "3", action: "notification.create", actor: "system", created_at: "2026-05-14T11:15:00Z" },
];
