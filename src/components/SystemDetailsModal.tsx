import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Cpu, HardDrive, Network, Package, Activity } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSystemDetails } from "@/hooks/useSystems";
import { Skeleton } from "@/components/ui/skeleton";
import StatusBadge from "./StatusBadge";

interface SystemDetailsModalProps {
  systemId: string | null;
  onClose: () => void;
}

const SystemDetailsModal = ({ systemId, onClose }: SystemDetailsModalProps) => {
  const { data, isLoading } = useSystemDetails(systemId);

  return (
    <Dialog open={!!systemId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {isLoading ? <Skeleton className="h-6 w-48" /> : data?.system?.hostname}
          </DialogTitle>
          <DialogDescription>
            {isLoading ? (
              <Skeleton className="h-4 w-64" />
            ) : (
              `${data?.system?.ip_address} - ${data?.system?.os_type || "Unknown"} ${data?.system?.os_version || ""}`
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <Tabs defaultValue="hardware" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="hardware" className="gap-2">
                <Cpu className="h-4 w-4" />
                Hardware
              </TabsTrigger>
              <TabsTrigger value="network" className="gap-2">
                <Network className="h-4 w-4" />
                Network
              </TabsTrigger>
              <TabsTrigger value="services" className="gap-2">
                <Activity className="h-4 w-4" />
                Services
              </TabsTrigger>
              <TabsTrigger value="applications" className="gap-2">
                <Package className="h-4 w-4" />
                Apps
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[60vh] mt-4">
              <TabsContent value="hardware" className="space-y-4">
                {data?.hardware ? (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Cpu className="h-5 w-5" />
                          Processor
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Model</p>
                            <p className="font-medium">{data.hardware.cpu_model || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Frequency</p>
                            <p className="font-medium">{data.hardware.cpu_frequency || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Cores / Threads</p>
                            <p className="font-medium">
                              {data.hardware.cpu_cores || "N/A"} / {data.hardware.cpu_threads || "N/A"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Memory</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Total</p>
                            <p className="font-medium">{data.hardware.memory_total || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Type</p>
                            <p className="font-medium">{data.hardware.memory_type || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Used</p>
                            <p className="font-medium">{data.hardware.memory_used || "N/A"}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {data.storage.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <HardDrive className="h-5 w-5" />
                            Storage Devices
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Device</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Size</TableHead>
                                <TableHead>Used</TableHead>
                                <TableHead>Mount Point</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {data.storage.map((disk) => (
                                <TableRow key={disk.id}>
                                  <TableCell className="font-medium">{disk.device}</TableCell>
                                  <TableCell>{disk.type}</TableCell>
                                  <TableCell>{disk.size}</TableCell>
                                  <TableCell>{disk.used}</TableCell>
                                  <TableCell>{disk.mount_point}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No hardware information available</p>
                )}
              </TabsContent>

              <TabsContent value="network" className="space-y-4">
                {data?.network && data.network.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Network Interfaces</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Interface</TableHead>
                            <TableHead>IP Address</TableHead>
                            <TableHead>MAC Address</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Speed</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.network.map((iface) => (
                            <TableRow key={iface.id}>
                              <TableCell className="font-medium">{iface.interface_name}</TableCell>
                              <TableCell>{iface.ip_address}</TableCell>
                              <TableCell>{iface.mac_address}</TableCell>
                              <TableCell>
                                <StatusBadge
                                  status={iface.status === "Up" ? "running" : "stopped"}
                                  label={iface.status || "Unknown"}
                                />
                              </TableCell>
                              <TableCell>{iface.speed}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No network information available</p>
                )}
              </TabsContent>

              <TabsContent value="services" className="space-y-4">
                {data?.services && data.services.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Running Services</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Service</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.services.map((service) => (
                            <TableRow key={service.id}>
                              <TableCell className="font-medium">{service.service_name}</TableCell>
                              <TableCell>{service.description}</TableCell>
                              <TableCell>
                                <StatusBadge
                                  status={service.status as any}
                                  label={service.status}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No services information available</p>
                )}
              </TabsContent>

              <TabsContent value="applications" className="space-y-4">
                {data?.applications && data.applications.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Installed Applications</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Application</TableHead>
                            <TableHead>Current Version</TableHead>
                            <TableHead>Latest Version</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.applications.map((app) => (
                            <TableRow key={app.id}>
                              <TableCell className="font-medium">{app.app_name}</TableCell>
                              <TableCell>{app.current_version}</TableCell>
                              <TableCell>{app.latest_version}</TableCell>
                              <TableCell>{app.category}</TableCell>
                              <TableCell>
                                <StatusBadge
                                  status={app.update_available ? "warning" : "running"}
                                  label={app.update_available ? "Update Available" : "Up to Date"}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No applications information available</p>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SystemDetailsModal;
