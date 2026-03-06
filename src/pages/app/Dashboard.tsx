import { useAuth } from "@/context/AuthContext";

export default function AppDashboard() {
  const { profile } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-bold" style={{ color: "hsl(var(--app-text-primary))" }}>
        Buongiorno{profile?.full_name ? `, ${profile.full_name}` : ""}! 👋
      </h1>
      <p className="mt-2 text-sm" style={{ color: "hsl(var(--app-text-secondary))" }}>
        Dashboard aziendale. Contenuto in arrivo nella prossima fase.
      </p>
    </div>
  );
}
