import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Cpu, HardDrive, Network, Package } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SystemConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SystemConfigModal = ({ open, onOpenChange }: SystemConfigModalProps) => {
  const hardwareSpecs = {
    cpu: {
      model: "Intel Core i7-12700K",
      cores: 12,
      threads: 20,
      frequency: "3.6 GHz (5.0 GHz Boost)",
      cache: "25 MB",
    },
    memory: {
      total: "32 GB",
      type: "DDR4",
      speed: "3200 MHz",
      available: "18.5 GB",
      used: "13.5 GB",
    },
    storage: [
      { device: "/dev/sda", type: "SSD", size: "1 TB", used: "450 GB", mountPoint: "/" },
      { device: "/dev/sdb", type: "HDD", size: "2 TB", used: "1.2 TB", mountPoint: "/data" },
    ],
    gpu: {
      model: "NVIDIA GeForce RTX 3070",
      memory: "8 GB GDDR6",
      driver: "535.129.03",
    },
  };

  const networkSettings = {
    interfaces: [
      { name: "eth0", ip: "192.168.1.100", mac: "00:1A:2B:3C:4D:5E", status: "Up", speed: "1000 Mbps" },
      { name: "wlan0", ip: "192.168.1.101", mac: "00:1A:2B:3C:4D:5F", status: "Up", speed: "866 Mbps" },
    ],
    dns: ["8.8.8.8", "8.8.4.4", "1.1.1.1"],
    gateway: "192.168.1.1",
    hostname: "salt-master-01",
    domain: "local.network",
  };

  const installedPackages = [
    { name: "openssh-server", version: "1:9.5p1-1", category: "Network", size: "1.2 MB" },
    { name: "nginx", version: "1.24.0-1", category: "Web Server", size: "2.5 MB" },
    { name: "postgresql-16", version: "16.1-1", category: "Database", size: "45.8 MB" },
    { name: "docker-ce", version: "24.0.7-1", category: "Container", size: "125 MB" },
    { name: "python3.11", version: "3.11.6-1", category: "Runtime", size: "18.3 MB" },
    { name: "nodejs", version: "20.10.0-1", category: "Runtime", size: "35.2 MB" },
    { name: "git", version: "2.43.0-1", category: "Development", size: "8.5 MB" },
    { name: "vim", version: "9.0.2116-1", category: "Editor", size: "4.2 MB" },
    { name: "curl", version: "8.5.0-1", category: "Network", size: "650 KB" },
    { name: "wget", version: "1.21.4-1", category: "Network", size: "980 KB" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>System Configuration</DialogTitle>
          <DialogDescription>
            Detailed hardware specifications, network settings, and installed packages
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="hardware" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="hardware" className="gap-2">
              <Cpu className="h-4 w-4" />
              Hardware
            </TabsTrigger>
            <TabsTrigger value="network" className="gap-2">
              <Network className="h-4 w-4" />
              Network
            </TabsTrigger>
            <TabsTrigger value="packages" className="gap-2">
              <Package className="h-4 w-4" />
              Packages
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[60vh] mt-4">
            <TabsContent value="hardware" className="space-y-4">
              {/* CPU Card */}
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
                      <p className="font-medium">{hardwareSpecs.cpu.model}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Frequency</p>
                      <p className="font-medium">{hardwareSpecs.cpu.frequency}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cores / Threads</p>
                      <p className="font-medium">{hardwareSpecs.cpu.cores} / {hardwareSpecs.cpu.threads}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cache</p>
                      <p className="font-medium">{hardwareSpecs.cpu.cache}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Memory Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Memory</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="font-medium">{hardwareSpecs.memory.total}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Type</p>
                      <p className="font-medium">{hardwareSpecs.memory.type} @ {hardwareSpecs.memory.speed}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Used</p>
                      <p className="font-medium">{hardwareSpecs.memory.used}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Available</p>
                      <p className="font-medium">{hardwareSpecs.memory.available}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Storage Card */}
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
                      {hardwareSpecs.storage.map((disk) => (
                        <TableRow key={disk.device}>
                          <TableCell className="font-medium">{disk.device}</TableCell>
                          <TableCell>{disk.type}</TableCell>
                          <TableCell>{disk.size}</TableCell>
                          <TableCell>{disk.used}</TableCell>
                          <TableCell>{disk.mountPoint}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* GPU Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Graphics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Model</p>
                      <p className="font-medium">{hardwareSpecs.gpu.model}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Memory</p>
                      <p className="font-medium">{hardwareSpecs.gpu.memory}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Driver Version</p>
                      <p className="font-medium">{hardwareSpecs.gpu.driver}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="network" className="space-y-4">
              {/* Network Interfaces Card */}
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
                      {networkSettings.interfaces.map((iface) => (
                        <TableRow key={iface.name}>
                          <TableCell className="font-medium">{iface.name}</TableCell>
                          <TableCell>{iface.ip}</TableCell>
                          <TableCell>{iface.mac}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-success/10 text-success">
                              {iface.status}
                            </span>
                          </TableCell>
                          <TableCell>{iface.speed}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Network Configuration Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Network Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Hostname</p>
                      <p className="font-medium">{networkSettings.hostname}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Domain</p>
                      <p className="font-medium">{networkSettings.domain}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Gateway</p>
                      <p className="font-medium">{networkSettings.gateway}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">DNS Servers</p>
                      <p className="font-medium">{networkSettings.dns.join(", ")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="packages" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Installed Packages</CardTitle>
                  <CardDescription>
                    System and application packages currently installed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Package Name</TableHead>
                        <TableHead>Version</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Size</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {installedPackages.map((pkg) => (
                        <TableRow key={pkg.name}>
                          <TableCell className="font-medium">{pkg.name}</TableCell>
                          <TableCell>{pkg.version}</TableCell>
                          <TableCell>{pkg.category}</TableCell>
                          <TableCell>{pkg.size}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SystemConfigModal;
