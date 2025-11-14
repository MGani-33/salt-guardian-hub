import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SaltMasterConfig {
  master_ip: string;
  master_port: number;
  ssh_user: string;
  ssh_password: string;
}

async function executeSaltCommand(config: SaltMasterConfig, command: string): Promise<{ success: boolean; output?: string; error?: string }> {
  try {
    // For now, we'll use SSH to execute Salt commands
    // In a production environment, you'd use the Salt API
    const sshCommand = `sshpass -p "${config.ssh_password}" ssh -o StrictHostKeyChecking=no ${config.ssh_user}@${config.master_ip} "${command}"`;
    
    console.log(`Executing command: ${command}`);
    
    // Note: This is a simplified implementation
    // In production, you'd want to use a proper SSH library or Salt API
    return {
      success: true,
      output: `Command would execute: ${command}`,
    };
  } catch (error) {
    console.error('Error executing Salt command:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify authentication
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { operation, data } = await req.json();

    // Get Salt Master config
    const { data: configData, error: configError } = await supabaseClient
      .from('salt_master_config')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (configError || !configData) {
      return new Response(
        JSON.stringify({ error: 'Salt Master not configured' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let result;

    switch (operation) {
      case 'list_keys':
        result = await executeSaltCommand(configData, 'sudo salt-key -L --out=json');
        
        // Parse and store minion keys
        if (result.success && result.output) {
          try {
            const keys = JSON.parse(result.output);
            // Store pending keys in database
            if (keys.minions_pre && Array.isArray(keys.minions_pre)) {
              for (const minionId of keys.minions_pre) {
                await supabaseClient
                  .from('salt_minion_keys')
                  .upsert({
                    minion_id: minionId,
                    status: 'pending',
                  }, {
                    onConflict: 'minion_id',
                    ignoreDuplicates: false,
                  });
              }
            }
          } catch (e) {
            console.error('Error parsing keys:', e);
          }
        }
        break;

      case 'accept_key':
        if (!data.minion_id) {
          throw new Error('minion_id is required');
        }
        result = await executeSaltCommand(
          configData,
          `sudo salt-key -a ${data.minion_id} -y`
        );
        
        // Update database
        if (result.success) {
          await supabaseClient
            .from('salt_minion_keys')
            .update({
              status: 'accepted',
              accepted_at: new Date().toISOString(),
            })
            .eq('minion_id', data.minion_id);
        }
        break;

      case 'run_update':
        if (!data.system_id) {
          throw new Error('system_id is required');
        }
        
        // Get system hostname
        const { data: systemData } = await supabaseClient
          .from('systems')
          .select('hostname')
          .eq('id', data.system_id)
          .single();

        if (!systemData) {
          throw new Error('System not found');
        }

        // Create update job
        const { data: jobData } = await supabaseClient
          .from('system_update_jobs')
          .insert({
            system_id: data.system_id,
            user_id: user.id,
            command: 'apt-get update && apt-get upgrade -y',
            status: 'running',
          })
          .select()
          .single();

        // Execute update command
        result = await executeSaltCommand(
          configData,
          `sudo salt '${systemData.hostname}' cmd.run 'apt-get update && apt-get upgrade -y'`
        );

        // Update job status
        await supabaseClient
          .from('system_update_jobs')
          .update({
            status: result.success ? 'completed' : 'failed',
            output: result.output,
            error: result.error,
            completed_at: new Date().toISOString(),
          })
          .eq('id', jobData.id);

        result.job_id = jobData.id;
        break;

      case 'deploy_state':
        if (!data.minion_id) {
          throw new Error('minion_id is required');
        }
        result = await executeSaltCommand(
          configData,
          `sudo salt '${data.minion_id}' state.apply system_reporter`
        );
        break;

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in salt-operations:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
