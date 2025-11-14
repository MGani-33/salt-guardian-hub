import { useNavigate } from "react-router-dom";
import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import SaltMasterConfigModal from "@/components/SaltMasterConfigModal";
import SaltMinionManager from "@/components/SaltMinionManager";
import { useState } from "react";

const SaltManagement = () => {
  const navigate = useNavigate();
  const [showConfig, setShowConfig] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Salt Stack Management</h1>
                <p className="text-sm text-muted-foreground">Manage minions and run system updates</p>
              </div>
            </div>
            <Button onClick={() => setShowConfig(true)} variant="outline">
              Configure Master
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <SaltMinionManager />
        </div>
      </main>

      <SaltMasterConfigModal
        open={showConfig}
        onOpenChange={setShowConfig}
        onConfigured={() => {}}
      />
    </div>
  );
};

export default SaltManagement;
