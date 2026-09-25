import type { Group, Profile } from '../../types/domain';
import { supabase } from './client';
import { AppError, toAppError, unwrap } from './errors';
import { getProfiles } from './profiles';

export interface GroupMember {
  profile: Profile;
  isAdmin: boolean;
}

export async function getMyGroups(): Promise<Group[]> {
  const rows = unwrap(await supabase.rpc('my_groups'));
  return rows.map((r) => ({ id: r.id, name: r.name, inviteCode: r.invite_code, memberCount: r.member_count, isAdmin: r.role === 'ADMIN' }));
}

/** @returns The joined group's id. */
export async function joinGroup(code: string): Promise<string> {
  const { data, error } = await supabase.rpc('join_group', { p_code: code });
  if (error) throw toAppError(error);
  if (!data) throw new AppError('invite_not_found');
  return data.id;
}

/** @returns The new group's id. */
export async function createGroup(name: string): Promise<string> {
  const row = unwrap(await supabase.rpc('create_group', { p_name: name }));
  return row.id;
}

export async function leaveGroup(groupId: string, userId: string): Promise<void> {
  const { error } = await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', userId);
  if (error) throw toAppError(error);
}

/** Members of a group the caller belongs to, admins first. */
export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  const rows = unwrap(await supabase.from('group_members').select('user_id, role, joined_at').eq('group_id', groupId).order('joined_at'));
  const profiles = await getProfiles(rows.map((r) => r.user_id));
  const byId = new Map(profiles.map((p) => [p.id, p]));
  return rows
    .map((r) => ({ profile: byId.get(r.user_id), isAdmin: r.role === 'ADMIN' }))
    .filter((m): m is GroupMember => !!m.profile)
    .sort((a, b) => Number(b.isAdmin) - Number(a.isAdmin));
}
