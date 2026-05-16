import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }) {
  const normalizedStatus = status?.toLowerCase();

  switch (normalizedStatus) {
    case "draft":
    case "not_started":
      return <Badge variant="outline" className="bg-slate-100 text-slate-700 hover:bg-slate-100/80 border-slate-200">Draft</Badge>;
    case "submitted":
      return <Badge variant="outline" className="bg-blue-100 text-blue-700 hover:bg-blue-100/80 border-blue-200">Submitted</Badge>;
    case "rework":
      return <Badge variant="outline" className="bg-orange-100 text-orange-700 hover:bg-orange-100/80 border-orange-200">Needs Rework</Badge>;
    case "approved":
    case "active":
    case "completed":
      return <Badge variant="outline" className="bg-green-100 text-green-700 hover:bg-green-100/80 border-green-200">Approved</Badge>;
    case "on_track":
      return <Badge variant="outline" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100/80 border-emerald-200">On Track</Badge>;
    case "closed":
    case "archived":
      return <Badge variant="outline" className="bg-gray-100 text-gray-700 hover:bg-gray-100/80 border-gray-200">Closed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
