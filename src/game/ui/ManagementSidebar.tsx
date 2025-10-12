import { useMemo } from "react";
import { useUIStore } from "@/game/state/slices/ui";
import { SidebarPanel } from "./SidebarPanel";
import "./ManagementSidebar.css";

const FLEET_SUMMARY = [
  { mode: "Trains", count: 4, status: "On schedule" },
  { mode: "Road Vehicles", count: 6, status: "Reliable" },
  { mode: "Ships", count: 1, status: "Idle" },
];

const FINANCE_SUMMARY = {
  income: 152_000,
  expenses: 94_500,
  trend: "+12.4% vs last month",
};

const ALERTS = [
  { id: 1, label: "New industry request from Steel Mill", time: "2m ago" },
  { id: 2, label: "Train 3 reached Northport Central", time: "5m ago" },
  { id: 3, label: "Depot maintenance due in 12 days", time: "1h ago" },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function ManagementSidebar() {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const closeSidebar = useUIStore((state) => state.closeSidebar);

  const fleetRows = useMemo(
    () =>
      FLEET_SUMMARY.map((fleet) => (
        <li key={fleet.mode}>
          <div>
            <span className="label">{fleet.mode}</span>
            <span className="status">{fleet.status}</span>
          </div>
          <span className="value">{fleet.count}</span>
        </li>
      )),
    [],
  );

  return (
    <aside
      className={`management-sidebar ${sidebarOpen ? "open" : ""}`}
      aria-hidden={!sidebarOpen}
    >
      <div className="management-sidebar__header">
        <h1>Company HQ</h1>
        <button onClick={closeSidebar} aria-label="Close sidebar">
          ✖
        </button>
      </div>
      <div className="management-sidebar__panels">
        <SidebarPanel
          icon="🚆"
          title="Fleet Overview"
          description="Network utilization"
        >
          <ul className="metric-list">{fleetRows}</ul>
        </SidebarPanel>
        <SidebarPanel
          icon="💰"
          title="Finances"
          description="Monthly balance sheet"
        >
          <div className="finance-summary">
            <dl>
              <div>
                <dt>Income</dt>
                <dd>{formatCurrency(FINANCE_SUMMARY.income)}</dd>
              </div>
              <div>
                <dt>Expenses</dt>
                <dd>{formatCurrency(FINANCE_SUMMARY.expenses)}</dd>
              </div>
            </dl>
            <p className="finance-trend">{FINANCE_SUMMARY.trend}</p>
            <div className="sparkline" aria-hidden>
              <span />
            </div>
          </div>
        </SidebarPanel>
        <SidebarPanel
          icon="📢"
          title="Alerts"
          description="Latest network updates"
        >
          <ul className="alert-feed">
            {ALERTS.map((alert) => (
              <li key={alert.id}>
                <span className="alert-label">{alert.label}</span>
                <span className="alert-time">{alert.time}</span>
              </li>
            ))}
          </ul>
        </SidebarPanel>
      </div>
    </aside>
  );
}
