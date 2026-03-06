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
    <header className="h-14 shrink-0 flex items-center justify-between px-6 bg-white border-b border-ink-200">
      <div />

      <div className="flex items-center gap-3">
        <button className="p-2 rounded-btn text-ink-400 hover:bg-ink-50 hover:text-ink-700 transition-colors">
          <Bell size={18} />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-brand-light text-brand-text">
              {initials}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-white border border-ink-200 shadow-modal">
            <DropdownMenuItem className="gap-2 text-sm cursor-pointer text-ink-700">
              <User size={14} /> Profilo
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-ink-100" />
            <DropdownMenuItem onClick={handleLogout} className="gap-2 text-sm cursor-pointer text-status-error">
              <LogOut size={14} /> Esci
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
