import React from 'react';

interface LogoProps {
  className?: string;
  size?: number | string;
}

export const AppLogo: React.FC<LogoProps> = ({ className = 'w-8 h-8', size }) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <svg
      viewBox="0 0 300 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-label="Universal Expense Tracker Logo"
    >
      {/* Top-left Green Orbit Arc */}
      <path
        d="M 64 174 A 110 110 0 0 1 176 48"
        stroke="#22C55E"
        strokeWidth="15"
        strokeLinecap="round"
      />

      {/* Bottom-right Blue Orbit Arc */}
      <path
        d="M 236 126 A 110 110 0 0 1 104 226"
        stroke="#2563EB"
        strokeWidth="15"
        strokeLinecap="round"
      />

      {/* Background Cards Peeking Out */}
      {/* Green Card (Back Left) */}
      <g transform="rotate(-15 125 90)">
        <rect
          x="98"
          y="70"
          width="68"
          height="48"
          rx="10"
          fill="#22C55E"
        />
      </g>

      {/* Blue Card (Front Right) */}
      <g transform="rotate(13 165 90)">
        <rect
          x="130"
          y="70"
          width="74"
          height="50"
          rx="10"
          fill="#2563EB"
        />
      </g>

      {/* Main Dark Wallet Body */}
      <rect
        x="80"
        y="104"
        width="135"
        height="96"
        rx="22"
        fill="#161C28"
      />

      {/* Wallet Right Clasp Tab */}
      <path
        d="M 188 132 C 188 132, 204 132, 215 136 C 224 139, 227 146, 227 152 C 227 158, 224 165, 215 168 C 204 172, 188 172, 188 172 Z"
        fill="#161C28"
      />

      {/* Clasp White Contour / Stroke */}
      <path
        d="M 188 137 C 196 137, 208 138, 215 142 C 220 144, 222 148, 222 152 C 222 156, 220 160, 215 162 C 208 166, 196 167, 188 167"
        stroke="#FFFFFF"
        strokeWidth="4.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Clasp Snap Button */}
      <circle
        cx="204"
        cy="152"
        r="7.5"
        fill="#FFFFFF"
      />

      {/* 3 Bar Chart Bars on Wallet Face */}
      {/* Bar 1 (Left - Shortest) */}
      <rect
        x="114"
        y="158"
        width="12"
        height="22"
        rx="6"
        fill="#FFFFFF"
      />

      {/* Bar 2 (Middle) */}
      <rect
        x="132"
        y="146"
        width="12"
        height="34"
        rx="6"
        fill="#FFFFFF"
      />

      {/* Bar 3 (Right - Tallest) */}
      <rect
        x="150"
        y="134"
        width="12"
        height="46"
        rx="6"
        fill="#FFFFFF"
      />
    </svg>
  );
};
