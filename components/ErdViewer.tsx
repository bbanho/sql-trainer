import React, { useState, useMemo } from 'react';
import { ErdNode, ErdEdge } from '../types';

interface ErdViewerProps {
  nodes: ErdNode[];
  edges: ErdEdge[];
}

const NODE_WIDTH = 160;
const HEADER_HEIGHT = 34; // Approximate height of the header
const FIELD_HEIGHT = 26;  // Approximate height of each field row

// --- Geometry Helpers ---

const getNodeHeight = (node: ErdNode) => {
  // Header + Fields + Borders padding
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
    <div className="w-full h-full bg-ice-50 dark:bg-slate-950 overflow-hidden relative border-b border-ice-300 dark:border-slate-800 select-none">
      {/* Dot Grid Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-15 dark:opacity-10" 
           style={{ backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      </div>

      {/* Controls */}
      <div className="absolute top-4 right-4 flex flex-col z-30 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-md overflow-hidden">
        <button onClick={handleZoomIn} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
        </button>
        <button onClick={handleZoomOut} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"/></svg>
        </button>
      </div>
      
      {/* Canvas */}
      <div className="w-full h-full overflow-auto flex items-center justify-center p-20 cursor-grab active:cursor-grabbing">
        <div 
          className="relative transition-transform duration-200 ease-out origin-center"
          style={{ width: '800px', height: '600px', transform: `scale(${zoom})` }}
        >
          {/* Edges Layer (Bottom) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-0">
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" className="fill-slate-400 dark:fill-slate-500" />
              </marker>
            </defs>
            {renderedEdges.map((e) => (
              <line 
                key={e.key}
                x1={e.start.x} y1={e.start.y}
                x2={e.end.x} y2={e.end.y}
                className="stroke-slate-400 dark:stroke-slate-500 transition-all duration-300"
                strokeWidth="1.5"
                markerEnd="url(#arrowhead)"
              />
            ))}
          </svg>

          {/* Nodes Layer (Top) */}
          {nodes.map(node => (
            <div
              key={node.id}
              className="absolute bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-lg z-10 flex flex-col overflow-hidden transition-all duration-300 group hover:border-blue-400 dark:hover:border-blue-500"
              style={{ 
                left: node.x, 
                top: node.y, 
                width: NODE_WIDTH,
              }}
            >
              {/* Header */}
              <div className="h-[34px] flex items-center justify-center bg-slate-100 dark:bg-slate-900 border-b border-slate-300 dark:border-slate-600 group-hover:bg-blue-50 dark:group-hover:bg-slate-800 transition-colors">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tight truncate px-2">
                  {node.label}
                </span>
              </div>
              
              {/* Fields */}
              <div className="flex flex-col bg-white dark:bg-slate-800">
                {node.fields.map((field, idx) => {
                  const isKey = field.startsWith('#') || field.includes('KEY');
                  const fieldName = field.replace('#', '');
                  return (
                    <div 
                      key={idx} 
                      className="h-[26px] flex items-center justify-between px-3 text-[10px] font-mono border-b border-slate-100 dark:border-slate-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <span className={`truncate ${isKey ? 'font-bold text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>
                        {fieldName}
                      </span>
                      {isKey && (
                        <svg className="w-2.5 h-2.5 text-amber-500 ml-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 010-2z" clipRule="evenodd" />
                        </svg>
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