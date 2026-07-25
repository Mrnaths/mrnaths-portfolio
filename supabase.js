import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://igkfrrogocppxeigqopi.supabase.co";

const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlna2Zycm9nb2NwcHhlaWdxb3BpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NDYyNjEsImV4cCI6MjEwMDEyMjI2MX0.zLoEiku33oAA4DkaEUbeAbJtjb3zfs3PJar9nJPaWHg";

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;