import { inject, Injectable, computed, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

import { Team, TeamMember } from '../models';
import { TeamRepository } from '../repositories';
import { TeamRole } from '../types';

@Injectable({
  providedIn: 'root'
})
export class TeamStore {
  private readonly repository = inject(TeamRepository);

  private readonly _teams = signal<Team[]>([]);
  private readonly _members = signal<TeamMember[]>([]);
  private readonly _loading = signal(false);

  readonly teams = this._teams.asReadonly();
  readonly loading = this._loading.asReadonly();

  getMemberCount(teamId: string): number {
    return this._members().filter(m => m.team_id === teamId).length;
  }

  currentTeam(): Team | null {
    const [team] = this._teams();
    return team ?? null;
  }

  currentTeamMembers(): TeamMember[] {
    return this._members();
  }

  async loadTeams(organizationId: string): Promise<void> {
    this._loading.set(true);
    try {
      const teams = await firstValueFrom(this.repository.findByOrganization(organizationId));
      this._teams.set(teams ?? []);
    } catch (error: unknown) {
      console.error('[TeamStore] Failed to load teams', error);
      this._teams.set([]);
    } finally {
      this._loading.set(false);
    }
  }

  async createTeam(organizationId: string, name: string, description?: string | null): Promise<Team> {
    const team: Team = {
      id: uuidv4(),
      organization_id: organizationId,
      name,
      description: description ?? undefined,
      created_at: new Date().toISOString()
    };
    this._teams.update(list => [...list, team]);
    return team;
  }

  async updateTeam(id: string, payload: Partial<Team>): Promise<Team | null> {
    let updated: Team | null = null;
    this._teams.update(list =>
      list.map(team => {
        if (team.id === id) {
          updated = { ...team, ...payload };
          return updated;
        }
        return team;
      })
    );
    return updated;
  }

  async deleteTeam(id: string): Promise<void> {
    this._teams.update(list => list.filter(team => team.id !== id));
    this._members.update(list => list.filter(member => member.team_id !== id));
  }

  async loadMembers(teamId: string): Promise<void> {
    // Placeholder: in a real implementation, fetch from repository
    this._members.set(this._members().filter(m => m.team_id === teamId));
  }

  async addMember(teamId: string, userId: string, role: TeamRole): Promise<void> {
    const member: TeamMember = {
      id: uuidv4(),
      team_id: teamId,
      user_id: userId,
      role,
      joined_at: new Date().toISOString()
    };
    this._members.update(list => [...list, member]);
  }

  async updateMemberRole(memberId: string, teamId: string, userId: string, role: TeamRole): Promise<void> {
    this._members.update(list =>
      list.map(member => (member.id === memberId && member.team_id === teamId && member.user_id === userId ? { ...member, role } : member))
    );
  }

  async removeMember(memberId: string, teamId: string): Promise<void> {
    this._members.update(list => list.filter(member => !(member.id === memberId && member.team_id === teamId)));
  }
}
