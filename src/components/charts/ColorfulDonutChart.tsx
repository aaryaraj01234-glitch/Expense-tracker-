import React, { useState } from 'react';
import { formatCurrency } from '../../utils/formatters';
import { CategoryIcon } from '../../utils/icons';
import { getCategoryColor } from './chartColors';

export interface DonutDataItem {
  id: string;
  name: string;
  amount: number;
  icon?: string;
  color?: string;
}

interface ColorfulDonutChartProps {
  data: DonutDataItem[];
  totalAmount: number;
  currency: string;
  currencySymbol: string;
  title?: string;
  subtitle?: string;
  size?: number;
  donutThickness?: number;
  centerLabel?: string;
  showLegend?: boolean;
}

export const ColorfulDonutChart: React.FC<ColorfulDonutChartProps> = ({
  data,
  totalAmount,
  currency,
  currencySymbol,
  title,
  subtitle,
  size = 220,
  donutThickness = 32,
  centerLabel = 'Total Spend',
  showLegend = true,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Filter items with amount > 0 and calculate percentages
  const validItems = data.filter((item) => item.amount > 0);
  const total = totalAmount > 0 ? totalAmount : validItems.reduce((acc, curr) => acc + curr.amount, 0);

  if (validItems.length === 0 || total === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <div className="w-36 h-36 rounded-full border-4 border-dashed border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-400 text-xs">
          No data yet
        </div>
      </div>
    );
  }

  // Polar to Cartesian conversion helper
  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  // Generate SVG Donut arc path
  const describeArc = (
    x: number,
    y: number,
    innerRadius: number,
    outerRadius: number,
    startAngle: number,
    endAngle: number
  ) => {
    // Prevent full 360 degree overlap bug in SVG arc
    const clampedEnd = endAngle - startAngle >= 359.99 ? startAngle + 359.99 : endAngle;
    const startOuter = polarToCartesian(x, y, outerRadius, clampedEnd);
    const endOuter = polarToCartesian(x, y, outerRadius, startAngle);
    const startInner = polarToCartesian(x, y, innerRadius, clampedEnd);
    const endInner = polarToCartesian(x, y, innerRadius, startAngle);

    const arcSweep = clampedEnd - startAngle <= 180 ? '0' : '1';

    return [
      'M', startOuter.x, startOuter.y,
      'A', outerRadius, outerRadius, 0, arcSweep, 0, endOuter.x, endOuter.y,
      'L', endInner.x, endInner.y,
      'A', innerRadius, innerRadius, 0, arcSweep, 1, startInner.x, startInner.y,
      'Z',
    ].join(' ');
  };

  const center = size / 2;
  const baseOuterRadius = center - 8;
  const baseInnerRadius = baseOuterRadius - donutThickness;

  // Compute angles for each item with subtle gap
  let accumulatedAngle = 0;
  const gap = validItems.length > 1 ? 2 : 0; // 2 degree gap between slices

  const slices = validItems.map((item, index) => {
    const sliceAngle = (item.amount / total) * 360;
    const startAngle = accumulatedAngle + gap / 2;
    const endAngle = accumulatedAngle + sliceAngle - gap / 2;
    accumulatedAngle += sliceAngle;

    const isHovered = hoveredIndex === index;
    const outerRadius = isHovered ? baseOuterRadius + 5 : baseOuterRadius;
    const innerRadius = isHovered ? baseInnerRadius - 2 : baseInnerRadius;

    const color = item.color || getCategoryColor(item.id, item.name, index);
    const percent = ((item.amount / total) * 100).toFixed(1);
    const path = describeArc(center, center, innerRadius, outerRadius, startAngle, endAngle);

    return {
      ...item,
      color,
      percent,
      path,
      isHovered,
    };
  });

  const activeItem = hoveredIndex !== null ? slices[hoveredIndex] : null;

  return (
    <div className="flex flex-col items-center w-full">
      {(title || subtitle) && (
        <div className="w-full flex items-center justify-between mb-4">
          <div>
            {title && <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>}
            {subtitle && <p className="text-xs text-neutral-400 mt-0.5">{subtitle}</p>}
          </div>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
            {validItems.length} {validItems.length === 1 ? 'slice' : 'categories'}
          </span>
        </div>
      )}

      {/* SVG Donut */}
      <div className="relative flex items-center justify-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible drop-shadow-xs"
        >
          <defs>
            <filter id="donut-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.25" />
            </filter>
          </defs>

          {slices.map((slice, index) => (
            <path
              key={slice.id || index}
              d={slice.path}
              fill={slice.color}
              filter={slice.isHovered ? 'url(#donut-glow)' : undefined}
              className="transition-all duration-200 cursor-pointer hover:opacity-95"
              style={{
                transformOrigin: `${center}px ${center}px`,
                transform: slice.isHovered ? 'scale(1.02)' : 'scale(1)',
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          ))}
        </svg>

        {/* Center Cutout Info */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4"
          style={{ width: size, height: size }}
        >
          {activeItem ? (
            <div className="animate-in fade-in zoom-in-95 duration-150 flex flex-col items-center">
              {activeItem.icon && (
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white mb-1 shadow-xs"
                  style={{ backgroundColor: activeItem.color }}
                >
                  <CategoryIcon name={activeItem.icon} className="w-4 h-4 text-white" />
                </div>
              )}
              <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 max-w-[120px] truncate block">
                {activeItem.name}
              </span>
              <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">
                {formatCurrency(activeItem.amount, currency, currencySymbol)}
              </span>
              <span
                className="text-[11px] font-semibold px-1.5 py-0.2 rounded-full text-white mt-0.5"
                style={{ backgroundColor: activeItem.color }}
              >
                {activeItem.percent}%
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                {centerLabel}
              </span>
              <span className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight mt-0.5">
                {formatCurrency(total, currency, currencySymbol)}
              </span>
              <span className="text-[10px] text-neutral-400 mt-0.5">
                Hover to inspect
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Legend with Rich Badges */}
      {showLegend && (
        <div className="w-full mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
          {slices.map((slice, index) => (
            <div
              key={slice.id || index}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`flex items-center justify-between p-2 rounded-xl text-xs transition-all cursor-pointer border ${
                hoveredIndex === index
                  ? 'bg-neutral-100/90 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 shadow-2xs'
                  : 'bg-neutral-50/50 dark:bg-neutral-800/30 border-transparent hover:border-neutral-200 dark:hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <span
                  className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                  style={{ backgroundColor: slice.color }}
                />
                {slice.icon && (
                  <span className="text-neutral-500 shrink-0">
                    <CategoryIcon name={slice.icon} className="w-3.5 h-3.5" />
                  </span>
                )}
                <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate">
                  {slice.name}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {formatCurrency(slice.amount, currency, currencySymbol)}
                </span>
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${slice.color}20`,
                    color: slice.color,
                  }}
                >
                  {slice.percent}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
