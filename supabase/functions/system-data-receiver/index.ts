import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate API key
    const apiKey = req.headers.get('x-api-key');
    const expectedApiKey = Deno.env.get('SALT_API_KEY');
    
    if (!apiKey || apiKey !== expectedApiKey) {
      console.error('Invalid or missing API key');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const data = await req.json();
    console.log('Received system data:', { hostname: data.hostname, ip: data.ip_address });

    // Upsert system
    const { data: system, error: systemError } = await supabase
      .from('systems')
      .upsert({
        hostname: data.hostname,
        ip_address: data.ip_address,
        os_type: data.os_type,
        os_version: data.os_version,
        status: data.status || 'online',
        last_seen: new Date().toISOString(),
      }, {
        onConflict: 'hostname',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (systemError) {
      console.error('Error upserting system:', systemError);
      throw systemError;
    }

    const systemId = system.id;

    // Update hardware
    if (data.hardware) {
      const { error: hwError } = await supabase
        .from('system_hardware')
        .upsert({
          system_id: systemId,
          cpu_model: data.hardware.cpu_model,
          cpu_cores: data.hardware.cpu_cores,
          cpu_threads: data.hardware.cpu_threads,
          cpu_frequency: data.hardware.cpu_frequency,
          memory_total: data.hardware.memory_total,
          memory_used: data.hardware.memory_used,
          memory_type: data.hardware.memory_type,
          gpu_model: data.hardware.gpu_model,
          gpu_memory: data.hardware.gpu_memory,
        }, {
          onConflict: 'system_id',
          ignoreDuplicates: false
        });

      if (hwError) console.error('Hardware error:', hwError);
    }

    // Update storage
    if (data.storage && Array.isArray(data.storage)) {
      await supabase.from('system_storage').delete().eq('system_id', systemId);
      
      for (const storage of data.storage) {
        await supabase.from('system_storage').insert({
          system_id: systemId,
          device: storage.device,
          type: storage.type,
          size: storage.size,
          used: storage.used,
          mount_point: storage.mount_point,
        });
      }
    }

    // Update network interfaces
    if (data.network && Array.isArray(data.network)) {
      await supabase.from('system_network').delete().eq('system_id', systemId);
      
      for (const net of data.network) {
        await supabase.from('system_network').insert({
          system_id: systemId,
          interface_name: net.interface_name,
          ip_address: net.ip_address,
          mac_address: net.mac_address,
          status: net.status,
          speed: net.speed,
        });
      }
    }

    // Update services
    if (data.services && Array.isArray(data.services)) {
      await supabase.from('system_services').delete().eq('system_id', systemId);
      
      for (const service of data.services) {
        await supabase.from('system_services').insert({
          system_id: systemId,
          service_name: service.service_name,
          status: service.status,
          description: service.description,
        });
      }
    }

    // Update applications
    if (data.applications && Array.isArray(data.applications)) {
      await supabase.from('system_applications').delete().eq('system_id', systemId);
      
      for (const app of data.applications) {
        await supabase.from('system_applications').insert({
          system_id: systemId,
          app_name: app.app_name,
          current_version: app.current_version,
          latest_version: app.latest_version,
          update_available: app.update_available,
          category: app.category,
          size: app.size,
        });
      }
    }

    console.log('System data processed successfully');
    return new Response(
      JSON.stringify({ success: true, system_id: systemId }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing system data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
