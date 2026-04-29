import React from 'react';

interface Props {
  nodes: string[];
}

const RoutingVisualization: React.FC<Props> = ({ nodes }) => {
  return (
    <div className="bg-secondary/50 border-b border-gray-700 px-6 py-3">
      <p className="text-xs text-accent font-semibold mb-2 flex items-center gap-1">
        🔒 Routed via {nodes.length}+ nodes
      </p>
      <div className="flex items-center gap-2 overflow-x-auto">
        <span className="text-xs text-white bg-primary px-2 py-1 rounded">ME</span>
        {nodes.map((node, i) => (
          <React.Fragment key={i}>
            <span className="text-accent">→</span>
            <span className="text-xs text-white bg-primary px-2 py-1 rounded">{node}</span>
          </React.Fragment>
        ))}
        <span className="text-accent">→</span>
        <span className="text-xs text-white bg-accent/20 px-2 py-1 rounded border border-accent">RECIPIENT</span>
      </div>
      <p className="text-xs text-gray-500 mt-1">Onion-encrypted · Zero metadata logged · Anonymous routing</p>
    </div>
  );
};

export default RoutingVisualization;