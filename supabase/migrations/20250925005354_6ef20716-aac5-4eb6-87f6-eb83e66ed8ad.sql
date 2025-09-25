-- Fix security linter warnings by setting search_path for functions

-- Update create_platform_owner function with proper search_path
CREATE OR REPLACE FUNCTION create_platform_owner(
  email TEXT,
  password TEXT,
  full_name TEXT
) RETURNS uuid 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  new_user_id uuid;
BEGIN
  -- This function would need to be called via the Supabase Admin API
  -- For now, we'll prepare the infrastructure
  
  -- The actual user creation needs to be done through Supabase Auth
  -- This is a placeholder for the user_id that will be created
  new_user_id := gen_random_uuid();
  
  RETURN new_user_id;
END;
$$;

-- Update assign_platform_owner_role function with proper search_path  
CREATE OR REPLACE FUNCTION assign_platform_owner_role(user_id uuid)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Remove existing role if any
  DELETE FROM public.user_roles WHERE user_id = assign_platform_owner_role.user_id;
  
  -- Insert platform owner role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (assign_platform_owner_role.user_id, 'platform_owner');
END;
$$;