/**
 * MCV One Desktop — Docker Integration Routes
 *
 * Provides real-time Docker container monitoring, stats, and management
 * via the local server. Scans all Docker containers across all ventures.
 */

import { execFile } from 'child_process';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExpressApp = any;

interface DockerContainer {
  id: string;
  name: string;
  image: string;
  status: string;
  state: 'running' | 'exited' | 'paused' | 'created' | 'restarting' | 'dead';
  ports: string;
  created: string;
  networks: string;
  venture: string | null;
  labels: Record<string, string>;
}

interface DockerStats {
  containerId: string;
  name: string;
  cpuPercent: string;
  memUsage: string;
  memLimit: string;
  memPercent: string;
  netIO: string;
  blockIO: string;
  pids: string;
}

interface DockerImage {
  id: string;
  repository: string;
  tag: string;
  size: string;
  created: string;
}

interface DockerVolume {
  name: string;
  driver: string;
  mountpoint: string;
  size: string;
}

interface DockerNetwork {
  id: string;
  name: string;
  driver: string;
  scope: string;
  containers: number;
}

function dockerExec(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile('docker', args, { timeout: 15000, maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        // Docker might not be running
        if (stderr?.includes('Cannot connect') || stderr?.includes('not running')) {
          reject(new Error('Docker Desktop is not running'));
        } else {
          reject(new Error(stderr || err.message));
        }
      } else {
        resolve(stdout);
      }
    });
  });
}

function inferVenture(name: string, image: string, labels: Record<string, string>): string | null {
  const text = `${name} ${image} ${labels['com.docker.compose.project'] || ''}`.toLowerCase();
  if (text.includes('futurestate')) return 'futurestate';
  if (text.includes('betedge') || text.includes('bet-edge')) return 'betedge';
  if (text.includes('warforge')) return 'warforge';
  if (text.includes('mcv-desktop') || text.includes('mcv_desktop')) return 'mcv';
  if (text.includes('mcv-dev') || text.includes('mcv_one') || text.includes('mcv-one')) return 'mcv';
  if (text.includes('n8n')) return 'mcv';
  return null;
}

function parseLabels(labelStr: string): Record<string, string> {
  const labels: Record<string, string> = {};
  if (!labelStr) return labels;
  for (const pair of labelStr.split(',')) {
    const [key, ...rest] = pair.split('=');
    if (key) labels[key.trim()] = rest.join('=').trim();
  }
  return labels;
}

export function registerDockerRoutes(app: ExpressApp) {
  // ── List all containers (running + stopped) ──
  app.get('/local/docker/containers', async (_req: unknown, res: { json: (data: unknown) => void; status: (code: number) => { json: (data: unknown) => void } }) => {
    try {
      const format = '{{.ID}}|{{.Names}}|{{.Image}}|{{.Status}}|{{.State}}|{{.Ports}}|{{.CreatedAt}}|{{.Networks}}|{{.Labels}}';
      const stdout = await dockerExec(['ps', '-a', '--format', format, '--no-trunc']);
      const containers: DockerContainer[] = stdout.trim().split('\n').filter(Boolean).map(line => {
        const [id, name, image, status, state, ports, created, networks, labelsRaw] = line.split('|');
        const labels = parseLabels(labelsRaw || '');
        return {
          id: (id || '').slice(0, 12),
          name: name || '',
          image: image || '',
          status: status || '',
          state: (state || 'unknown') as DockerContainer['state'],
          ports: ports || '',
          created: created || '',
          networks: networks || '',
          venture: inferVenture(name || '', image || '', labels),
          labels,
        };
      });

      const running = containers.filter(c => c.state === 'running').length;
      const stopped = containers.filter(c => c.state === 'exited').length;

      res.json({
        available: true,
        containers,
        summary: { total: containers.length, running, stopped, paused: containers.filter(c => c.state === 'paused').length },
      });
    } catch (err) {
      res.json({
        available: false,
        error: err instanceof Error ? err.message : 'Docker unavailable',
        containers: [],
        summary: { total: 0, running: 0, stopped: 0, paused: 0 },
      });
    }
  });

  // ── Container stats (live CPU/memory) ──
  app.get('/local/docker/stats', async (_req: unknown, res: { json: (data: unknown) => void; status: (code: number) => { json: (data: unknown) => void } }) => {
    try {
      const stdout = await dockerExec(['stats', '--no-stream', '--format', '{{.ID}}|{{.Name}}|{{.CPUPerc}}|{{.MemUsage}}|{{.MemPerc}}|{{.NetIO}}|{{.BlockIO}}|{{.PIDs}}']);
      const stats: DockerStats[] = stdout.trim().split('\n').filter(Boolean).map(line => {
        const [containerId, name, cpuPercent, memRaw, memPercent, netIO, blockIO, pids] = line.split('|');
        const [memUsage, memLimit] = (memRaw || '').split('/').map(s => s.trim());
        return { containerId: (containerId || '').slice(0, 12), name: name || '', cpuPercent: cpuPercent || '0%', memUsage: memUsage || '0B', memLimit: memLimit || '0B', memPercent: memPercent || '0%', netIO: netIO || '0B / 0B', blockIO: blockIO || '0B / 0B', pids: pids || '0' };
      });
      res.json({ stats });
    } catch (err) {
      res.json({ stats: [], error: err instanceof Error ? err.message : 'Stats unavailable' });
    }
  });

  // ── Container logs ──
  app.get('/local/docker/logs/:containerId', async (req: { params: { containerId: string }; query: { tail?: string } }, res: { json: (data: unknown) => void; status: (code: number) => { json: (data: unknown) => void } }) => {
    try {
      const tail = req.query.tail || '100';
      const stdout = await dockerExec(['logs', '--tail', tail, '--timestamps', req.params.containerId]);
      res.json({ containerId: req.params.containerId, logs: stdout, lines: stdout.split('\n').length });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Logs unavailable' });
    }
  });

  // ── Container actions (start/stop/restart) ──
  app.post('/local/docker/action', async (req: { body: { containerId: string; action: string } }, res: { json: (data: unknown) => void; status: (code: number) => { json: (data: unknown) => void } }) => {
    const { containerId, action } = req.body;
    if (!containerId || !action) return res.status(400).json({ error: 'containerId and action required' });
    const allowed = ['start', 'stop', 'restart', 'pause', 'unpause'];
    if (!allowed.includes(action)) return res.status(400).json({ error: `Action must be one of: ${allowed.join(', ')}` });
    try {
      await dockerExec([action, containerId]);
      res.json({ success: true, containerId, action });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Action failed' });
    }
  });

  // ── Docker images ──
  app.get('/local/docker/images', async (_req: unknown, res: { json: (data: unknown) => void }) => {
    try {
      const stdout = await dockerExec(['images', '--format', '{{.ID}}|{{.Repository}}|{{.Tag}}|{{.Size}}|{{.CreatedAt}}']);
      const images: DockerImage[] = stdout.trim().split('\n').filter(Boolean).map(line => {
        const [id, repository, tag, size, created] = line.split('|');
        return { id: (id || '').slice(0, 12), repository: repository || '', tag: tag || '', size: size || '', created: created || '' };
      });
      res.json({ images });
    } catch { res.json({ images: [] }); }
  });

  // ── Docker volumes ──
  app.get('/local/docker/volumes', async (_req: unknown, res: { json: (data: unknown) => void }) => {
    try {
      const stdout = await dockerExec(['volume', 'ls', '--format', '{{.Name}}|{{.Driver}}|{{.Mountpoint}}']);
      const volumes: DockerVolume[] = stdout.trim().split('\n').filter(Boolean).map(line => {
        const [name, driver, mountpoint] = line.split('|');
        return { name: name || '', driver: driver || '', mountpoint: mountpoint || '', size: '' };
      });
      res.json({ volumes });
    } catch { res.json({ volumes: [] }); }
  });

  // ── Docker networks ──
  app.get('/local/docker/networks', async (_req: unknown, res: { json: (data: unknown) => void }) => {
    try {
      const stdout = await dockerExec(['network', 'ls', '--format', '{{.ID}}|{{.Name}}|{{.Driver}}|{{.Scope}}']);
      const networks: DockerNetwork[] = stdout.trim().split('\n').filter(Boolean).map(line => {
        const [id, name, driver, scope] = line.split('|');
        return { id: (id || '').slice(0, 12), name: name || '', driver: driver || '', scope: scope || '', containers: 0 };
      });
      res.json({ networks });
    } catch { res.json({ networks: [] }); }
  });

  // ── Docker compose operations ──
  app.post('/local/docker/compose', async (req: { body: { action: string; project?: string; cwd?: string } }, res: { json: (data: unknown) => void; status: (code: number) => { json: (data: unknown) => void } }) => {
    const { action, cwd } = req.body;
    const allowed = ['up', 'down', 'ps', 'logs', 'restart'];
    if (!allowed.includes(action)) return res.status(400).json({ error: `Compose action must be: ${allowed.join(', ')}` });
    try {
      const args = ['compose'];
      if (action === 'up') args.push('up', '-d');
      else if (action === 'down') args.push('down');
      else if (action === 'ps') args.push('ps', '--format', 'json');
      else if (action === 'logs') args.push('logs', '--tail', '50');
      else if (action === 'restart') args.push('restart');

      const stdout = await new Promise<string>((resolve, reject) => {
        execFile('docker', args, { cwd: cwd || process.cwd(), timeout: 30000, maxBuffer: 1024 * 1024 }, (err, out, stderr) => {
          if (err) reject(new Error(stderr || err.message));
          else resolve(out);
        });
      });
      res.json({ success: true, action, output: stdout });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Compose action failed' });
    }
  });

  console.log('  [DOCKER] Routes registered: /local/docker/containers, /local/docker/stats, /local/docker/logs, /local/docker/images, /local/docker/volumes, /local/docker/networks, /local/docker/compose');
}
