import { useMemo } from "react";
import { useUIStore } from "@/game/state/slices/ui";
import {
  useEconomyStore,
  computeTerritorySummary,
  computeProductionOpportunities,
  computeAverageCoverage,
} from "@/game/state/slices/economy";
import { useClock } from "@/game/state/slices/clock";
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

interface MilestoneProgress {
  id: string;
  label: string;
  value: number;
  status: string;
}

const STATIC_MILESTONES: MilestoneProgress[] = [
  {
    id: "electrification",
    label: "Electrification",
    value: 54,
    status: "Crew deployments scheduled",
  },
  {
    id: "cargo",
    label: "Cargo Contracts",
    value: 61,
    status: "Negotiations ongoing",
  },
];

function describeCoverageStatus(value: number): string {
  if (value >= 75) {
    return "Ahead of plan";
  }
  if (value >= 55) {
    return "On track";
  }
  return "Needs expansion";
}

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
  const gameMinutes = useClock((state) => state.gameMinutes);
  const economyState = useEconomyStore((state) => state);
  const territorySummary = useMemo(
    () => computeTerritorySummary(economyState),
    [economyState],
  );
  const opportunities = useMemo(
    () => computeProductionOpportunities(economyState, gameMinutes),
    [economyState, gameMinutes],
  );
  const averageCoverage = useMemo(
    () => computeAverageCoverage(economyState),
    [economyState],
  );

  const coverageValue = Math.round(averageCoverage * 100);
  const milestoneProgress = useMemo(
    () => [
      {
        id: "coverage",
        label: "Network Coverage",
        value: coverageValue,
        status: describeCoverageStatus(coverageValue),
      },
      ...STATIC_MILESTONES,
    ],
    [coverageValue],
  );

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

  const progressRows = useMemo(
    () =>
      milestoneProgress.map((milestone) => {
        const labelId = `milestone-${milestone.id}`;
        return (
          <li key={milestone.id} className="progress-row">
            <div className="progress-row__header">
              <span className="label" id={labelId}>
                {milestone.label}
              </span>
              <span className="value">{milestone.value}%</span>
            </div>
            <div className="progress-meter">
              <div className="progress-meter__track">
                <div
                  className="progress-meter__bar"
                  role="progressbar"
                  aria-labelledby={labelId}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={milestone.value}
                  style={{ width: `${milestone.value}%` }}
                />
              </div>
              <span className="progress-row__status">{milestone.status}</span>
            </div>
          </li>
        );
      }),
    [milestoneProgress],
  );

  const territoryRows = useMemo(
    () =>
      territorySummary.map((category) => (
        <li key={category.id}>
          <div className="territory-list__info">
            <span className="label">{category.label}</span>
            <span className="status">{category.status}</span>
          </div>
          <span className="count">{category.count}</span>
        </li>
      )),
    [territorySummary],
  );

  const opportunityRows = useMemo(
    () =>
      opportunities.map((opportunity) => (
        <li key={opportunity.id} className="opportunity-row">
          <div className="opportunity-row__header">
            <div className="opportunity-row__titles">
              <span className="location">{opportunity.location}</span>
              <span className="industry">{opportunity.industry}</span>
            </div>
            <span className={`status-chip status-chip--${opportunity.status}`}>
              {opportunity.message}
            </span>
          </div>
          <span className="opportunity-row__meta">
            {opportunity.updatedAgo}
          </span>
        </li>
      )),
    [opportunities],
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
        <SidebarPanel
          icon="📈"
          title="Expansion Progress"
          description="Milestones toward company goals"
        >
          <ul className="progress-list">{progressRows}</ul>
        </SidebarPanel>
        <SidebarPanel
          icon="🗺️"
          title="Territory Summary"
          description="Regional coverage snapshot"
        >
          <ul className="territory-list">{territoryRows}</ul>
        </SidebarPanel>
        <SidebarPanel
          icon="🏭"
          title="Production Opportunities"
          description="Industries requesting service"
        >
          <ul className="opportunity-list">{opportunityRows}</ul>
        </SidebarPanel>
      </div>
    </aside>
  );
}
