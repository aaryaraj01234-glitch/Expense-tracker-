import React, { useState, useId } from 'react';
import { AreaChart, BarChart2, TrendingUp, Sparkles } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export interface TrendDayData {
  day: number;
  dateStr: string;
  amount: number;
  label?: string;
}

interface ColorfulTrendChartProps {
  days: TrendDayData[];
  maxAmount: number;
  totalExpense: number;
  currency: string;
  currencySymbol: string;
  title?: string;
  subtitle?: string;
}

export const ColorfulTrendChart: React.FC<ColorfulTrendChartProps> = ({
  days,
  maxAmount,
  totalExpense,
  currency,
  currencySymbol,
  title = 'Monthly Spending Trend',
  subtitle = 'Daily expense distribution',
}) => {
  const [chartMode, setChartMode] = useState<'area' | 'bar'>('area');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const chartId = useId().replace(/:/g, '');

  const daysCount = days.length || 1;
  const effectiveMax = maxAmount > 0 ? maxAmount * 1.15 : 100; // 15% headroom
  const dailyAverage = totalExpense > 0 ? totalExpense / daysCount : 0;

  // Find peak day
  const peakDay = days.reduce<TrendDayData | null>((max, curr) => {
    if (!max || curr.amount > max.amount) return curr;
    return max;
  }, null);

  // SVG Chart Geometry
  const svgWidth = 600;
  const svgHeight = 180;
  const paddingX = 24;
  const paddingY = 24;
  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingY * 2;

  // Calculate coordinates for each day
  const points = days.map((d, i) => {
    const x = paddingX + (i / Math.max(daysCount - 1, 1)) * chartWidth;
    const yRatio = d.amount / effectiveMax;
    const y = svgHeight - paddingY - yRatio * chartHeight;
    return { x, y, ...d, index: i };
  });

  // Generate smooth cubic bezier curve path through points
  const generateSmoothPath = (pts: typeof points): string => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(i - 1, 0)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(i + 2, pts.length - 1)];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return path;
  };

  const linePath = generateSmoothPath(points);
  const lastPoint = points[points.length - 1] || { x: paddingX + chartWidth, y: svgHeight - paddingY };
  const firstPoint = points[0] || { x: paddingX, y: svgHeight - paddingY };
  const areaPath = linePath
    ? `${linePath} L ${lastPoint.x} ${svgHeight - paddingY} L ${firstPoint.x} ${svgHeight - paddingY} Z`
    : '';

  // Get color for a bar based on its expense proportion
  const getBarColor = (amount: number, isHovered: boolean) => {
    if (amount === 0) return isHovered ? '#CBD5E1' : '#F1F5F9';
    const ratio = amount / maxAmount;
    if (isHovered) {
      if (ratio > 0.7) return '#E11D48'; // Rose peak
      if (ratio > 0.4) return '#D97706'; // Amber high
      if (ratio > 0.2) return '#4F46E5'; // Indigo medium
      return '#059669'; // Emerald light
    }
    if (ratio > 0.7) return '#F43F5E';
    if (ratio > 0.4) return '#F59E0B';
    if (ratio > 0.2) return '#6366F1';
    return '#10B981';
  };

  const activePoint = hoveredIdx !== null ? points[hoveredIdx] : null;

  return (
    <div className="w-full">
      {/* Header with Title and Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <span>{title}</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 border border-violet-200/60 dark:border-violet-800/60">
              <Sparkles className="w-3 h-3" />
              Dynamic
            </span>
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">{subtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          {totalExpense > 0 && (
            <div className="hidden sm:block text-right">
              <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                {formatCurrency(dailyAverage, currency, currencySymbol)}
              </span>
              <span className="text-[10px] text-neutral-400 block">daily average</span>
            </div>
          )}

          {/* Mode Switcher */}
          <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setChartMode('area')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all ${
                chartMode === 'area'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <AreaChart className="w-3.5 h-3.5" />
              <span>Area</span>
            </button>
            <button
              type="button"
              onClick={() => setChartMode('bar')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all ${
                chartMode === 'bar'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Bars</span>
            </button>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      {totalExpense === 0 ? (
        <div className="h-48 flex flex-col items-center justify-center text-center text-neutral-400 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
          <TrendingUp className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mb-2 stroke-1" />
          <p className="text-xs font-medium">No expenses recorded for this timeframe</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Active Hover Floating Info Bar */}
          <div className="h-6 flex items-center justify-between text-xs px-1">
            {activePoint ? (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {activePoint.label || `Day ${activePoint.day}`}:
                </span>
                <span className="font-bold text-violet-600 dark:text-violet-400">
                  {formatCurrency(activePoint.amount, currency, currencySymbol)}
                </span>
                {maxAmount > 0 && activePoint.amount > 0 && (
                  <span className="text-[10px] text-neutral-400">
                    ({((activePoint.amount / totalExpense) * 100).toFixed(1)}% of month)
                  </span>
                )}
              </div>
            ) : (
              <span className="text-[11px] text-neutral-400">
                Hover or slide across days to inspect daily spend
              </span>
            )}

            {peakDay && peakDay.amount > 0 && !activePoint && (
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                Peak: Day {peakDay.day} ({formatCurrency(peakDay.amount, currency, currencySymbol)})
              </span>
            )}
          </div>

          {/* Area Chart Mode */}
          {chartMode === 'area' ? (
            <div className="relative w-full h-44 overflow-hidden rounded-xl bg-gradient-to-b from-neutral-50/50 to-transparent dark:from-neutral-800/20 border border-neutral-100 dark:border-neutral-800/80 p-1">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
              >
                <defs>
                  {/* Rich Area Gradient */}
                  <linearGradient id={`area-grad-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.45" />
                    <stop offset="50%" stopColor="#6366F1" stopOpacity="0.20" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.00" />
                  </linearGradient>

                  {/* Vibrant Line Stroke Gradient */}
                  <linearGradient id={`stroke-grad-${chartId}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="35%" stopColor="#6366F1" />
                    <stop offset="70%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#EC4899" />
                  </linearGradient>
                </defs>

                {/* Subtle horizontal grid lines */}
                <line
                  x1={paddingX}
                  y1={paddingY}
                  x2={svgWidth - paddingX}
                  y2={paddingY}
                  stroke="currentColor"
                  className="text-neutral-200 dark:text-neutral-800"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <line
                  x1={paddingX}
                  y1={paddingY + chartHeight / 2}
                  x2={svgWidth - paddingX}
                  y2={paddingY + chartHeight / 2}
                  stroke="currentColor"
                  className="text-neutral-200 dark:text-neutral-800"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <line
                  x1={paddingX}
                  y1={svgHeight - paddingY}
                  x2={svgWidth - paddingX}
                  y2={svgHeight - paddingY}
                  stroke="currentColor"
                  className="text-neutral-200 dark:text-neutral-800"
                  strokeWidth="1"
                />

                {/* Area Fill */}
                {areaPath && (
                  <path
                    d={areaPath}
                    fill={`url(#area-grad-${chartId})`}
                    className="transition-all duration-300"
                  />
                )}

                {/* Main Curve Stroke */}
                {linePath && (
                  <path
                    d={linePath}
                    fill="none"
                    stroke={`url(#stroke-grad-${chartId})`}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-all duration-300 drop-shadow-xs"
                  />
                )}

                {/* Interactive Points and Crosshair */}
                {points.map((pt, i) => {
                  const isHovered = hoveredIdx === i;
                  return (
                    <g key={pt.day || i}>
                      {/* Vertical scrubber line when hovered */}
                      {isHovered && (
                        <line
                          x1={pt.x}
                          y1={paddingY}
                          x2={pt.x}
                          y2={svgHeight - paddingY}
                          stroke="#8B5CF6"
                          strokeWidth="1.5"
                          strokeDasharray="3 3"
                          className="opacity-75"
                        />
                      )}

                      {/* Point dot */}
                      {pt.amount > 0 && (
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isHovered ? 5.5 : 3}
                          fill={isHovered ? '#8B5CF6' : '#FFFFFF'}
                          stroke={isHovered ? '#FFFFFF' : '#6366F1'}
                          strokeWidth={isHovered ? 2.5 : 2}
                          className="transition-all duration-150 cursor-pointer drop-shadow-2xs"
                        />
                      )}

                      {/* Invisible hover trigger column for easy mouse tracking */}
                      <rect
                        x={pt.x - chartWidth / (daysCount * 2)}
                        y={0}
                        width={chartWidth / daysCount}
                        height={svgHeight}
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredIdx(i)}
                        onMouseLeave={() => setHoveredIdx(null)}
                      />
                    </g>
                  );
                })}
              </svg>
            </div>
          ) : (
            /* Vibrant Gradient Bars Mode */
            <div className="h-44 flex items-end gap-1 sm:gap-1.5 px-2 py-2 rounded-xl bg-neutral-50/50 dark:bg-neutral-800/20 border border-neutral-100 dark:border-neutral-800/80">
              {days.map((item, idx) => {
                const heightPercent =
                  item.amount > 0 ? Math.max((item.amount / maxAmount) * 100, 6) : 2;
                const isHovered = hoveredIdx === idx;
                const barColor = getBarColor(item.amount, isHovered);

                return (
                  <div
                    key={item.day || idx}
                    className="flex-1 h-full flex flex-col justify-end items-center cursor-pointer group"
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  >
                    <div
                      style={{
                        height: `${heightPercent}%`,
                        backgroundColor: barColor,
                      }}
                      className={`w-full rounded-t-md transition-all duration-150 ${
                        isHovered ? 'scale-y-105 shadow-md brightness-110' : 'hover:opacity-90'
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Day Labels Axis */}
          <div className="flex items-center justify-between text-[10px] text-neutral-400 font-medium px-2 pt-1 border-t border-neutral-100 dark:border-neutral-800">
            <span>Day 1</span>
            {daysCount > 10 && <span>Day 10</span>}
            {daysCount > 20 && <span>Day 20</span>}
            <span>Day {daysCount}</span>
          </div>

          {/* Color Intensity Scale Legend in Bar Mode */}
          {chartMode === 'bar' && (
            <div className="flex items-center justify-end gap-3 text-[10px] text-neutral-400 pt-1">
              <span>Spending intensity:</span>
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                <span>Low</span>
                <span className="inline-block w-2.5 h-2.5 rounded-sm bg-indigo-500 ml-1" />
                <span>Medium</span>
                <span className="inline-block w-2.5 h-2.5 rounded-sm bg-amber-500 ml-1" />
                <span>High</span>
                <span className="inline-block w-2.5 h-2.5 rounded-sm bg-rose-500 ml-1" />
                <span>Peak</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
