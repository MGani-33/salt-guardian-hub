-- Allow authenticated users to manage Salt minion keys
-- This enables the UI to add, accept, and manage minions

-- Allow INSERT for manual minion addition
CREATE POLICY "Authenticated users can insert minion keys"
ON public.salt_minion_keys
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow UPDATE for accepting minion keys
CREATE POLICY "Authenticated users can update minion keys"
ON public.salt_minion_keys
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow DELETE for removing minions
CREATE POLICY "Authenticated users can delete minion keys"
ON public.salt_minion_keys
FOR DELETE
TO authenticated
USING (true);

-- Also ensure the edge function can write system data by allowing service role
-- to INSERT/UPDATE on systems and related tables

CREATE POLICY "Service role can insert systems"
ON public.systems
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update systems"
ON public.systems
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can insert system_hardware"
ON public.system_hardware
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update system_hardware"
ON public.system_hardware
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can insert system_storage"
ON public.system_storage
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can delete system_storage"
ON public.system_storage
FOR DELETE
TO service_role
USING (true);

CREATE POLICY "Service role can insert system_network"
ON public.system_network
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can delete system_network"
ON public.system_network
FOR DELETE
TO service_role
USING (true);

CREATE POLICY "Service role can insert system_services"
ON public.system_services
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can delete system_services"
ON public.system_services
FOR DELETE
TO service_role
USING (true);

CREATE POLICY "Service role can insert system_applications"
ON public.system_applications
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can delete system_applications"
ON public.system_applications
FOR DELETE
TO service_role
USING (true);

CREATE POLICY "Service role can insert salt_minion_keys"
ON public.salt_minion_keys
FOR INSERT
TO service_role
WITH CHECK (true);