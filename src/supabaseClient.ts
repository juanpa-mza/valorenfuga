import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sjabtzfpmotsewyjzrwe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqYWJ0emZwbW90c2V3eWp6cndlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1NTU2NzksImV4cCI6MjA5NDEzMTY3OX0.4D3J_RxW9jY2hhTB-GAsH0iRE3Tyf3zRdWbPmKapaNU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);