import { useEffect, useRef, useState } from 'react';

/**
 * SVG dotted curved path connecting level nodes within a single group.
 *
 * Props:
 *  - containerRef: ref to the group container element
 *  - nodeRefs: array of refs to each level node element
 *  - gameStatuses: array of status strings ('done' | 'current' | 'locked') for each node
 */
const ProgressPath = ({ containerRef, nodeRefs, gameStatuses }) => {
  const svgRef = useRef(null);
  const [segments, setSegments] = useState([]);

  useEffect(() => {
    const container = containerRef?.current;
    const svg = svgRef.current;

    if (!container || !svg || !nodeRefs || nodeRefs.length < 2) {
      setSegments([]);
      return undefined;
    }

    let frameId = 0;

    const calculatePaths = () => {
      const svgRect = svg.getBoundingClientRect();
      const points = nodeRefs
        .map((ref) => ref?.current || ref)
        .filter(Boolean)
        .map((node) => {
          const rect = node.getBoundingClientRect();
          return {
            x: rect.left - svgRect.left + rect.width / 2,
            y: rect.top - svgRect.top + rect.height / 2,
          };
        });

      if (points.length < 2) {
        setSegments([]);
        return;
      }

      const newSegments = [];

      for (let i = 0; i < points.length - 1; i += 1) {
        const start = points[i];
        const end = points[i + 1];

        // Gentle curve pull — not too aggressive
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;
        const curvePull = Math.min(Math.abs(end.x - start.x) * 0.15, 40);
        const controlX = midX + (end.x >= start.x ? curvePull : -curvePull);

        // Determine segment color based on game statuses
        const fromStatus = gameStatuses?.[i] || 'locked';
        const toStatus = gameStatuses?.[i + 1] || 'locked';
        const isCompleted = fromStatus === 'done' && (toStatus === 'done' || toStatus === 'current');

        newSegments.push({
          key: `path-seg-${i}`,
          d: `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} Q ${controlX.toFixed(1)} ${midY.toFixed(1)} ${end.x.toFixed(1)} ${end.y.toFixed(1)}`,
          isCompleted,
        });
      }

      setSegments(newSegments);
    };

    const scheduleCalculation = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        frameId = window.requestAnimationFrame(calculatePaths);
      });
    };

    // Initial calculation
    scheduleCalculation();

    // Observe container resize
    const observer = new ResizeObserver(scheduleCalculation);
    observer.observe(container);

    // Observe each node
    nodeRefs.forEach((ref) => {
      const node = ref?.current || ref;
      if (node) observer.observe(node);
    });

    window.addEventListener('resize', scheduleCalculation);

    return () => {
      window.cancelAnimationFrame(frameId);
      observer.disconnect();
      window.removeEventListener('resize', scheduleCalculation);
    };
  }, [containerRef, nodeRefs, gameStatuses]);

  return (
    <svg
      ref={svgRef}
      className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-visible"
      aria-hidden="true"
    >
      {segments.map((segment) => (
        <path
          key={segment.key}
          d={segment.d}
          fill="none"
          stroke={segment.isCompleted ? '#34d399' : '#168FC7'}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="8 14"
          opacity={segment.isCompleted ? 0.45 : 0.2}
        />
      ))}
    </svg>
  );
};

export default ProgressPath;
