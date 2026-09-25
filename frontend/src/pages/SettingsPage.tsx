import React, { useState } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';

export const SettingsPage: React.FC = () => {
  const [uncertaintyThreshold, setUncertaintyThreshold] = useState(0.70);
  const [sarThreshold, setSarThreshold] = useState(1000);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Platform Preferences & Governance</h2>
        <p className="text-xs text-slate-500 mt-1">
          Configure investigation thresholds and analyst governance controls
        </p>
      </div>

      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
          Policy Engine Thresholds
        </h3>

        <div className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Rule R1: Verification Before Block Threshold
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="range"
                min="0.5"
                max="0.85"
                step="0.05"
                value={uncertaintyThreshold}
                onChange={(e) => setUncertaintyThreshold(parseFloat(e.target.value))}
                className="w-64"
              />
              <span className="font-mono font-bold text-slate-800">
                {Math.round(uncertaintyThreshold * 100)}%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Signals below this confidence trigger customer validation before any card block.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <label className="font-semibold text-slate-700 block mb-1">
              Rule R2: SAR Regulatory Exposure Threshold (USD)
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                value={sarThreshold}
                onChange={(e) => setSarThreshold(parseInt(e.target.value) || 0)}
                className="w-36 text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 font-mono"
              />
              <span className="text-slate-400 text-xs">USD</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Confirmed fraud episodes above this amount trigger mandatory FinCEN SAR filing.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-emerald-600 font-semibold">
              {saved ? '✓ Preferences updated' : ''}
            </span>
            <Button variant="primary" size="md" onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
