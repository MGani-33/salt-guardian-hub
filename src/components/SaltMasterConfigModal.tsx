import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SaltMasterConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfigured: () => void;
}

const SaltMasterConfigModal = ({ open, onOpenChange, onConfigured }: SaltMasterConfigModalProps) => {
  const { toast } = useToast();
  const [masterIp, setMasterIp] = useState("10.10.23.222");
  const [sshUser, setSshUser] = useState("root");
  const [sshPassword, setSshPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!masterIp || !sshUser || !sshPassword) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("salt_master_config")
        .upsert({
          user_id: user.id,
          master_ip: masterIp,
          master_port: 4506,
          ssh_user: sshUser,
          ssh_password: sshPassword,
        });

      if (error) throw error;

      toast({
        title: "Configuration Saved",
        description: "Salt Master configuration has been saved successfully",
      });

      onConfigured();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving configuration:", error);
      toast({
        title: "Error",
        description: "Failed to save Salt Master configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configure Salt Master</DialogTitle>
          <DialogDescription>
            Enter your Salt Master connection details to manage minions and run updates
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="master-ip">Salt Master IP</Label>
            <Input
              id="master-ip"
              value={masterIp}
              onChange={(e) => setMasterIp(e.target.value)}
              placeholder="10.10.23.222"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ssh-user">SSH User</Label>
            <Input
              id="ssh-user"
              value={sshUser}
              onChange={(e) => setSshUser(e.target.value)}
              placeholder="root"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ssh-password">SSH Password</Label>
            <Input
              id="ssh-password"
              type="password"
              value={sshPassword}
              onChange={(e) => setSshPassword(e.target.value)}
              placeholder="Enter SSH password"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Configuration"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SaltMasterConfigModal;
