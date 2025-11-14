import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, RefreshCw, Server, Play, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MinionKey {
  id: string;
  minion_id: string;
  status: string;
  created_at: string;
  fingerprint?: string;
  accepted_at?: string;
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
  const [quickAddMinion, setQuickAddMinion] = useState("");

  const fetchMinions = async () => {
    const { data, error } = await supabase
      .from("salt_minion_keys" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setMinions(data as any[]);
    }
  };

  const addMinionManually = async (minionId: string) => {
    try {
      const { error } = await supabase
        .from("salt_minion_keys" as any)
        .insert({
          minion_id: minionId,
          status: 'pending',
        });

      if (error) throw error;

      await fetchMinions();
      
      toast({
        title: "Minion Added",
        description: `Minion ${minionId} added to the list`,
      });
    } catch (error) {
      console.error("Error adding minion:", error);
      toast({
        title: "Error",
        description: "Failed to add minion",
        variant: "destructive",
      });
    }
  };

  const refreshKeys = async () => {
    setLoading(true);
    try {
      // For now, just refresh the list from database
      // In production, this would query the Salt Master via SSH
      await fetchMinions();
      
      toast({
        title: "Refreshed",
        description: "Minion list refreshed",
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
      {/* Quick Add Minion Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="quick-add-minion" className="text-sm font-medium mb-2 block">
                Add Minion Manually
              </Label>
              <div className="flex gap-2">
                <Input
                  id="quick-add-minion"
                  placeholder="Enter minion ID (e.g., zerodha-admin)"
                  value={quickAddMinion}
                  onChange={(e) => setQuickAddMinion(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && quickAddMinion) {
                      addMinionManually(quickAddMinion);
                      setQuickAddMinion('');
                    }
                  }}
                />
                <Button 
                  onClick={() => {
                    if (quickAddMinion) {
                      addMinionManually(quickAddMinion);
                      setQuickAddMinion('');
                    }
                  }}
                  disabled={!quickAddMinion}
                >
                  Add Minion
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Add minions from your Salt Master to manage them here
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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
          <div className="text-center py-8">
            <Server className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Minions Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first minion using the form above
            </p>
            <p className="text-xs text-muted-foreground">
              Example: zerodha-admin, web-server-01, etc.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Show pending minions first */}
            {minions.filter(m => m.status === "pending").length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-warning mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Pending Acceptance ({minions.filter(m => m.status === "pending").length})
                </h3>
                <div className="space-y-2">
                  {minions.filter(m => m.status === "pending").map((minion) => (
                    <div
                      key={minion.id}
                      className="flex items-center justify-between p-3 border border-warning/30 rounded-lg bg-warning/5"
                    >
                      <div className="flex items-center gap-3">
                        <Server className="h-5 w-5 text-warning" />
                        <div>
                          <p className="font-medium">{minion.minion_id}</p>
                          <p className="text-xs text-muted-foreground">
                            Added {new Date(minion.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-warning/10 text-warning border-warning">
                          Waiting
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
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Show accepted minions */}
            {minions.filter(m => m.status === "accepted").length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-success mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Accepted Minions ({minions.filter(m => m.status === "accepted").length})
                </h3>
                <div className="space-y-2">
                  {minions.filter(m => m.status === "accepted").map((minion) => (
                    <div
                      key={minion.id}
                      className="flex items-center justify-between p-3 border border-success/30 rounded-lg bg-success/5"
                    >
                      <div className="flex items-center gap-3">
                        <Server className="h-5 w-5 text-success" />
                        <div>
                          <p className="font-medium">{minion.minion_id}</p>
                          <p className="text-xs text-muted-foreground">
                            Accepted {minion.accepted_at ? new Date(minion.accepted_at).toLocaleString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-success/10 text-success border-success">
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Active
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
            <Label htmlFor="cmd-target-minion">Target Minion</Label>
            <Input
              id="cmd-target-minion"
              placeholder="minion-id or '*' for all"
              value={targetMinion}
              onChange={(e) => setTargetMinion(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="salt-command">Salt Command</Label>
            <Input
              id="salt-command"
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
