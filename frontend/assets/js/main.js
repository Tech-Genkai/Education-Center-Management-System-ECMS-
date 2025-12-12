import Alpine from 'alpinejs';

window.Alpine = Alpine;

function dashboardState() {
  return {
    health: { status: 'loading...', service: 'frontend', ts: '' },
    async init() {
      try {
        const res = await fetch('http://localhost:5000/healthz');
        if (!res.ok) throw new Error(`status ${res.status}`);
        this.health = await res.json();
      } catch (err) {
        this.health = { status: 'unreachable', service: 'backend', ts: String(err) };
      }
    }
  };
}

window.dashboardState = dashboardState;

Alpine.start();
