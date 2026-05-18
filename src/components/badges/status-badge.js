import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }) {
  const normalizedStatus = status?.toLowerCase();

  switch (normalizedStatus) {
    case "draft":
      return <Badge variant="outline" className="bg-slate-100 text-slate-700 hover:bg-slate-100/80 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800/80">Draft</Badge>;
    case "not_started":
      return <Badge variant="outline" className="bg-slate-100 text-slate-700 hover:bg-slate-100/80 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800/80">Not Started</Badge>;
    case "submitted":
      return <Badge variant="outline" className="bg-blue-100 text-blue-700 hover:bg-blue-100/80 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/30 dark:hover:bg-blue-950/40">Submitted</Badge>;
    case "rework":
      return <Badge variant="outline" className="bg-orange-100 text-orange-700 hover:bg-orange-100/80 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900/30 dark:hover:bg-orange-950/40">Needs Rework</Badge>;
    case "approved":
      return <Badge variant="outline" className="bg-green-100 text-green-700 hover:bg-green-100/80 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/30 dark:hover:bg-green-950/40">Approved</Badge>;
    case "active":
      return <Badge variant="outline" className="bg-green-100 text-green-700 hover:bg-green-100/80 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/30 dark:hover:bg-green-950/40">Active</Badge>;
    case "completed":
      return <Badge variant="outline" className="bg-green-100 text-green-700 hover:bg-green-100/80 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/30 dark:hover:bg-green-950/40">Completed</Badge>;
    case "on_track":
      return <Badge variant="outline" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100/80 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30 dark:hover:bg-emerald-950/40">On Track</Badge>;
    case "closed":
    case "archived":
      return <Badge variant="outline" className="bg-gray-100 text-gray-700 hover:bg-gray-100/80 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-800/80">Closed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
