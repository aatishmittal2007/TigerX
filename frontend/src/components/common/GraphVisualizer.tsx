import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { GraphData, GraphNode, GraphLink } from '../../types';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface GraphVisualizerProps {
  data: GraphData;
  onSelectNode?: (node: GraphNode) => void;
  height?: number;
}

export const GraphVisualizer: React.FC<GraphVisualizerProps> = ({
  data,
  onSelectNode,
  height = 420
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    if (!svgRef.current || !data.nodes || data.nodes.length === 0) return;

    const width = containerRef.current?.clientWidth || 800;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Prepare deep clones of data for D3 simulation
    const nodes = data.nodes.map(d => ({ ...d }));
    const links = data.links.map(d => ({ ...d }));

    // Container for zoom/pan
    const g = svg.append('g').attr('class', 'graph-content');

    // Zoom setup
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoomLevel(event.transform.k);
      });

    svg.call(zoom);

    // Force simulation
    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links as any).id((d: any) => d.id).distance(80))
      .force('charge', d3.forceManyBody().strength(-240))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(28));

    // Links
    const link = g.append('g')
      .attr('stroke', '#CBD5E1')
      .attr('stroke-opacity', 0.8)
      .attr('stroke-width', 1.5)
      .selectAll('line')
      .data(links)
      .enter()
      .append('line');

    // Link labels
    const linkText = g.append('g')
      .selectAll('text')
      .data(links)
      .enter()
      .append('text')
      .text((d: any) => d.label || d.type || '')
      .attr('font-size', '8px')
      .attr('fill', '#94A3B8')
      .attr('text-anchor', 'middle')
      .attr('dy', -3);

    // Node groups
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('cursor', 'pointer')
      .call(
        d3.drag<any, any>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      )
      .on('click', (_, d: any) => {
        if (onSelectNode) onSelectNode(d);
      });

    // Node Circles
    node.append('circle')
      .attr('r', (d: any) => d.size || 16)
      .attr('fill', (d: any) => {
        if (d.color) return d.color;
        switch (d.type) {
          case 'Customer': return '#3B82F6';
          case 'Card': return d.verdict === 'legitimate' ? '#10B981' : '#F43F5E';
          case 'Transaction': return '#F59E0B';
          case 'DeviceProfile':
          case 'Device': return '#8B5CF6';
          case 'ConnectedCard': return '#EC4899';
          default: return '#0D9488';
        }
      })
      .attr('stroke', '#FFFFFF')
      .attr('stroke-width', 2)
      .attr('class', 'transition-all duration-150 hover:opacity-90 shadow-sm');

    // Node Labels
    node.append('text')
      .text((d: any) => d.label || d.id)
      .attr('font-size', '10px')
      .attr('font-family', 'Inter, sans-serif')
      .attr('font-weight', '500')
      .attr('fill', '#334155')
      .attr('text-anchor', 'middle')
      .attr('dy', 26);

    // Simulation Tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      linkText
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [data, height]);

  const handleResetZoom = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(400).call(
      (d3.zoom().transform as any),
      d3.zoomIdentity
    );
  };

  return (
    <div ref={containerRef} className="relative w-full rounded-xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
      {/* Legend & Controls */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-2 text-[10px] font-medium bg-white/90 backdrop-blur-xs p-1.5 rounded-lg border border-slate-200/80 shadow-xs">
        <div className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span><span>Customer</span></div>
        <div className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span><span>Fraud Card</span></div>
        <div className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span><span>Transaction</span></div>
        <div className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span><span>Device Profile</span></div>
        <div className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span><span>Connected Card</span></div>
      </div>

      <div className="absolute bottom-3 right-3 z-10 flex items-center space-x-1 bg-white/90 backdrop-blur-xs p-1 rounded-lg border border-slate-200/80 shadow-xs">
        <button
          onClick={handleResetZoom}
          title="Reset Zoom"
          className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <span className="text-[10px] font-mono text-slate-400 px-1">
          {Math.round(zoomLevel * 100)}%
        </span>
      </div>

      <svg
        ref={svgRef}
        width="100%"
        height={height}
        className="w-full bg-slate-50/40"
      />
    </div>
  );
};
