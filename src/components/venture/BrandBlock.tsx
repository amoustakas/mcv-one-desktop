import { StackBlock, Empty, lineStyle } from './_shell';

export function BrandBlock({ brand }: { brand: { primary_domain: string | null; color_primary: string | null; brand_kit_version: string | null } | null }) {
  return (
    <StackBlock label="🎨 Brand">
      {!brand ? <Empty /> : (
        <>
          <div style={lineStyle}>{brand.primary_domain ?? '—'}</div>
          {brand.color_primary && <div style={{ ...lineStyle, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: brand.color_primary }} />
            {brand.color_primary}
          </div>}
          {brand.brand_kit_version && <div style={lineStyle}>kit {brand.brand_kit_version}</div>}
        </>
      )}
    </StackBlock>
  );
}
