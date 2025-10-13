import { Html } from "@react-three/drei";

import { useConstruction } from "../state/slices/construction";
import { useToolPreviewStore } from "../state/slices/toolPreview";
import type { QueryPreview } from "../state/slices/toolPreview";
import { STATUS_MESSAGES } from "../state/slices/economy";
import type {
  DemandEntry,
  Farm,
  Industry,
  Mine,
  SupplyEntry,
  Town,
  Trend,
} from "../simulation/types";

import "./QueryTooltip.css";

type Settlement = Town | Farm | Industry | Mine;

interface TooltipContent {
  title: string;
  badgeLabel: string;
  badgeClass: string;
  subtitle?: string;
  metrics: { label: string; value: string }[];
}

const TREND_SYMBOLS: Record<Trend, string> = {
  rising: "↑",
  stable: "→",
  falling: "↓",
};

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function formatPercent(value: number): string {
  return `${Math.round(clamp01(value) * 100)}%`;
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function trendLabel(trend: Trend): string {
  return `${TREND_SYMBOLS[trend]} ${trend}`;
}

function demandSummary(entry: DemandEntry): string {
  if (entry.demand <= 0) {
    return "No demand";
  }

  const fulfilledRatio = clamp01(entry.fulfilled / Math.max(entry.demand, 1));
  const fulfilledValue = formatPercent(fulfilledRatio);
  const fulfilledUnits = Math.round(entry.fulfilled);
  const demandedUnits = Math.round(entry.demand);
  return `${fulfilledValue} fulfilled (${fulfilledUnits}/${demandedUnits}) • ${trendLabel(entry.trend)}`;
}

function goodsDemandSummary(entries: DemandEntry[]): string {
  if (entries.length === 0) {
    return "No cargo requests";
  }

  return entries
    .slice(0, 2)
    .map(
      (entry) =>
        `${entry.good.toUpperCase()} ${formatPercent(
          clamp01(entry.fulfilled / Math.max(entry.demand, 1)),
        )} ${TREND_SYMBOLS[entry.trend]}`,
    )
    .join(", ");
}

function goodsSupplySummary(entries: SupplyEntry[]): string {
  if (entries.length === 0) {
    return "No active output";
  }

  return entries
    .slice(0, 2)
    .map(
      (entry) =>
        `${entry.good.toUpperCase()} ${formatPercent(
          clamp01(entry.stock / Math.max(entry.capacity, 1)),
        )} ${TREND_SYMBOLS[entry.trend]}`,
    )
    .join(", ");
}

function describeTown(town: Town): TooltipContent {
  return {
    title: town.name,
    badgeLabel: "Town",
    badgeClass: "town",
    subtitle: `Population ${town.population.toLocaleString()}`,
    metrics: [
      {
        label: "Satisfaction",
        value: `${formatPercent(town.satisfaction)} • ${capitalize(town.growthTrend)}`,
      },
      {
        label: "Passenger demand",
        value: demandSummary(town.demand.passengers),
      },
      {
        label: "Goods demand",
        value: goodsDemandSummary(town.demand.goods),
      },
      {
        label: "Coverage",
        value: formatPercent(town.serviceCoverage),
      },
    ],
  };
}

function describeIndustry(industry: Industry): TooltipContent {
  const inputDetails = industry.inputs
    .slice(0, 2)
    .map(
      (input) =>
        `${input.good.toUpperCase()} ${formatPercent(
          clamp01(input.fulfilled / Math.max(input.demand, 1)),
        )}`,
    )
    .join(", ");

  const outputDetails = industry.outputs
    .slice(0, 2)
    .map(
      (output) =>
        `${output.good.toUpperCase()} ${formatPercent(clamp01(output.stock / Math.max(output.capacity, 1)))}`,
    )
    .join(", ");

  return {
    title: industry.name,
    badgeLabel: industry.industryType,
    badgeClass: "industry",
    metrics: [
      {
        label: "Status",
        value: STATUS_MESSAGES[industry.status],
      },
      {
        label: "Utilization",
        value: formatPercent(industry.utilization),
      },
      {
        label: "Inputs",
        value: inputDetails || "No inbound cargo",
      },
      {
        label: "Outputs",
        value: outputDetails || "No outbound stock",
      },
    ],
  };
}

function describeFarm(farm: Farm): TooltipContent {
  return {
    title: farm.name,
    badgeLabel: "Farm",
    badgeClass: "farm",
    metrics: [
      {
        label: "Output",
        value: `${farm.outputTonsPerMonth.toFixed(1)} t/mo`,
      },
      {
        label: "Utilization",
        value: formatPercent(farm.utilization),
      },
      {
        label: "Goods",
        value: goodsSupplySummary(farm.outputs),
      },
      {
        label: "Coverage",
        value: formatPercent(farm.serviceCoverage),
      },
    ],
  };
}

function describeMine(mine: Mine): TooltipContent {
  return {
    title: mine.name,
    badgeLabel: "Mine",
    badgeClass: "mine",
    metrics: [
      {
        label: "Output",
        value: `${mine.outputRate.toFixed(1)} t/mo`,
      },
      {
        label: "Exhaustion",
        value: formatPercent(mine.exhaustion),
      },
      {
        label: "Goods",
        value: goodsSupplySummary(mine.outputs),
      },
      {
        label: "Coverage",
        value: formatPercent(mine.serviceCoverage),
      },
    ],
  };
}

function describeSettlement(settlement: Settlement): TooltipContent {
  switch (settlement.kind) {
    case "town":
      return describeTown(settlement);
    case "industry":
      return describeIndustry(settlement);
    case "farm":
      return describeFarm(settlement);
    case "mine":
      return describeMine(settlement);
    default:
      return {
        title: "Settlement",
        badgeLabel: "Site",
        badgeClass: "town",
        metrics: [],
      };
  }
}

export function QueryTooltip() {
  const tool = useConstruction((state) => state.tool);
  const preview: QueryPreview | null = useToolPreviewStore(
    (state) => state.query,
  );

  const settlement = preview?.settlement ?? null;

  if (tool !== "query" || !settlement) {
    return null;
  }

  const content = describeSettlement(settlement);

  const position: [number, number, number] = [
    settlement.position[0],
    settlement.position[1] + 12,
    settlement.position[2],
  ];

  return (
    <Html position={position} transform occlude distanceFactor={18}>
      <div className={`query-tooltip query-tooltip--${content.badgeClass}`}>
        <div className="query-tooltip__header">
          <span className="query-tooltip__title">{content.title}</span>
          <span
            className={`query-tooltip__badge query-tooltip__badge--${content.badgeClass}`}
          >
            {content.badgeLabel}
          </span>
        </div>
        {content.subtitle ? (
          <div className="query-tooltip__subtitle">{content.subtitle}</div>
        ) : null}
        <dl className="query-tooltip__metrics">
          {content.metrics.map((metric) => (
            <div key={metric.label} className="query-tooltip__metric">
              <dt>{metric.label}</dt>
              <dd>{metric.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Html>
  );
}
