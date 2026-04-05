import { motion } from 'framer-motion';
import { staggerContainer, fadeInUp } from '../../lib/animations';
import AdPlacementPreview from './AdPlacementPreview';
import type { AdFormat, CreativeAsset, ComplianceReport } from '../../lib/ad-specs/types';

interface Props {
  formats: AdFormat[];
  asset?: CreativeAsset;
  complianceReports?: ComplianceReport[];
  columns?: 2 | 3 | 4;
  onFormatSelect?: (format: AdFormat) => void;
}

export default function AdPlacementGrid({ formats, asset, complianceReports, columns = 3, onFormatSelect }: Props) {
  const reportMap = new Map(complianceReports?.map(r => [r.format.id, r]));

  return (
    <motion.div
      className={`ad-grid ad-grid-${columns}`}
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      {formats.map(format => {
        const report = reportMap.get(format.id);
        return (
          <motion.div
            key={format.id}
            className="ad-grid-cell"
            variants={fadeInUp}
            onClick={() => onFormatSelect?.(format)}
          >
            <AdPlacementPreview
              format={format}
              asset={asset}
              showFrame
              showOverlay
              compliancePassed={report?.passed}
            />
            <div className="ad-grid-cell-label">{format.name}</div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
