import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SystemUpdateButtonProps {
  systemId: string;
  hostname: string;
}

const SystemUpdateButton = ({ systemId, hostname }: SystemUpdateButtonProps) => {
  const { toast } = useToast();
  const [updating, setUpdating] = useState(false);

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const { error } = await supabase.functions.invoke("salt-operations", {
        body: {
          operation: "run_update",
          data: { system_id: systemId },
        },
      });

      if (error) throw error;

      toast({
        title: "Update Started",
        description: `Patch update initiated for ${hostname}`,
      });
    } catch (error) {
      console.error("Error running update:", error);
      toast({
        title: "Error",
        description: "Failed to start system update",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleUpdate}
      disabled={updating}
      className="gap-2"
    >
      <Upload className="h-4 w-4" />
      {updating ? "Updating..." : "Run Updates"}
    </Button>
  );
};

export default SystemUpdateButton;
