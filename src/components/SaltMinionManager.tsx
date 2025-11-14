import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, RefreshCw, Server, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [targetMinion, setTargetMinion] = useState("");
  const [command, setCommand] = useState("");
  const [executing, setExecuting] = useState(false);
  const [commandOutput, setCommandOutput] = useState("");

  const fetchMinions = async () => {
    const { data, error } = await supabase
      .from("salt_minion_keys" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setMinions(data as any[]);
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

  const executeCommand = async () => {
    if (!targetMinion || !command) {
      toast({
        title: "Missing Information",
        description: "Please specify both minion and command",
        variant: "destructive",
      });
      return;
    }

    setExecuting(true);
    setCommandOutput("");
    
    try {
      const { data, error } = await supabase.functions.invoke("salt-operations", {
        body: {
          operation: "run_command",
          data: { 
            minion_id: targetMinion,
            command: command 
          },
        },
      });

      if (error) throw error;

      setCommandOutput(JSON.stringify(data, null, 2));
      
      toast({
        title: "Command Executed",
        description: `Command executed on ${targetMinion}`,
      });
    } catch (error) {
      console.error("Error executing command:", error);
      setCommandOutput(`Error: ${error.message}`);
      toast({
        title: "Error",
        description: "Failed to execute command",
        variant: "destructive",
      });
    } finally {
      setExecuting(false);
    }
  };

  useEffect(() => {
    fetchMinions();
    
    // Set up realtime subscription for minion keys
    const channel = supabase
      .channel('minion-keys-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'salt_minion_keys'
        },
        () => {
          fetchMinions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="space-y-6">
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

    {/* Command Execution Card */}
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          Execute Command
        </CardTitle>
        <CardDescription>Run manual Salt commands on minions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="target-minion">Target Minion</Label>
            <Input
              id="target-minion"
              placeholder="minion-id or '*' for all"
              value={targetMinion}
              onChange={(e) => setTargetMinion(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="command">Command</Label>
            <Input
              id="command"
              placeholder="e.g., cmd.run 'apt-get update'"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
            />
          </div>
          <Button 
            onClick={executeCommand} 
            disabled={executing}
            className="w-full gap-2"
          >
            <Play className="h-4 w-4" />
            {executing ? "Executing..." : "Execute Command"}
          </Button>
        </div>

        {commandOutput && (
          <div className="mt-4">
            <Label>Output</Label>
            <div className="mt-2 p-4 bg-muted rounded-lg">
              <pre className="text-sm overflow-auto whitespace-pre-wrap">
                {commandOutput}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
};

export default SaltMinionManager;
