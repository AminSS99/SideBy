import React, { useEffect, useMemo, useState, useRef } from "react";
import { Users, Mail, Shield, ShieldAlert, ShieldCheck, User, Trash2, Edit2, Activity, GitCompareArrows, Search, Database } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { toast } from "sonner";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useAuth } from "@/contexts/AuthContext";
import { GlowCard } from "@/components/GlowCard";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "member" | "viewer";
  status: "active" | "invited";
  joinedAt: string;
}

interface ActivityEvent {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
  type: "research" | "system" | "knowledge";
}

// Phase 1: Team data will come from Clerk organizations API in Phase 2.
// For now, show empty states instead of mock members/activity.
const initialMembers: TeamMember[] = [];
const mockActivity: ActivityEvent[] = [];

const RoleIcon = ({ role }: { role: TeamMember["role"] }) => {
  switch (role) {
    case "owner": return <ShieldAlert className="h-3.5 w-3.5 text-orange-500" />;
    case "admin": return <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />;
    case "member": return <User className="h-3.5 w-3.5 text-blue-500" />;
    case "viewer": return <Shield className="h-3.5 w-3.5 text-[#fdfbf7]/40" />;
  }
};

const ActionIcon = ({ type }: { type: ActivityEvent["type"] }) => {
  switch (type) {
    case "research": return <GitCompareArrows className="h-4 w-4 text-orange-400" />;
    case "system": return <Shield className="h-4 w-4 text-emerald-400" />;
    case "knowledge": return <Database className="h-4 w-4 text-blue-400" />;
  }
};

type Tab = "members" | "activity";

const TeamPage = () => {
  const { activeWorkspace } = useWorkspace();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("members");
  const [members, setMembers] = useState<TeamMember[]>(() => {
    const raw = localStorage.getItem("sideby.teamMembers");
    if (raw) {
      try {
        return JSON.parse(raw) as TeamMember[];
      } catch {
        return initialMembers;
      }
    }
    return initialMembers;
  });
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamMember["role"]>("member");
  const [isInviting, setIsInviting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from(".team-header", { y: -20, opacity: 0, duration: 0.8, ease: "power3.out" })
      .from(".team-nav", { y: 20, opacity: 0, duration: 0.6, ease: "power3.out" }, "-=0.6")
      .from(".team-content", { y: 20, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.4");
  }, { scope: containerRef });

  useEffect(() => {
    localStorage.setItem("sideby.teamMembers", JSON.stringify(members));
  }, [members]);

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

    return [owner, ...members.filter((member) => member.email !== owner.email)];
  }, [activeWorkspace?.createdAt, members, user?.email, user?.fullName, user?.id]);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setIsInviting(true);
    const email = inviteEmail.trim().toLowerCase();
    if (directoryMembers.some((member) => member.email.toLowerCase() === email)) {
      toast.warning("That person already has access.");
      setIsInviting(false);
      return;
    }

    const pendingMember: TeamMember = {
      id: crypto.randomUUID(),
      name: "",
      email,
      role: inviteRole,
      status: "invited",
      joinedAt: new Date().toISOString(),
    };

    setMembers((current) => [pendingMember, ...current]);
    setInviteEmail("");
    toast.success("Invite staged.", {
      description: `${email} was added as a pending ${inviteRole}.`,
    });
    setIsInviting(false);
  };

  const removeMember = (id: string, name: string, email: string) => {
    setMembers(members.filter(m => m.id !== id));
    toast.success("Member removed", {
      description: `${name || email} has been removed from the workspace.`,
    });
  };

  return (
    <div ref={containerRef} className="space-y-8 max-w-5xl">
      <div className="team-header flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
            Collaboration
          </p>
          <h1 className="mt-3 font-serif text-4xl text-[#fdfbf7] tracking-tight">
            Team & Access
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#fdfbf7]/60">
            Manage who has access to {activeWorkspace?.name || "your workspace"}. Invite colleagues to share research, comparisons, and prompts.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="team-nav flex items-center gap-2 border-b border-[#2a2a2a] pb-px">
        <button
          onClick={() => setActiveTab("members")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-widest transition-colors relative ${
            activeTab === "members" ? "text-orange-400" : "text-[#fdfbf7]/50 hover:text-[#fdfbf7]"
          }`}
        >
          <Users className="h-4 w-4" />
          Directory
          {activeTab === "members" && (
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-orange-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("activity")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-widest transition-colors relative ${
            activeTab === "activity" ? "text-orange-400" : "text-[#fdfbf7]/50 hover:text-[#fdfbf7]"
          }`}
        >
          <Activity className="h-4 w-4" />
          Activity Log
          {activeTab === "activity" && (
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-orange-500" />
          )}
        </button>
      </div>

      <div className="team-content">
        {activeTab === "members" ? (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Invite Form */}
            <GlowCard className="p-6 sm:p-8">
              <div className="mb-6 flex items-center gap-3 border-b border-[#2a2a2a] pb-4">
                <Mail className="h-5 w-5 text-orange-500" />
                <h2 className="font-serif text-xl text-[#fdfbf7]">Invite new members</h2>
              </div>
              
              <form onSubmit={handleInvite} className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1 w-full relative">
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="h-12 w-full rounded-sm border border-[#333] bg-[#0c0b0a] px-4 text-sm text-[#fdfbf7] outline-none transition-colors placeholder:text-[#fdfbf7]/30 focus:border-orange-500"
                  />
                </div>
                
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as TeamMember["role"])}
                  className="h-12 w-full sm:w-48 rounded-sm border border-[#333] bg-[#0c0b0a] px-4 text-sm text-[#fdfbf7] outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </select>

                <button
                  type="submit"
                  disabled={isInviting || !inviteEmail}
                  className="h-12 w-full sm:w-auto shrink-0 rounded-sm bg-[#fdfbf7] px-8 text-[10px] font-bold uppercase tracking-widest text-[#0a0a0a] transition-colors hover:bg-[#e0e0e0] disabled:opacity-50"
                >
                  {isInviting ? "Sending..." : "Send Invite"}
                </button>
              </form>
            </GlowCard>

            {/* Member List */}
            <div className="rounded-sm border border-[#2a2a2a] bg-[#111] overflow-hidden">
              <div className="p-6 sm:p-8 border-b border-[#2a2a2a] flex items-center justify-between bg-[#0c0b0a]">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-orange-500" />
                  <h2 className="font-serif text-xl text-[#fdfbf7]">Workspace Members</h2>
                </div>
                <span className="rounded-sm border border-[#333] bg-[#1a1a1a] px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/60">
                  {directoryMembers.length} Total
                </span>
              </div>

              <div className="divide-y divide-[#2a2a2a]">
                {directoryMembers.length === 0 ? (
                  <div className="p-10 text-center text-sm text-[#fdfbf7]/40">
                    No members yet. Send the first invite to start a shared workspace.
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
                              Pending
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#fdfbf7]/40">{member.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-8 ml-14 sm:ml-0">
                      <div className="flex flex-col sm:items-end gap-1">
                        <div className="flex items-center gap-1.5">
                          <RoleIcon role={member.role} />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/70">
                            {member.role}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#fdfbf7]/30">
                          {member.status === "active" ? "Joined" : "Invited"} {new Date(member.joinedAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          disabled={member.role === "owner"}
                          className="flex h-8 w-8 items-center justify-center rounded-sm border border-[#333] bg-[#0c0b0a] text-[#fdfbf7]/40 hover:text-orange-400 hover:border-orange-500/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          disabled={member.role === "owner"}
                          onClick={() => removeMember(member.id, member.name, member.email)}
                          className="flex h-8 w-8 items-center justify-center rounded-sm border border-[#333] bg-[#0c0b0a] text-[#fdfbf7]/40 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#fdfbf7]/30" />
                <input
                  type="text"
                  placeholder="Filter activity..."
                  className="h-10 w-full rounded-sm border border-[#333] bg-[#0c0b0a] pl-10 pr-4 text-sm text-[#fdfbf7] outline-none transition-colors placeholder:text-[#fdfbf7]/30 focus:border-orange-500"
                />
              </div>
            </div>

            <div className="rounded-sm border border-[#2a2a2a] bg-[#111] overflow-hidden">
              <div className="divide-y divide-[#2a2a2a]">
                {mockActivity.length === 0 ? (
                  <div className="p-10 text-center text-sm text-[#fdfbf7]/40">
                    No workspace activity yet. Completed comparisons, invites, and knowledge-base changes will appear here.
                  </div>
                ) : mockActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-4 p-5 hover:bg-[#151515] transition-colors">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-[#1a1a1a] border border-[#333]">
                      <ActionIcon type={activity.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#fdfbf7]">
                        <span className="font-semibold text-white">{activity.user}</span>
                        <span className="text-[#fdfbf7]/60 mx-1.5">{activity.action}</span>
                        <span className="font-serif italic text-orange-200">"{activity.target}"</span>
                      </p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/30">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamPage;
