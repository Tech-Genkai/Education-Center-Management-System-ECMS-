import Alpine from 'alpinejs';

window.Alpine = Alpine;

function dashboardState() {
  return {
    health: { status: 'loading...', service: 'frontend', ts: '' },
    dbStatus: { connected: false, message: 'checking...' },
    async init() {
      try {
        const res = await fetch('http://localhost:5000/healthz');
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = await res.json();
        this.health = data;
        this.dbStatus = data.database || { connected: false, message: 'unknown' };
      } catch (err) {
        this.health = { status: 'unreachable', service: 'backend', ts: String(err) };
        this.dbStatus = { connected: false, message: 'backend unreachable' };
      }
    }
  };
}

window.dashboardState = dashboardState;

Alpine.start();
