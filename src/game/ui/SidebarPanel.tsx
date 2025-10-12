import type { ReactNode } from "react";

interface SidebarPanelProps {
  icon: string;
  title: string;
  description?: string;
  children: ReactNode;
}

export function SidebarPanel({
  icon,
  title,
  description,
  children,
}: SidebarPanelProps) {
  return (
    <section className="sidebar-panel">
      <header className="sidebar-panel__header">
        <span aria-hidden className="sidebar-panel__icon">
          {icon}
        </span>
        <div className="sidebar-panel__titles">
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
      </header>
      <div className="sidebar-panel__content">{children}</div>
    </section>
  );
}
