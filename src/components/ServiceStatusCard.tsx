import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import StatusBadge from "./StatusBadge";

interface ServiceStatusCardProps {
  title: string;
  description: string;
  status: "running" | "stopped" | "warning" | "enabled" | "disabled";
  statusLabel: string;
}

const ServiceStatusCard = ({ title, description, status, statusLabel }: ServiceStatusCardProps) => {
  return (
    <Card className="transition-all hover:shadow-lg hover:shadow-primary/10 border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <StatusBadge status={status} label={statusLabel} />
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
};

export default ServiceStatusCard;
