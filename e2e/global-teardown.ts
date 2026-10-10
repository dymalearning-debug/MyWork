import { deleteTestUsers } from "./helpers/supabase-admin";

// After each run: delete every test account (recognizable address), including leftovers
// from an interrupted run. Their profiles are deleted with them (on delete cascade).
export default async function globalTeardown() {
  await deleteTestUsers();
}
