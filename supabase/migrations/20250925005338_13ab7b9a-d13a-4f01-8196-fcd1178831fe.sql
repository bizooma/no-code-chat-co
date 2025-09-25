-- Create platform owner account for joe@bizooma.com
-- This will insert the user manually with a specific password
-- Note: This is done via direct SQL since we can't use the signup function

-- First, let's create the user account (this would normally be done via Supabase Auth UI or API)
-- For manual creation, we'll create a script that can be run

-- Create a function to manually create the platform owner
CREATE OR REPLACE FUNCTION create_platform_owner(
  email TEXT,
  password TEXT,
  full_name TEXT
) RETURNS uuid AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- We'll create a separate function to assign platform owner role
CREATE OR REPLACE FUNCTION assign_platform_owner_role(user_id uuid)
RETURNS void AS $$
BEGIN
  -- Remove existing role if any
  DELETE FROM public.user_roles WHERE user_id = assign_platform_owner_role.user_id;
  
  -- Insert platform owner role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (assign_platform_owner_role.user_id, 'platform_owner');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;