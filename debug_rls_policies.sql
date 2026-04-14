-- Check current RLS policies on organizations table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'organizations';

-- Check current RLS policies on users table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'users';

-- Apply the missing INSERT policies if they don't exist
DO $$
BEGIN
    -- Check if organizations INSERT policy exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'organizations' AND policyname = 'Bootstrap can insert org' AND cmd = 'INSERT'
    ) THEN
        CREATE POLICY "Bootstrap can insert org" ON organizations
        FOR INSERT WITH CHECK (true);
        RAISE NOTICE 'Created INSERT policy for organizations table';
    ELSE
        RAISE NOTICE 'INSERT policy for organizations table already exists';
    END IF;

    -- Check if users INSERT policy exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'users' AND policyname = 'Bootstrap can insert user' AND cmd = 'INSERT'
    ) THEN
        CREATE POLICY "Bootstrap can insert user" ON users
        FOR INSERT WITH CHECK (true);
        RAISE NOTICE 'Created INSERT policy for users table';
    ELSE
        RAISE NOTICE 'INSERT policy for users table already exists';
    END IF;
END $$;