import React, { useEffect, useState } from 'react';
import { Share2, Network, ShieldAlert, Cpu } from 'lucide-react';
import { GraphData, GraphNode } from '../types';
import { fetchMacroNetwork } from '../services/api';
import { Card } from '../components/common/Card';
import { GraphVisualizer } from '../components/common/GraphVisualizer';
import { Drawer } from '../components/common/Drawer';

interface NetworkExplorerPageProps {
  onSelectCase: (caseId: string) => void;
}

export const NetworkExplorerPage: React.FC<NetworkExplorerPageProps> = ({ onSelectCase }) => {
  const [networkData, setNetworkData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    fetchMacroNetwork()
      .then(data => setNetworkData(data))
      .finally(() => setLoading(false));
  }, []);

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node);
    if (node.type === 'Case') {
      onSelectCase(node.id);
    } else {
      setDrawerOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Fraud Network Explorer</h2>
          <p className="text-xs text-slate-500 mt-1">
            Global entity correlation across device rings, cards, and customer clusters
          </p>
        </div>
      </div>

      {/* Network Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Indexed Graph Nodes</span>
          <span className="text-xl font-bold font-mono text-slate-900">{networkData?.nodes.length || 0}</span>
        </Card>
        <Card className="p-4">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Entity Edges</span>
          <span className="text-xl font-bold font-mono text-slate-900">{networkData?.links.length || 0}</span>
        </Card>
        <Card className="p-4">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Major Device Ring</span>
          <span className="text-xs font-bold text-rose-600 block mt-1">SM-G935F (51 Cards)</span>
        </Card>
        <Card className="p-4">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Graph Engine</span>
          <span className="text-xs font-bold text-teal-700 block mt-1">TigerGraph GSQL v4.2</span>
        </Card>
      </div>

      {/* Main Graph View */}
      <Card className="p-4">
        {loading ? (
          <div className="h-96 flex items-center justify-center">
            <span className="text-xs text-slate-400">Loading macro graph...</span>
          </div>
        ) : networkData ? (
          <GraphVisualizer
            data={networkData}
            onSelectNode={handleNodeClick}
            height={520}
          />
        ) : (
          <div className="h-96 flex items-center justify-center text-xs text-slate-400">
            Network graph currently unavailable.
          </div>
        )}
      </Card>

      {/* Node Detail Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={selectedNode?.label || 'Entity Detail'}
        subtitle={`Type: ${selectedNode?.type || 'Entity'}`}
      >
        {selectedNode && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Entity Identifier</span>
              <div className="font-mono font-bold text-slate-900">{selectedNode.id}</div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Category</span>
                <span className="font-semibold text-slate-800">{selectedNode.type}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Connected Ring Cluster</span>
                <span className="font-semibold text-teal-700">Identified</span>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
