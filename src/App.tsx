import { useState } from 'react';
import TopBar, { type Panel } from './components/TopBar';
import VentureSidebar from './components/VentureSidebar';
import NAOSChat from './components/NAOSChat';
import VentureDashboard from './components/VentureDashboard';
import SessionsPanel from './components/SessionsPanel';
import OpsPanel from './components/OpsPanel';
import { ventures, getVenture } from './lib/ventures';

export default function App() {
  const [activePanel, setActivePanel] = useState<Panel>('chat');
  const [activeVenture, setActiveVenture] = useState('mcv');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const venture = getVenture(activeVenture) ?? ventures[0];

  return (
    <div className="app-layout">
      <VentureSidebar
        activeVenture={activeVenture}
        onSelect={setActiveVenture}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
      />
      <div className="app-main">
        <TopBar
          activePanel={activePanel}
          onPanelChange={setActivePanel}
          ventureLabel={venture.name}
        />
        <main className="app-content">
          {activePanel === 'chat' && <NAOSChat venture={venture} />}
          {activePanel === 'dashboard' && <VentureDashboard venture={venture} />}
          {activePanel === 'sessions' && <SessionsPanel />}
          {activePanel === 'ops' && <OpsPanel />}
        </main>
      </div>

      <style>{`
        .app-layout {
          display: flex;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
        }

        .app-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          height: 100%;
        }

        .app-content {
          flex: 1;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
