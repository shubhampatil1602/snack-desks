"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// Renders its children the first time they scroll into view, so heavy parts
// of the demo (Recharts) never load for someone who only reads the headline.
export function WhenVisible({
  children,
  fallback,
  className,
}: {
  children: ReactNode;
  fallback: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setVisible(true);
      observer.disconnect();
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {visible ? children : fallback}
    </div>
  );
}
