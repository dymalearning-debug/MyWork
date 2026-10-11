-- The administrator role (secret key: end-to-end tests, future maintenance tasks) also needs an
-- explicit grant, since no table is exposed to the Data API by default on this project.
-- It bypasses RLS: the secret key never reaches the browser.
grant select, insert, update, delete on public.profiles to service_role;
