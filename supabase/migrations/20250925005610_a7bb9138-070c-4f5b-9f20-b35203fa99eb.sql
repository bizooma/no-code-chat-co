-- Drop the existing function and recreate with proper parameter naming
DROP FUNCTION IF EXISTS assign_platform_owner_role(uuid);

-- Create the corrected function
CREATE OR REPLACE FUNCTION assign_platform_owner_role(target_user_id uuid)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Remove existing role if any
  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  
  -- Insert platform owner role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'platform_owner');
END;
$$;