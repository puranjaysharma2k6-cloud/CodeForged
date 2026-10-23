import type { ReactNode, CSSProperties } from "react";

interface PanelCardProps {
  header: ReactNode;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;

  bodyClassName?: string;
  bodyStyle?: CSSProperties;

  noScroll?: boolean;
}


 
export default function PanelCard({
  header, children,
  className = "", style,
  bodyClassName = "", bodyStyle,
  noScroll = false,
}: PanelCardProps) {
  return (
    <div
      className={`flex flex-col rounded-xl border border-[#1e2434] bg-[#0d1117] overflow-hidden ${className}`}
      style={style}
    >
      {/*header row  */}
      <div className="flex items-center justify-between px-5 h-14 shrink-0 border-b border-[#1e2434] bg-[#0d1117]"
        style={{ overflow: "visible" }}>
        {header}
      </div>

      {/*  body */}
      <div
        className={`flex-1 min-h-0 ${noScroll ? "" : "overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#2e3448_transparent]"} ${bodyClassName}`}
        style={bodyStyle}
      >
        {children}
      </div>
    </div>
  );
}
