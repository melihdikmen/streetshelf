/**
 * The seeded accounts (supabase/seed.sql), for the dev-only quick sign-in
 * screen. Keep in step with the seed; `noteKey` points at `dev.notes.*`,
 * which says what each account is for.
 */
export interface TestAccount {
  email: string;
  name: string;
  noteKey: 'melih' | 'ayse' | 'mehmet' | 'zeynep' | 'can' | 'elif';
}

export const TEST_ACCOUNTS: TestAccount[] = [
  { email: 'melih@streetshelf.test', name: 'Melih', noteKey: 'melih' },
  { email: 'ayse@streetshelf.test', name: 'Ayşe K.', noteKey: 'ayse' },
  { email: 'mehmet@streetshelf.test', name: 'Mehmet D.', noteKey: 'mehmet' },
  { email: 'zeynep@streetshelf.test', name: 'Zeynep A.', noteKey: 'zeynep' },
  { email: 'can@streetshelf.test', name: 'Can Y.', noteKey: 'can' },
  { email: 'elif@streetshelf.test', name: 'Elif S.', noteKey: 'elif' },
];
