import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Bell, LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Topbar() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : profile?.email?.slice(0, 2).toUpperCase() ?? "U";

  return (
    <header
      className="h-14 shrink-0 flex items-center justify-between px-6"
      style={{
        backgroundColor: "hsl(var(--app-bg-secondary))",
        borderBottom: "1px solid hsl(var(--app-border-subtle))",
      }}
    >
      <div />

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button
          className="p-2 rounded-lg transition-colors"
          style={{ color: "hsl(var(--app-text-secondary))" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "hsl(var(--app-bg-elevated))")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <Bell size={18} />
        </button>

        {/* Avatar Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                backgroundColor: "hsl(var(--app-brand-dim))",
                color: "hsl(var(--app-brand))",
              }}
            >
              {initials}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48"
            style={{
              backgroundColor: "hsl(var(--app-bg-elevated))",
              border: "1px solid hsl(var(--app-border-default))",
            }}
          >
            <DropdownMenuItem className="gap-2 text-sm cursor-pointer" style={{ color: "hsl(var(--app-text-primary))" }}>
              <User size={14} /> Profilo
            </DropdownMenuItem>
            <DropdownMenuSeparator style={{ backgroundColor: "hsl(var(--app-border-subtle))" }} />
            <DropdownMenuItem onClick={handleLogout} className="gap-2 text-sm cursor-pointer" style={{ color: "hsl(var(--app-error))" }}>
              <LogOut size={14} /> Esci
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
