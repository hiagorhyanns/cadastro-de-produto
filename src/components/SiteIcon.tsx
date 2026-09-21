import React from "react";

interface SiteIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number;
  className?: string;
}

export const SiteIcon: React.FC<SiteIconProps> = ({
  size = 20,
  strokeWidth = 2.4,
  className = "",
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Retângulo superior com cantos arredondados */}
      <rect
        x="4.5"
        y="4"
        width="23"
        height="8"
        rx="2.5"
      />
      {/* 3 linhas horizontais inferiores */}
      <line x1="5" y1="17.5" x2="27" y2="17.5" />
      <line x1="5" y1="22.5" x2="27" y2="22.5" />
      <line x1="5" y1="27.5" x2="27" y2="27.5" />
    </svg>
  );
};

export default SiteIcon;
