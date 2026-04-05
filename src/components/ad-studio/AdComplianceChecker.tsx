import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { staggerContainer, fadeInUp } from '../../lib/animations';
import PlatformIcon from './PlatformIcon';
import type { ComplianceReport } from '../../lib/ad-specs/types';

const SEVERITY_ICONS = {
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};
const SEVERITY_COLORS = {
  error: 'var(--error)',
  warning: 'var(--warning)',
  info: 'var(--text-muted)',
};

interface Props {
  reports: ComplianceReport[];
  onFormatClick?: (formatId: string) => void;
}

export default function AdComplianceChecker({ reports, onFormatClick }: Props) {
  const totalPassing = reports.filter(r => r.passed).length;
  const totalFailing = reports.filter(r => !r.passed).length;

  return (
    <div className="compliance-checker">
      {/* Summary */}
      <div className="compliance-summary">
        <div className="compliance-stat pass">
          <CheckCircle size={14} />
          <span>{totalPassing} passing</span>
        </div>
        <div className="compliance-stat fail">
          <XCircle size={14} />
          <span>{totalFailing} failing</span>
        </div>
        <div className="compliance-stat total">
          <span>{reports.length} formats checked</span>
        </div>
      </div>

      {/* Per-format results */}
      <motion.div className="compliance-list" variants={staggerContainer} initial="hidden" animate="show">
        {reports.map(report => (
          <motion.div
            key={report.format.id}
            className={`compliance-item ${report.passed ? 'compliance-pass' : 'compliance-fail'}`}
            variants={fadeInUp}
            onClick={() => onFormatClick?.(report.format.id)}
          >
            <div className="compliance-item-header">
              <PlatformIcon platform={report.format.platform} size={12} />
              <span className="compliance-item-name">{report.format.name}</span>
              <span className={`compliance-badge ${report.passed ? 'pass' : 'fail'}`}>
                {report.passed ? 'PASS' : `${report.errors} error${report.errors !== 1 ? 's' : ''}`}
              </span>
            </div>

            {/* Show failed rules */}
            {report.results.filter(r => !r.passed).length > 0 && (
              <div className="compliance-rules">
                {report.results.filter(r => !r.passed).map((result, i) => {
                  const Icon = SEVERITY_ICONS[result.severity];
                  return (
                    <div key={i} className="compliance-rule" style={{ color: SEVERITY_COLORS[result.severity] }}>
                      <Icon size={11} />
                      <span className="compliance-rule-name">{result.rule}:</span>
                      <span className="compliance-rule-actual">{result.actual}</span>
                      <span className="compliance-rule-arrow">→</span>
                      <span className="compliance-rule-expected">{result.expected}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
