-- Remove unauthenticated SELECT access from compartilhamentos_doc
-- This prevents token enumeration and unauthorized data exposure

-- Drop existing policy that allows unauthenticated access
DROP POLICY IF EXISTS "Usuários veem seus compartilhamentos" ON public.compartilhamentos_doc;

-- Recreate policy to only allow authenticated users to see their own shares
CREATE POLICY "Usuários veem seus compartilhamentos"
ON public.compartilhamentos_doc
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Add comment for documentation
COMMENT ON POLICY "Usuários veem seus compartilhamentos" ON public.compartilhamentos_doc 
IS 'Only authenticated users can view their own document shares. Public access is handled via validar-compartilhamento Edge Function.';