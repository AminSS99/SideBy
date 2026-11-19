import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { KeyboardSpacer } from "@/components/KeyboardSpacer";

import { Users, Mail, Shield, ShieldAlert, ShieldCheck, User, Trash2, Edit2, GitCompareArrows, Database } from "@/components/icons";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { toast } from "sonner";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useAuth } from "@/contexts/AuthContext";
import { GlowCard } from "@/components/GlowCard";
import { apiFetch } from "@/lib/api";
import { buildApiUrl } from "@/config/env";
import { formatDate, statusLabel, useI18n, type MessageKey, type TFunction } from "@/i18n";
import { localizeServerMessage } from "@/i18n/serverMessages";

interface TeamMember {
  id: string;
  userId?: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "member" | "viewer";
  status: "active" | "invited";
  joinedAt: string;
}

const ROLE_KEYS: Record<TeamMember["role"], MessageKey> = {
  owner: "wsp.team.role.owner",
  admin: "wsp.team.role.admin",
  member: "wsp.team.role.member",
  viewer: "wsp.team.role.viewer",
};

const roleLabel = (t: TFunction, role: TeamMember["role"]) => t(ROLE_KEYS[role]);

const RoleIcon = ({ role }: { role: TeamMember["role"] }) => {
  switch (role) {
    case "owner": return <ShieldAlert className="h-3.5 w-3.5 text-orange-500" />;
    case "admin": return <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />;
    case "member": return <User className="h-3.5 w-3.5 text-blue-500" />;
    case "viewer": return <Shield className="h-3.5 w-3.5 text-[#fdfbf7]/40" />;
  }
};

const TeamPage = () => {
  const { t, lang } = useI18n();
  const { activeWorkspace } = useWorkspace();
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamMember[]>([]);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamMember["role"]>("member");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const inviteInputRef = useRef<HTMLInputElement>(null);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<TeamMember["role"]>("member");
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tl = gsap.timeline({ defaults: { clearProps: "transform,opacity" } });
    tl.from(".team-header", { y: -20, opacity: 0, duration: 0.8, ease: "power3.out" })
      .from(".team-content", { y: 20, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.4");
  }, { scope: containerRef });

  const loadTeam = useCallback(async () => {
    if (!activeWorkspace?.id) return;
    setTeamError(null);
    const response = await apiFetch(buildApiUrl(`/api/team?workspaceId=${activeWorkspace.id}`));
    const data = (await response.json()) as {
      members: TeamMember[];
      invitations: Array<{ id: string; email: string; role: TeamMember["role"]; status: string; createdAt: string }>;
    };
    setMembers(data.members);
    setInvitations(data.invitations.map((invite) => ({
      id: invite.id,
      name: "",
      email: invite.email,
      role: invite.role,
      status: "invited" as const,
      joinedAt: invite.createdAt,
    })));
  }, [activeWorkspace?.id]);

  useEffect(() => {
    void loadTeam().catch((error) => {
      setMembers([]);
      setInvitations([]);
      setTeamError(error instanceof Error ? localizeServerMessage(t, error.message) : t("wsp.team.loadError"));
    });
  }, [loadTeam, t]);

  const directoryMembers = useMemo<TeamMember[]>(() => {
    if (!user?.email) return members;
    const owner: TeamMember = {
      id: user.id,
      name: user.fullName || user.email.split("@")[0],
      email: user.email,
      role: "owner",
      status: "active",
      joinedAt: activeWorkspace?.createdAt || new Date().toISOString(),
    };

    const allMembers = [...members, owner, ...invitations];
    const uniqueMembers: TeamMember[] = [];
    const seenEmails = new Set<string>();
    for (const member of allMembers) {
      if (!seenEmails.has(member.email)) {
        seenEmails.add(member.email);
        uniqueMembers.push(member);
      }
    }
    return uniqueMembers;
  }, [activeWorkspace?.createdAt, invitations, members, user?.email, user?.fullName, user?.id]);

  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const validateInviteEmail = (value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) return t("wsp.team.emailRequired");
    if (!EMAIL_PATTERN.test(trimmed)) return t("wsp.team.emailInvalid");
    if (directoryMembers.some((member) => member.email.toLowerCase() === trimmed.toLowerCase())) {
      return t("wsp.team.emailDuplicate");
    }
    return null;
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateInviteEmail(inviteEmail);
    if (validationError) {
      setInviteError(validationError);
      inviteInputRef.current?.focus();
      toast.error(t("wsp.team.cannotInvite"), { description: validationError });
      return;
    }
    setInviteError(null);

    setIsInviting(true);
    try {
      const email = inviteEmail.trim().toLowerCase();
      if (!activeWorkspace?.id) return;

      const response = await apiFetch(buildApiUrl("/api/team"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: activeWorkspace.id,
          email,
          role: inviteRole,
        }),
      });
      const data = (await response.json()) as {
        invitation: { id: string; email: string; role: TeamMember["role"]; createdAt: string };
      };
      setInvitations((current) => [{
        id: data.invitation.id,
        name: "",
        email: data.invitation.email,
        role: data.invitation.role,
        status: "invited",
        joinedAt: data.invitation.createdAt,
      }, ...current]);
      setInviteEmail("");
      toast.success(t("wsp.team.inviteSent"), {
        description: t("wsp.team.inviteSentDesc", {
          email,
          role: roleLabel(t, inviteRole).toLowerCase(),
        }),
      });
    } catch (error) {
      toast.error(t("wsp.team.inviteFail"), {
        description: error instanceof Error ? localizeServerMessage(t, error.message) : t("wsp.common.tryAgainShortly"),
      });
    } finally {
      setIsInviting(false);
    }
  };  const handleRoleChange = async (memberId: string, newRole: TeamMember["role"]) => {
    if (!activeWorkspace?.id) return;
    try {
      const response = await apiFetch(buildApiUrl("/api/team"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: activeWorkspace.id,
          membershipId: memberId,
          role: newRole,
        }),
      });
      if (!response.ok) {
        const data = await response.json() as { error?: string };
        throw new Error(data.error ? localizeServerMessage(t, data.error) : t("wsp.team.roleUpdateFailMsg"));
      }
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
      );
      setEditingMember(null);
      toast.success(t("wsp.team.roleUpdated"));
    } catch (error) {
      toast.error(t("wsp.team.roleUpdateFail"), {
        description: error instanceof Error ? localizeServerMessage(t, error.message) : t("wsp.common.tryAgainShortly"),
      });
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!activeWorkspace?.id) return;
    if (!window.confirm(t("wsp.team.removeConfirm", { name: memberName }))) return;

    try {
      const response = await apiFetch(buildApiUrl("/api/team"), {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: activeWorkspace.id,
          membershipId: memberId,
        }),
      });
      if (!response.ok) {
        const data = await response.json() as { error?: string };
        throw new Error(data.error ? localizeServerMessage(t, data.error) : t("wsp.team.removeFailMsg"));
      }
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      setInvitations((prev) => prev.filter((m) => m.id !== memberId));
      toast.success(t("wsp.team.memberRemoved"));
    } catch (error) {
      toast.error(t("wsp.team.removeFail"), {
        description: error instanceof Error ? localizeServerMessage(t, error.message) : t("wsp.common.tryAgainShortly"),
      });
    }
  };

  return (
    <div ref={containerRef} className="space-y-8 max-w-5xl">
      <div className="team-header flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
            {t("wsp.team.kicker")}
          </p>
          <h1 className="mt-3 font-serif text-4xl text-[#fdfbf7] tracking-tight">
            {t("wsp.team.title")}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#fdfbf7]/60">
            {t("wsp.team.subtitle", { workspace: activeWorkspace?.name || t("wsp.team.yourWorkspace") })}
          </p>
        </div>
      </div>

      <div className="team-content">
        <div className="space-y-8 animate-in fade-in duration-500">
          {teamError && (
            <div className="rounded-sm border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200/80">
              {teamError}
            </div>
          )}
          {/* Invite Form */}
          <GlowCard className="p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3 border-b border-[#2a2a2a] pb-4">
              <Mail className="h-5 w-5 text-orange-500" />
              <h2 className="font-serif text-xl text-[#fdfbf7]">{t("wsp.team.inviteHeading")}</h2>
            </div>

            <form onSubmit={(event) => void handleInvite(event)} noValidate className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1 w-full space-y-2">
                <input
                  ref={inviteInputRef}
                  type="email"
                  autoComplete="email"
                  value={inviteEmail}
                  onChange={(e) => {
                    setInviteEmail(e.target.value);
                    if (inviteError) setInviteError(validateInviteEmail(e.target.value));
                  }}
                  aria-invalid={!!inviteError}
                  aria-describedby={inviteError ? "invite-email-error" : undefined}
                  placeholder="colleague@company.com"
                  className={`h-12 w-full rounded-sm border bg-[#0c0b0a] px-4 text-sm text-[#fdfbf7] outline-none transition-colors placeholder:text-[#fdfbf7]/30 focus:border-orange-500 ${inviteError ? "border-red-500" : "border-[#333]"}`}
                />
                {inviteError && (
                  <p id="invite-email-error" role="alert" className="text-xs text-red-400">
                    {inviteError}
                  </p>
                )}
              </div>

              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as TeamMember["role"])}
                className="h-12 w-full sm:w-48 rounded-sm border border-[#333] bg-[#0c0b0a] px-4 text-sm text-[#fdfbf7] outline-none focus:border-orange-500 cursor-pointer"
              >
                <option value="admin">{t("wsp.team.role.admin")}</option>
                <option value="member">{t("wsp.team.role.member")}</option>
                <option value="viewer">{t("wsp.team.role.viewer")}</option>
              </select>

              <button
                type="submit"
                disabled={isInviting || !EMAIL_PATTERN.test(inviteEmail.trim())}
                title={!EMAIL_PATTERN.test(inviteEmail.trim()) ? t("wsp.team.inviteButtonHint") : undefined}
                className="h-12 w-full sm:w-auto shrink-0 rounded-sm bg-[#fdfbf7] px-8 text-[10px] font-bold uppercase tracking-widest text-[#0a0a0a] transition-colors hover:bg-[#e0e0e0] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isInviting ? t("wsp.team.sending") : t("wsp.team.sendInvite")}
              </button>
            </form>
          </GlowCard>

          {/* Member List */}
          <div className="rounded-sm border border-[#2a2a2a] bg-[#111] overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-[#2a2a2a] flex items-center justify-between bg-[#0c0b0a]">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-orange-500" />
                <h2 className="font-serif text-xl text-[#fdfbf7]">{t("wsp.team.membersHeading")}</h2>
              </div>
              <span className="rounded-sm border border-[#333] bg-[#1a1a1a] px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/60">
                {t("wsp.team.totalCount", { count: directoryMembers.length })}
              </span>
            </div>

            <div className="divide-y divide-[#2a2a2a]">
              {directoryMembers.length === 0 ? (
                <div className="p-10 text-center text-sm text-[#fdfbf7]/40">
                  {t("wsp.team.empty")}
                </div>
              ) : directoryMembers.map((member) => (
                <div key={member.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:px-8 hover:bg-[#151515] transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-[#1a1a1a] border border-[#333] font-serif text-lg text-[#fdfbf7]/50">
                      {member.name ? member.name.charAt(0).toUpperCase() : member.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-serif text-[#fdfbf7] text-lg">
                          {member.name || member.email.split("@")[0]}
                        </p>
                        {member.status === "invited" && (
                          <span className="rounded-sm border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-amber-500">
                            {statusLabel(t, "pending")}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#fdfbf7]/40">{member.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-8 ml-14 sm:ml-0">
                    <div className="flex flex-col sm:items-end gap-1">
                      {editingMember === member.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value as TeamMember["role"])}
                            className="h-8 rounded-sm border border-[#333] bg-[#0c0b0a] px-2 text-xs text-[#fdfbf7] outline-none focus:border-orange-500 cursor-pointer"
                          >
                            <option value="admin">{t("wsp.team.role.admin")}</option>
                            <option value="member">{t("wsp.team.role.member")}</option>
                            <option value="viewer">{t("wsp.team.role.viewer")}</option>
                          </select>
                          <button
                            onClick={() => void handleRoleChange(member.id, editRole)}
                            className="h-8 rounded-sm bg-orange-500 px-3 text-[10px] font-bold uppercase tracking-widest text-black hover:bg-orange-400 transition-colors"
                          >
                            {t("wsp.common.save")}
                          </button>
                          <button
                            onClick={() => setEditingMember(null)}
                            className="h-8 rounded-sm border border-[#333] bg-[#0c0b0a] px-3 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/60 hover:text-white transition-colors"
                          >
                            {t("wsp.common.cancel")}
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-1.5">
                            <RoleIcon role={member.role} />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/70">
                              {roleLabel(t, member.role)}
                            </span>
                          </div>
                          <span className="text-[10px] text-[#fdfbf7]/30">
                            {member.status === "active"
                              ? t("wsp.team.joinedOn", { date: formatDate(member.joinedAt, lang) })
                              : t("wsp.team.invitedOn", { date: formatDate(member.joinedAt, lang) })}
                          </span>
                        </>
                      )}
                    </div>

                    {editingMember !== member.id && (
                      <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                        <button
                          disabled={member.role === "owner"}
                          aria-label={t("wsp.team.editRoleAria")}
                          onClick={() => {
                            setEditingMember(member.id);
                            setEditRole(member.role === "owner" ? "admin" : member.role);
                          }}
                          className="flex min-h-11 min-w-11 items-center justify-center rounded-sm border border-[#333] bg-[#0c0b0a] text-[#fdfbf7]/40 hover:text-orange-400 hover:border-orange-500/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus-visible:opacity-100 group-focus-within:opacity-100"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          disabled={member.role === "owner"}
                          aria-label={t("wsp.team.removeMemberAria")}
                          onClick={() => void handleRemoveMember(member.id, member.name || member.email)}
                          className="flex min-h-11 min-w-11 items-center justify-center rounded-sm border border-[#333] bg-[#0c0b0a] text-[#fdfbf7]/40 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus-visible:opacity-100 group-focus-within:opacity-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
  <KeyboardSpacer />
    </div>
  );
};

export default TeamPage;
