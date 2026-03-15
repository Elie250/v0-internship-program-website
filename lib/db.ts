import { createClient } from '@supabase/supabase-js';

// Supabase database client initialization
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper functions
export const getUser = async (id) => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
    if (error) throw new Error(error.message);
    return data;
};

export const addUser = async (userData) => {
    const { data, error } = await supabase
        .from('users')
        .insert([userData]);
    if (error) throw new Error(error.message);
    return data;
};

export { supabase };