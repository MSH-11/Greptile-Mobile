import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from "@react-native-async-storage/async-storage";

export const supabase = createClient("https://gzokaoqirogjwtwuhpfn.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6b2thb3Fpcm9nand0d3VocGZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjMwOTk5MTQsImV4cCI6MjAzODY3NTkxNH0.PLA3f4DS7JQtrfgqtxGjAvjjkFVrm44jICg5SiOVD-4", {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});