import {
  getLineStopBadgeLabel,
  getLineStopColor,
  getLineStopTextColor,
} from "../utils/seo";

interface Props {
  lineStopId: string;
  className?: string;
}

export function BusLineBadge({ lineStopId, className = "" }: Props) {
  const label = getLineStopBadgeLabel(lineStopId);

  return (
    <span
      className={`inline-flex h-6 min-w-6 items-center justify-center whitespace-nowrap rounded-md px-1 font-semibold ${className}`}
      style={{
        backgroundColor: getLineStopColor(lineStopId),
        color: getLineStopTextColor(lineStopId),
        fontSize: label.length <= 3 ? 12 : label.length <= 5 ? 10 : 9,
      }}
    >
      {label}
    </span>
  );
}
