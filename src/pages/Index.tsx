import { useState } from "react";
import { Shield, Activity } from "lucide-react";
import ServiceStatusCard from "@/components/ServiceStatusCard";
import SystemUpdateCard from "@/components/SystemUpdateCard";
import ApplicationUpdatesCard from "@/components/ApplicationUpdatesCard";

const Index = () => {
  const [lastChecked, setLastChecked] = useState(new Date().toLocaleString());

  // Mock data - in production, this would come from backend API
  const mockApplications = [
    { name: "Salt Stack", currentVersion: "3006.5", latestVersion: "3006.5", updateAvailable: false },
    { name: "Wazuh Agent", currentVersion: "4.7.1", latestVersion: "4.7.2", updateAvailable: true },
    { name: "ClamAV", currentVersion: "1.2.1", latestVersion: "1.2.1", updateAvailable: false },
    { name: "System Kernel", currentVersion: "5.15.0-91", latestVersion: "5.15.0-91", updateAvailable: false },
  ];

  const handleRefresh = () => {
    setLastChecked(new Date().toLocaleString());
    // In production, this would trigger an API call to check for updates
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Salt Stack Monitor</h1>
              <p className="text-sm text-muted-foreground">System & Security Status Dashboard</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* System Updates Section */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">System Status</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <SystemUpdateCard
              lastChecked={lastChecked}
              updatesAvailable={mockApplications.some((app) => app.updateAvailable)}
              onRefresh={handleRefresh}
            />
          </div>
        </section>

        {/* Security Services Section */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Security Services</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <ServiceStatusCard
              title="Wazuh"
              description="Security information and event management"
              status="running"
              statusLabel="Running"
            />
            <ServiceStatusCard
              title="ClamAV Daemon"
              description="Antivirus engine for detecting threats"
              status="running"
              statusLabel="Running"
            />
            <ServiceStatusCard
              title="Inotify"
              description="File system event monitoring"
              status="running"
              statusLabel="Running"
            />
          </div>
        </section>

        {/* Hardware Configuration Section */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Hardware Configuration</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <ServiceStatusCard
              title="USB Ports"
              description="External device connectivity status"
              status="disabled"
              statusLabel="Disabled"
            />
          </div>
        </section>

        {/* Application Updates Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Application Versions</h2>
          </div>
          <ApplicationUpdatesCard applications={mockApplications} />
        </section>
      </main>
    </div>
  );
};

export default Index;
