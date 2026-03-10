import SidebarNav from "./SidebarNav";

export default function Sidebar() {
  return (
    <aside className="w-[240px] shrink-0 flex flex-col h-screen sticky top-0 bg-card border-r border-border">
      <SidebarNav />
    </aside>
  );
}
