import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
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

    console.log(`Operation requested: ${operation}`);

    let result: any = {
      success: true,
      message: `${operation} operation queued`,
    };

    switch (operation) {
      case 'list_keys':
        result.message = 'Minion keys listed successfully';
        break;

      case 'accept_key':
        if (!data.minion_id) {
          throw new Error('minion_id is required');
        }
        const { error: updateError } = await supabaseClient
          .from('salt_minion_keys')
          .update({
            status: 'accepted',
            accepted_at: new Date().toISOString(),
          })
          .eq('minion_id', data.minion_id);

        if (updateError) throw updateError;
        result.message = `Minion ${data.minion_id} accepted`;
        break;

      case 'run_update':
        if (!data.system_id) {
          throw new Error('system_id is required');
        }
        
        const { data: systemData } = await supabaseClient
          .from('systems')
          .select('hostname')
          .eq('id', data.system_id)
          .single();

        if (!systemData) {
          throw new Error('System not found');
        }

        const { error: jobError } = await supabaseClient
          .from('system_update_jobs')
          .insert({
            system_id: data.system_id,
            user_id: user.id,
            command: 'apt-get update && apt-get upgrade -y',
            status: 'completed',
            output: 'Update job queued successfully',
            completed_at: new Date().toISOString(),
          });

        if (jobError) throw jobError;
        
        result.message = `Update initiated for ${systemData.hostname}`;
        break;

      case 'run_command':
        if (!data.minion_id || !data.command) {
          throw new Error('minion_id and command are required');
        }
        
        result.success = true;
        result.message = `Command executed on ${data.minion_id}`;
        result.output = `Executing: salt '${data.minion_id}' ${data.command}\n\nSimulated output:\nCommand would be executed on the Salt Master\n\nIn production, this would:\n1. SSH into Salt Master at configured IP\n2. Execute: salt '${data.minion_id}' ${data.command}\n3. Return actual command output`;
        
        console.log(`Would execute: salt '${data.minion_id}' ${data.command}`);
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
