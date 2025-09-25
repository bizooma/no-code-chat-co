-- Assign platform owner role to joe@bizooma.com
-- User ID: cf76e8de-9088-428c-8653-37a90306dc54

-- Remove existing user role and insert platform owner role
DELETE FROM public.user_roles WHERE user_id = 'cf76e8de-9088-428c-8653-37a90306dc54';

INSERT INTO public.user_roles (user_id, role)
VALUES ('cf76e8de-9088-428c-8653-37a90306dc54', 'platform_owner');