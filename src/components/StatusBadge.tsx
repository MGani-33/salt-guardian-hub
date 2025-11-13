import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

type StatusType = "running" | "stopped" | "warning" | "enabled" | "disabled";

interface StatusBadgeProps {
  status: StatusType;
  label: string;
}

const StatusBadge = ({ status, label }: StatusBadgeProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case "running":
      case "enabled":
        return {
          icon: CheckCircle2,
          variant: "default" as const,
          className: "bg-success text-success-foreground border-success",
        };
      case "stopped":
      case "disabled":
        return {
          icon: XCircle,
          variant: "destructive" as const,
          className: "bg-destructive text-destructive-foreground border-destructive",
        };
      case "warning":
        return {
          icon: AlertCircle,
          variant: "outline" as const,
          className: "bg-warning text-warning-foreground border-warning",
        };
      default:
        return {
          icon: AlertCircle,
          variant: "outline" as const,
          className: "",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`gap-2 ${config.className}`}>
      <Icon className="h-4 w-4" />
      {label}
    </Badge>
  );
};

export default StatusBadge;
