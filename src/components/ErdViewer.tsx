
import React, { useState, useMemo } from 'react';
import { ErdNode, ErdEdge } from '../types';

interface ErdViewerProps {
  nodes: ErdNode[];
  edges: ErdEdge[];
}

const NODE_WIDTH = 150;
const HEADER_HEIGHT = 28; // height of header
const FIELD_HEIGHT = 21;  // height of each field

// --- Geometry Helpers ---

const getNodeHeight = (node: ErdNode) => {
  // Header + Fields + Padding/Border adjustments
  return HEADER_HEIGHT + (node.fields.length * FIELD_HEIGHT) + 2; 
};

const getCenter = (node: ErdNode) => {
  const h = getNodeHeight(node);
  return {
    x: node.x + NODE_WIDTH / 2,
    y: node.y + h / 2
  };
};

// Find point on the boundary of a rectangle (w, h) centered at 'center'
// intersecting with the segment from 'center' to 'target'.
const getRectIntersection = (
  center: { x: number; y: number },
  target: { x: number; y: number },
  w: number,
  h: number
) => {
  const dx = target.x - center.x;
  const dy = target.y - center.y;

  if (dx === 0 && dy === 0) return center;

  const wHalf = w / 2;
  const hHalf = h / 2;

  let t = Infinity;

  // Check vertical walls (left/right)
  if (dx !== 0) {
    const tx = (dx > 0 ? wHalf : -wHalf) / dx;
    if (tx > 0) t = Math.min(t, tx);
  }

  // Check horizontal walls (top/bottom)
  if (dy !== 0) {
    const ty = (dy > 0 ? hHalf : -hHalf) / dy;
    if (ty > 0) t = Math.min(t, ty);
  }

  // Fallback if inside
  if (t === Infinity) return center;

  return {
    x: center.x + t * dx,
    y: center.y + t * dy
  };
};

const ErdViewer: React.FC<ErdViewerProps> = ({ nodes, edges }) => {
  const [zoom, setZoom] = useState(1);
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 1.5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));

  // Pre-calculate edges with start/end points clipped to borders
  const renderedEdges = useMemo(() => {
    return edges.map(edge => {
      const sourceNode = nodes.find(n => n.id === edge.from);
      const targetNode = nodes.find(n => n.id === edge.to);

      if (!sourceNode || !targetNode) return null;

      const sCenter = getCenter(sourceNode);
      const tCenter = getCenter(targetNode);
      const sHeight = getNodeHeight(sourceNode);
      const tHeight = getNodeHeight(targetNode);

      // Start point: Intersection on Source boundary (ray towards Target)
      const start = getRectIntersection(sCenter, tCenter, NODE_WIDTH, sHeight);
      
      // End point: Intersection on Target boundary (ray from Source)
      const end = getRectIntersection(tCenter, sCenter, NODE_WIDTH, tHeight);

      return { key: `${edge.from}-${edge.to}`, start, end };
    }).filter(Boolean) as { key: string, start: {x:number, y:number}, end: {x:number, y:number} }[];
  }, [nodes, edges]);

  return (
    <div className="w-full h-full bg-ice-200 dark:bg-slate-950 overflow-hidden relative border-b border-ice-300 dark:border-slate-800 select-none">
      {/* Dot Grid Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-10" 
           style={{ backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      </div>

      {/* Controls */}
      <div className="absolute top-4 right-4 flex flex-col z-30 bg-ice-100 dark:bg-slate-800 border border-ice-300 dark:border-slate-600 shadow-sm rounded-none overflow-hidden">
        <button onClick={handleZoomIn} className="p-1.5 hover:bg-ice-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-b border-ice-300 dark:border-slate-600 font-mono font-bold transition-colors" title="Zoom In">+</button>
        <button onClick={handleZoomOut} className="p-1.5 hover:bg-ice-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono font-bold transition-colors" title="Zoom Out">-</button>
      </div>
      
      {/* Canvas */}
      <div className="w-full h-full overflow-auto flex items-center justify-center p-8 cursor-grab active:cursor-grabbing">
        <div 
          className="relative transition-transform duration-200 ease-out origin-center"
          style={{ width: '800px', height: '600px', transform: `scale(${zoom})` }}
        >
          {/* Edges Layer (Bottom) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-0">
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" className="fill-slate-500 dark:fill-slate-400" />
              </marker>
            </defs>
            {renderedEdges.map((e) => (
              <line 
                key={e.key}
                x1={e.start.x} y1={e.start.y}
                x2={e.end.x} y2={e.end.y}
                className="stroke-slate-500 dark:stroke-slate-400 transition-all duration-300"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
              />
            ))}
          </svg>

          {/* Nodes Layer (Top) */}
          {nodes.map(node => (
            <div
              key={node.id}
              className="absolute bg-ice-100 dark:bg-slate-900 border border-slate-400 dark:border-slate-600 z-10 flex flex-col overflow-hidden shadow-sm"
              style={{ 
                left: node.x, 
                top: node.y, 
                width: NODE_WIDTH,
              }}
            >
              {/* Header */}
              <div className="h-[28px] flex items-center justify-center bg-ice-200 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-600 px-2">
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-tight truncate font-mono">
                  {node.label}
                </span>
              </div>
              
              {/* Fields */}
              <div className="flex flex-col bg-ice-50 dark:bg-slate-900">
                {node.fields.map((field, idx) => {
                  const isKey = field.startsWith('#') || field.includes('KEY');
                  const fieldName = field.replace('#', '');
                  return (
                    <div 
                      key={idx} 
                      className={`h-[21px] flex items-center justify-between px-2 text-[9px] font-mono border-b border-ice-200 dark:border-slate-800 last:border-0 ${idx % 2 === 1 ? 'bg-ice-100 dark:bg-slate-800/30' : ''}`}
                    >
                      <span className={`truncate ${isKey ? 'font-bold text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>
                        {fieldName}
                      </span>
                      {isKey && (
                        <span className="text-[8px] text-blue-600 dark:text-blue-400 font-bold ml-1">PK</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ErdViewer;
