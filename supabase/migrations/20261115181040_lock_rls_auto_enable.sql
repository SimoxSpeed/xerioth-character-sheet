-- rls_auto_enable() è creata da Supabase ("Automatic RLS") ed è invocata dall'event trigger ensure_rls.
-- Non deve essere chiamabile via API (/rest/v1/rpc): togliamo EXECUTE ai ruoli dell'app.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
