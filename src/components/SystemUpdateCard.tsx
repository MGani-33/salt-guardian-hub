import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import StatusBadge from "./StatusBadge";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SystemUpdateCardProps {
  lastChecked: string;
  updatesAvailable: boolean;
  onRefresh: () => void;
}

const SystemUpdateCard = ({ lastChecked, updatesAvailable, onRefresh }: SystemUpdateCardProps) => {
  return (
    <Card className="transition-all hover:shadow-lg hover:shadow-primary/10 border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>System Updates</span>
          <Button variant="outline" size="sm" onClick={onRefresh} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </CardTitle>
        <CardDescription>Last checked: {lastChecked}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Update Status</span>
          <StatusBadge
            status={updatesAvailable ? "warning" : "running"}
            label={updatesAvailable ? "Updates Available" : "Up to Date"}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemUpdateCard;
