import { useState } from "react";
import { Shield, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SystemsListTable from "@/components/SystemsListTable";
import SystemDetailsModal from "@/components/SystemDetailsModal";
import SystemStatsCards from "@/components/SystemStatsCards";
import { useSystems, useSystemStats } from "@/hooks/useSystems";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);

  const { data: systems, isLoading: systemsLoading } = useSystems({
    status: statusFilter,
    search: searchQuery,
  });

  const { data: stats, isLoading: statsLoading } = useSystemStats();

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
              <p className="text-sm text-muted-foreground">Multi-System Management Dashboard</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <section className="mb-8">
          <SystemStatsCards stats={stats} isLoading={statsLoading} />
        </section>

        {/* Systems List Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Systems Overview</h2>
            <div className="flex gap-4 items-center">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search hostname or IP..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {systemsLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading systems...</p>
            </div>
          ) : (
            <SystemsListTable
              systems={systems || []}
              onSystemSelect={setSelectedSystemId}
            />
          )}
        </section>
      </main>

      <SystemDetailsModal
        systemId={selectedSystemId}
        onClose={() => setSelectedSystemId(null)}
      />
    </div>
  );
};

export default Index;
