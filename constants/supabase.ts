// constants/supabase.ts
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kkrbgbvmmyuujeujiujq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrcmJnYnZtbXl1dWpldWppdWpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0ODUzODUsImV4cCI6MjA2OTA2MTM4NX0.UgVTGsW-zVIArLEiBn-gd6hjfxyNwxZnj0s-HPAEj7Q'
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
