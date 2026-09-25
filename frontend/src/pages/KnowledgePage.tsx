import React, { useEffect, useState } from 'react';
import { BookOpen, Search, ExternalLink, ShieldCheck, Scale, FileText } from 'lucide-react';
import { KnowledgePolicy, KnowledgePattern, KnowledgeRegulation } from '../types';
import { fetchKnowledge } from '../services/api';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';

export const KnowledgePage: React.FC = () => {
  const [policies, setPolicies] = useState<KnowledgePolicy[]>([]);
  const [patterns, setPatterns] = useState<KnowledgePattern[]>([]);
  const [regulations, setRegulations] = useState<KnowledgeRegulation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKnowledge()
      .then(res => {
        setPolicies(res.policies);
        setPatterns(res.patterns);
        setRegulations(res.regulations);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredPolicies = policies.filter(p =>
    p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Knowledge Base & Policies</h2>
          <p className="text-xs text-slate-500 mt-1">
            Grounded GraphRAG repository: Fraud Policy v1.0, typologies, and regulatory standards
          </p>
        </div>
        <div className="w-72">
          <input
            type="text"
            placeholder="Search policies or rules (e.g. R1, R6)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 shadow-2xs transition"
          />
        </div>
      </div>

      {/* Fraud Policy Rules R1–R10 */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
          <Scale className="w-4 h-4 text-teal-600" />
          <h3 className="text-sm font-bold text-slate-900">Fraud Policy v1.0 (Rules R1 to R10)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPolicies.map((p) => (
            <div key={p.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center space-x-2">
                <Badge variant="teal" size="sm">{p.id}</Badge>
                <h4 className="text-xs font-bold text-slate-900">{p.title}</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{p.summary}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Known Fraud Patterns */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <h3 className="text-sm font-bold text-slate-900">Recognized Fraud Typologies</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {patterns.map((pat) => (
            <div key={pat.name} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
              <h4 className="text-xs font-bold text-slate-900">{pat.label}</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">{pat.desc}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Regulatory Guidance Links */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
          <FileText className="w-4 h-4 text-teal-600" />
          <h3 className="text-sm font-bold text-slate-900">Regulatory Authorities & References</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {regulations.map((reg, idx) => (
            <a
              key={idx}
              href={reg.url}
              target="_blank"
              rel="noreferrer"
              className="p-3 rounded-lg border border-slate-200 bg-slate-50/40 hover:bg-slate-100 transition flex items-center justify-between group"
            >
              <div>
                <span className="text-[10px] font-bold uppercase text-teal-700 block">{reg.authority}</span>
                <span className="text-xs font-semibold text-slate-800 group-hover:text-slate-900">{reg.title}</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 transition" />
            </a>
          ))}
        </div>
      </Card>
    </div>
  );
};
