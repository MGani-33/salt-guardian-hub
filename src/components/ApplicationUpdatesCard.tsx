import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";

interface Application {
  name: string;
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
}

interface ApplicationUpdatesCardProps {
  applications: Application[];
}

const ApplicationUpdatesCard = ({ applications }: ApplicationUpdatesCardProps) => {
  return (
    <Card className="transition-all hover:shadow-lg hover:shadow-primary/10 border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Application Updates
        </CardTitle>
        <CardDescription>Tracked application versions and updates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {applications.map((app) => (
            <div key={app.name} className="flex items-center justify-between pb-3 border-b border-border/50 last:border-0 last:pb-0">
              <div>
                <p className="font-medium">{app.name}</p>
                <p className="text-sm text-muted-foreground">
                  {app.currentVersion}
                  {app.updateAvailable && ` → ${app.latestVersion}`}
                </p>
              </div>
              {app.updateAvailable ? (
                <Badge variant="outline" className="bg-warning/10 text-warning border-warning">
                  Update Available
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-success/10 text-success border-success">
                  Current
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ApplicationUpdatesCard;
