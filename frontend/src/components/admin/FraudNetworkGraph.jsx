import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import {
  Network,
  RefreshCw,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Activity,
  ArrowRight,
  DollarSign
} from 'lucide-react';
import { fetchAPI, formatCurrency, getRiskColor } from '../../utils/api';

export default function FraudNetworkGraph({ targetCustomerId = null, onSelectCustomer }) {
  const [rawGraphData, setRawGraphData] = useState({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL', 'FLAGGED', 'HIGH_VALUE'
  const [particleSpeed, setParticleSpeed] = useState(0.008);
  const [loading, setLoading] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 850, height: 580 });
  const [isOrbiting, setIsOrbiting] = useState(false);

  const containerRef = useRef(null);
  const graphRef = useRef(null);
  const orbitAngleRef = useRef(0);
  const animationFrameRef = useRef(null);

  // Resize handler
  useEffect(() => {
    const updateDims = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth || 850,
          height: 580,
        });
      }
    };
    updateDims();
    window.addEventListener('resize', updateDims);
    return () => window.removeEventListener('resize', updateDims);
  }, []);

  const loadGraph = useCallback(async () => {
    try {
      setLoading(true);
      const endpoint = targetCustomerId ? `/admin/network/${targetCustomerId}` : '/admin/network?limit=150';
      const data = await fetchAPI(endpoint);
      setRawGraphData(data || { nodes: [], links: [] });
    } catch (e) {
      console.error('[FraudNetworkGraph] Error loading graph:', e.message);
    } finally {
      setLoading(false);
    }
  }, [targetCustomerId]);

  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  // Filtered graph dataset
  const graphData = useMemo(() => {
    if (!rawGraphData.nodes?.length) return { nodes: [], links: [] };

    let nodes = [...rawGraphData.nodes];
    let links = [...rawGraphData.links];

    if (filterMode === 'FLAGGED') {
      const flaggedIds = new Set(nodes.filter((n) => n.isFlagged).map((n) => n.id));
      nodes = nodes.filter(
        (n) =>
          n.isFlagged ||
          links.some(
            (l) => flaggedIds.has(l.source?.id || l.source) && (l.target?.id || l.target) === n.id
          )
      );
      const activeIds = new Set(nodes.map((n) => n.id));
      links = links.filter(
        (l) => activeIds.has(l.source?.id || l.source) && activeIds.has(l.target?.id || l.target)
      );
    } else if (filterMode === 'HIGH_VALUE') {
      links = links.filter((l) => (l.value || 0) >= 5000);
      const activeIds = new Set();
      links.forEach((l) => {
        activeIds.add(l.source?.id || l.source);
        activeIds.add(l.target?.id || l.target);
      });
      nodes = nodes.filter((n) => activeIds.has(n.id));
    }

    return { nodes, links };
  }, [rawGraphData, filterMode]);

  // Orbit animation loop
  useEffect(() => {
    if (!isOrbiting || !graphRef.current) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    const orbit = () => {
      orbitAngleRef.current += 0.003;
      const distance = 400;
      graphRef.current.cameraPosition({
        x: distance * Math.sin(orbitAngleRef.current),
        y: distance * Math.cos(orbitAngleRef.current),
      });
      animationFrameRef.current = requestAnimationFrame(orbit);
    };

    animationFrameRef.current = requestAnimationFrame(orbit);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isOrbiting]);

  // Custom Node Canvas Painting with High-Contrast Professional Fintech Colors
  const paintNode = useCallback(
    (node, ctx, globalScale) => {
      if (
        !node ||
        typeof node.x !== 'number' ||
        typeof node.y !== 'number' ||
        !Number.isFinite(node.x) ||
        !Number.isFinite(node.y)
      ) {
        return;
      }

      const x = node.x;
      const y = node.y;
      const rawVal = Number(node.val);
      const radius = Number.isFinite(rawVal) && rawVal > 0 ? Math.max(3.5, Math.min(8, rawVal * 0.4)) : 4.5;

      const isSelected = selectedNode?.id === node.id;
      const isHovered = hoveredNode?.id === node.id;
      const isMule = Boolean(node.isFlagged && (node.pattern?.includes('Mule') || node.maxRiskScore >= 80));

      try {
        // Pulse ring for Flagged Mules / Selected
        if (isMule || isSelected || isHovered) {
          const pulseRadius = radius + (isMule ? 3.5 : 2.5);
          ctx.beginPath();
          ctx.arc(x, y, pulseRadius, 0, 2 * Math.PI, false);
          ctx.fillStyle = isMule ? 'rgba(239, 68, 68, 0.25)' : 'rgba(37, 99, 235, 0.25)';
          ctx.fill();
        }

        // Node Core - Distinct Professional Color Coding
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI, false);

        if (node.maxRiskScore >= 80 || isMule) {
          ctx.fillStyle = '#dc2626'; // Crimson Red
        } else if (node.maxRiskScore >= 50) {
          ctx.fillStyle = '#d97706'; // Amber
        } else if (node.id && String(node.id).startsWith('CUST-')) {
          ctx.fillStyle = '#2563eb'; // Brand Royal Blue
        } else {
          ctx.fillStyle = '#059669'; // Emerald Green for Merchants
        }
        ctx.fill();

        // White border ring
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = isSelected ? 2 : 1.2;
        ctx.stroke();
      } catch (e) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = isMule ? '#dc2626' : '#2563eb';
        ctx.fill();
      }

      // Label rendering
      try {
        if (globalScale > 1.3 || isHovered || isSelected || isMule) {
          const label = String(node.name || node.id || '');
          if (label) {
            const scale = Number.isFinite(globalScale) && globalScale > 0 ? globalScale : 1;
            const fontSize = Math.max(8.5 / scale, 2.5);
            ctx.font = `600 ${fontSize}px "Plus Jakarta Sans", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';

            const textWidth = ctx.measureText(label).width;
            if (Number.isFinite(textWidth)) {
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(x - textWidth / 2 - 3, y + radius + 2, textWidth + 6, fontSize + 3);
              ctx.strokeStyle = '#e2e8f0';
              ctx.lineWidth = 0.5;
              ctx.strokeRect(x - textWidth / 2 - 3, y + radius + 2, textWidth + 6, fontSize + 3);

              ctx.fillStyle = isMule ? '#b91c1c' : (isSelected ? '#1d4ed8' : '#1e293b');
              ctx.fillText(label, x, y + radius + 3.5);
            }
          }
        }
      } catch (err) {
        // Graceful
      }
    },
    [selectedNode, hoveredNode]
  );

  // Link particle colors
  const getParticleColor = useCallback((link) => {
    if (link.avgRisk >= 75 || link.severity === 'critical') return '#dc2626'; // Red
    if (link.avgRisk >= 50 || link.severity === 'high') return '#d97706'; // Amber
    return '#2563eb'; // Blue
  }, []);

  const handleZoomIn = () => graphRef.current?.zoom(graphRef.current.zoom() * 1.3, 400);
  const handleZoomOut = () => graphRef.current?.zoom(graphRef.current.zoom() / 1.3, 400);
  const handleResetZoom = () => graphRef.current?.zoomToFit(400, 40);

  const totalVolume = useMemo(() => {
    return (rawGraphData.links || []).reduce((acc, l) => acc + (l.value || 0), 0);
  }, [rawGraphData]);

  const flaggedNodesCount = useMemo(() => {
    return (rawGraphData.nodes || []).filter((n) => n.isFlagged).length;
  }, [rawGraphData]);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Top Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-card space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Topology Entities</span>
            <Network className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-bold text-slate-900 font-mono">
            {graphData.nodes.length} <span className="text-xs font-normal text-slate-500">nodes</span>
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-card space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Mule Clusters</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-xl font-bold text-rose-700 font-mono">
            {flaggedNodesCount} <span className="text-xs font-normal text-slate-500">flagged</span>
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-card space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Flow Pathways</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-bold text-emerald-700 font-mono">
            {graphData.links.length} <span className="text-xs font-normal text-slate-500">edges</span>
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-card space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Flow Volume</span>
            <DollarSign className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-xl font-bold text-indigo-700 font-mono">{formatCurrency(totalVolume)}</p>
        </div>
      </div>

      {/* Main Canvas + Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
        {/* Force Graph Interactive Window */}
        <div
          ref={containerRef}
          className="lg:col-span-3 rounded-xl bg-slate-50/80 border border-slate-200 relative overflow-hidden shadow-card h-[580px]"
        >
          {/* Subtle Grid Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />

          {/* Floating Top Control HUD */}
          <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 z-10 pointer-events-none">
            {/* Filter Toggle Pills */}
            <div className="flex items-center space-x-1 p-1 rounded-lg bg-white/95 backdrop-blur-md border border-slate-200 pointer-events-auto shadow-xs text-xs">
              {[
                { id: 'ALL', label: 'All Entities' },
                { id: 'FLAGGED', label: '🚨 Flagged Mules' },
                { id: 'HIGH_VALUE', label: '💎 High Value (>₹5k)' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterMode(f.id)}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    filterMode === f.id
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Actions HUD */}
            <div className="flex items-center space-x-1 p-1 rounded-lg bg-white/95 backdrop-blur-md border border-slate-200 pointer-events-auto shadow-xs">
              <button
                onClick={() => setIsOrbiting(!isOrbiting)}
                className={`p-1.5 rounded-md text-xs font-semibold flex items-center space-x-1 transition ${
                  isOrbiting
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
                title="Auto-Orbit Camera"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isOrbiting ? 'animate-spin' : ''}`} />
                <span className="text-[11px] hidden sm:inline">Orbit</span>
              </button>

              <button
                onClick={handleZoomIn}
                className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleZoomOut}
                className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleResetZoom}
                className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                title="Reset View"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={loadGraph}
                className="p-1.5 rounded-md text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition"
                title="Reload Topology"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Force Graph Renderer */}
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2 text-xs text-blue-600 font-medium">
              <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
              <p>Simulating entity network physics...</p>
            </div>
          ) : graphData.nodes.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500 font-medium">
              No matching entity nodes found for the selected filter.
            </div>
          ) : (
            <ForceGraph2D
              ref={graphRef}
              width={dimensions.width}
              height={dimensions.height}
              graphData={graphData}
              backgroundColor="#f8fafc"
              nodeCanvasObject={paintNode}
              nodeCanvasObjectMode={() => 'replace'}
              nodeRelSize={3.5}
              linkCurvature={0.2}
              linkWidth={(l) => Math.max(0.8, Math.min(2.5, Math.log10(l.value || 100) * 0.7))}
              linkColor={(l) =>
                l.avgRisk >= 75
                  ? 'rgba(220, 38, 38, 0.4)'
                  : l.avgRisk >= 50
                  ? 'rgba(217, 119, 6, 0.35)'
                  : 'rgba(37, 99, 235, 0.25)'
              }
              linkDirectionalParticles={3}
              linkDirectionalParticleSpeed={(l) =>
                Math.max(0.006, Math.min(0.018, particleSpeed * (l.value > 10000 ? 1.4 : 1)))
              }
              linkDirectionalParticleWidth={(l) => Math.max(1.8, Math.min(3.6, (l.value / 15000) * 2.8))}
              linkDirectionalParticleColor={getParticleColor}
              onNodeClick={(node) => {
                setSelectedNode(node);
                if (onSelectCustomer && node.id?.startsWith('CUST-')) {
                  onSelectCustomer(node.id);
                }
              }}
              onNodeHover={(node) => setHoveredNode(node || null)}
              d3AlphaDecay={0.02}
              d3VelocityDecay={0.3}
              warmupTicks={50}
              cooldownTicks={100}
            />
          )}

          {/* Bottom Legend */}
          <div className="absolute bottom-3 left-3 p-3 rounded-lg bg-white/95 backdrop-blur-md border border-slate-200 text-[11px] space-y-1.5 shadow-xs z-10 font-medium">
            <p className="font-bold text-slate-800">Entity Topology Map:</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-600">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span>👤 Customer Account</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span>🏬 Verified Merchant</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>⚡ Elevated Velocity</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                <span>🚨 Flagged Mule Hub</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Inspector Drawer */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 space-y-4 shadow-card">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Entity Topology Inspector</h4>
            {selectedNode && (
              <button
                onClick={() => setSelectedNode(null)}
                className="text-[10px] text-slate-500 hover:text-slate-800 font-semibold"
              >
                Clear
              </button>
            )}
          </div>

          {selectedNode ? (
            <div className="space-y-4 text-xs animate-fade-in">
              {/* Header Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                      selectedNode.isFlagged
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {selectedNode.pattern || 'Normal Node'}
                  </span>
                  <span className="font-mono text-slate-500 text-[11px] font-semibold">{selectedNode.id}</span>
                </div>

                <h3 className="text-sm font-extrabold text-slate-900">{selectedNode.name}</h3>
                <p className="text-slate-500 font-mono text-[11px]">{selectedNode.upiId}</p>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Peak Risk</span>
                  <p
                    className={`text-lg font-bold font-mono ${
                      selectedNode.maxRiskScore > 75
                        ? 'text-rose-700'
                        : selectedNode.maxRiskScore > 40
                        ? 'text-amber-700'
                        : 'text-emerald-700'
                    }`}
                  >
                    {selectedNode.maxRiskScore}/100
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Flow Volume</span>
                  <p className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                    {formatCurrency(selectedNode.volume)}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">In-Degree</span>
                  <p className="text-sm font-bold text-blue-700 font-mono">
                    {selectedNode.inDegree || 0} incoming
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Out-Degree</span>
                  <p className="text-sm font-bold text-indigo-700 font-mono">
                    {selectedNode.outDegree || 0} outgoing
                  </p>
                </div>
              </div>

              {/* Mule Alert Callout */}
              {selectedNode.isFlagged && (
                <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-[11px] text-red-800 leading-relaxed space-y-1">
                  <p className="font-bold flex items-center space-x-1.5 text-red-900">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                    <span>Mule Ring Aggregation Detected</span>
                  </p>
                  <p>
                    This account demonstrates disproportionate funneling behavior. Multiple distinct source entities are transmitting funds into this single aggregator node.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              {selectedNode.id?.startsWith('CUST-') && (
                <button
                  onClick={() => onSelectCustomer && onSelectCustomer(selectedNode.id)}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center space-x-1.5 transition shadow-xs"
                >
                  <span>Filter Graph to this Customer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-16 space-y-2">
              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
                <Network className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-800 font-semibold">No Entity Selected</p>
              <p className="text-[11px] text-slate-500 max-w-[200px] mx-auto leading-relaxed">
                Click any node or link in the graph to inspect connection degrees, flow volume, and flagged ring status.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
