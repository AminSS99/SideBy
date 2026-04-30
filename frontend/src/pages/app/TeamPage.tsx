import React, { useState, useRef } from "react";
import { Users, Mail, Shield, ShieldAlert, ShieldCheck, User, MoreVertical, Trash2, Edit2 } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { toast } from "sonner";
import { useWorkspace } from "@/contexts/WorkspaceContext";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "member" | "viewer";
  status: "active" | "invited";
  joinedAt: string;
}

const initialMembers: TeamMember[] = [
  {
    id: "1",
    name: "Alex Snapshot",
    email: "alex@snapsolve.ink",
    role: "owner",
    status: "active",
    joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "2",
    name: "Sarah Researcher",
    email: "sarah@snapsolve.ink",
    role: "admin",
    status: "active",
    joinedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "3",
    name: "",
    email: "dev@snapsolve.ink",
    role: "member",
    status: "invited",
    joinedAt: new Date().toISOString(),
  }
];

const RoleIcon = ({ role }: { role: TeamMember["role"] }) => {
  switch (role) {
    case "owner": return <ShieldAlert className="h-3.5 w-3.5 text-orange-500" />;
    case "admin": return <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />;
    case "member": return <User className="h-3.5 w-3.5 text-blue-500" />;
    case "viewer": return <Shield className="h-3.5 w-3.5 text-[#fdfbf7]/40" />;
  }
};

const TeamPage = () => {
  const { activeWorkspace } = useWorkspace();
  const [members, setMembers] = useState<TeamMember[]>(initialMembers);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamMember["role"]>("member");
  const [isInviting, setIsInviting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from(".team-header", { y: -20, opacity: 0, duration: 0.8, ease: "power3.out" })
      .from(".team-invite", { y: 20, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.6")
      .from(".team-member", { x: -20, opacity: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" }, "-=0.4");
  }, { scope: containerRef });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setIsInviting(true);
    
    // Simulate API call
    setTimeout(() => {
      const newMember: TeamMember = {
        id: Date.now().toString(),
        name: "",
        email: inviteEmail.trim(),
        role: inviteRole,
        status: "invited",
        joinedAt: new Date().toISOString(),
      };
      
      setMembers([...members, newMember]);
      setInviteEmail("");
      setIsInviting(false);
      toast.success("Invitation sent", {
        description: `An invite has been sent to ${newMember.email}`,
      });
    }, 800);
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

      <div className="team-invite rounded-sm border border-[#2a2a2a] bg-[#111] p-6 sm:p-8">
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
      </div>

      <div className="rounded-sm border border-[#2a2a2a] bg-[#111] overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-[#2a2a2a] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-orange-500" />
            <h2 className="font-serif text-xl text-[#fdfbf7]">Workspace Members</h2>
          </div>
          <span className="rounded-sm border border-[#333] bg-[#0c0b0a] px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/60">
            {members.length} Total
          </span>
        </div>

        <div className="divide-y divide-[#2a2a2a]">
          {members.map((member) => (
            <div key={member.id} className="team-member flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:px-8 hover:bg-[#151515] transition-colors group">
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
  );
};

export default TeamPage;