# Admin User Setup

## Creating Your First Admin User

By default, all new users are assigned the 'user' role. To promote a user to admin, follow these steps:

### Step 1: Sign Up
1. Navigate to `/auth` in your application
2. Sign up with your email and password
3. You'll be automatically logged in as a regular user

### Step 2: Promote to Admin

In Lovable Cloud, go to the Database section and run this SQL query:

```sql
-- Replace 'your-email@example.com' with the email address of the user you want to promote
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'your-email@example.com'
ON CONFLICT (user_id, role) DO NOTHING;
```

### Step 3: Refresh Your Session
1. Sign out of the application
2. Sign back in
3. You should now see the "Admin" badge next to your name

## User Roles

### User (Default)
- Can view all systems and their details
- Can view system statistics
- Cannot manage other users

### Admin
- All user permissions
- Can manage user roles (via database queries)
- Can perform administrative tasks

## Managing User Roles via Database

### List all users and their roles
```sql
SELECT 
  u.email,
  u.created_at,
  COALESCE(
    array_agg(ur.role ORDER BY ur.role) FILTER (WHERE ur.role IS NOT NULL),
    ARRAY['user']::app_role[]
  ) as roles
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
GROUP BY u.id, u.email, u.created_at
ORDER BY u.created_at DESC;
```

### Add admin role to a user
```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'user@example.com'
ON CONFLICT (user_id, role) DO NOTHING;
```

### Remove admin role from a user
```sql
DELETE FROM public.user_roles
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user@example.com')
AND role = 'admin';
```

### Change user's display name
```sql
UPDATE public.profiles
SET display_name = 'New Display Name'
WHERE id = (SELECT id FROM auth.users WHERE email = 'user@example.com');
```

## Security Notes

- The `has_role()` function uses SECURITY DEFINER to avoid RLS recursion
- User roles are stored separately from profiles for security
- All authentication state is managed server-side
- Email confirmation is auto-enabled for faster testing (can be changed in Cloud settings)
