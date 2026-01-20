import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, password, name, roleId } = req.body;

        // Validate inputs
        if (!email || !password || !name || !roleId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Get service role key from environment
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            return res.status(500).json({ error: 'Server configuration error' });
        }

        // Create admin client with service role key
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // Get role name
        const { data: roleData } = await supabaseAdmin
            .from('roles')
            .select('name')
            .eq('id', roleId)
            .single();

        const roleName = roleData?.name || 'tecnico';

        // Create user using Admin API (does not trigger auto-login)
        const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                name,
                role: roleName
            }
        });

        if (createError) {
            console.error('Error creating user:', createError);
            return res.status(400).json({ error: createError.message });
        }

        // Update profile with role_id (the trigger should handle this, but we'll ensure it)
        if (userData.user) {
            await supabaseAdmin
                .from('profiles')
                .update({
                    role_id: roleId,
                    status: 'Ativo' // Set as active immediately
                })
                .eq('id', userData.user.id);
        }

        return res.status(200).json({
            success: true,
            userId: userData.user?.id
        });

    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
