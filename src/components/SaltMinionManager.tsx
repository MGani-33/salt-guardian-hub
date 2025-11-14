import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, RefreshCw, Server } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MinionKey {
  id: string;
  minion_id: string;
  status: string;
  created_at: string;
}

const SaltMinionManager = () => {
  const { toast } = useToast();
  const [minions, setMinions] = useState<MinionKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);

  const fetchMinions = async () => {
    const { data, error } = await supabase
      .from("salt_minion_keys")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setMinions(data);
    }
  };

  const refreshKeys = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("salt-operations", {
        body: { operation: "list_keys" },
      });

      if (error) throw error;

      await fetchMinions();
      
      toast({
        title: "Refreshed",
        description: "Minion keys refreshed successfully",
      });
    } catch (error) {
      console.error("Error refreshing keys:", error);
      toast({
        title: "Error",
        description: "Failed to refresh minion keys",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const acceptKey = async (minionId: string) => {
    setAccepting(minionId);
    try {
      const { error } = await supabase.functions.invoke("salt-operations", {
        body: {
          operation: "accept_key",
          data: { minion_id: minionId },
        },
      });

      if (error) throw error;

      await fetchMinions();
      
      toast({
        title: "Minion Accepted",
        description: `Minion ${minionId} has been accepted`,
      });
    } catch (error) {
      console.error("Error accepting key:", error);
      toast({
        title: "Error",
        description: "Failed to accept minion key",
        variant: "destructive",
      });
    } finally {
      setAccepting(null);
    }
  };

  useEffect(() => {
    fetchMinions();
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Salt Minions
            </CardTitle>
            <CardDescription>Manage pending and accepted minions</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshKeys}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {minions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No minions found. Install salt-minion on your servers and they will appear here.
          </div>
        ) : (
          <div className="space-y-3">
            {minions.map((minion) => (
              <div
                key={minion.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-card"
              >
                <div className="flex items-center gap-3">
                  <Server className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{minion.minion_id}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(minion.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {minion.status === "pending" ? (
                    <>
                      <Badge variant="outline" className="bg-warning/10 text-warning border-warning">
                        Pending
                      </Badge>
                      <Button
                        size="sm"
                        onClick={() => acceptKey(minion.minion_id)}
                        disabled={accepting === minion.minion_id}
                        className="gap-2"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {accepting === minion.minion_id ? "Accepting..." : "Accept"}
                      </Button>
                    </>
                  ) : (
                    <Badge variant="outline" className="bg-success/10 text-success border-success">
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Accepted
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SaltMinionManager;
