import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { System } from "@/hooks/useSystems";
import { Monitor } from "lucide-react";

interface SystemsListTableProps {
  systems: System[];
  onSystemSelect: (systemId: string) => void;
}

const SystemsListTable = ({ systems, onSystemSelect }: SystemsListTableProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-success/10 text-success border-success";
      case "offline":
        return "bg-destructive/10 text-destructive border-destructive";
      case "warning":
        return "bg-warning/10 text-warning border-warning";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (systems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Monitor className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No systems found</h3>
        <p className="text-sm text-muted-foreground">No systems match your current filters.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Hostname</TableHead>
            <TableHead>IP Address</TableHead>
            <TableHead>OS</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Seen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {systems.map((system) => (
            <TableRow
              key={system.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onSystemSelect(system.id)}
            >
              <TableCell className="font-medium">{system.hostname}</TableCell>
              <TableCell>{system.ip_address}</TableCell>
              <TableCell>
                {system.os_type && system.os_version
                  ? `${system.os_type} ${system.os_version}`
                  : "Unknown"}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={getStatusColor(system.status)}>
                  {system.status}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDistanceToNow(new Date(system.last_seen), { addSuffix: true })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default SystemsListTable;
