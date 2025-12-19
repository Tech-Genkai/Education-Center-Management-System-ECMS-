(function(){
    // Shared particles script used by auth & error pages
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const mouse = { x: null, y: null, radius: 150 };
    window.addEventListener('mousemove', function(event) { mouse.x = event.x; mouse.y = event.y; });
    window.addEventListener('mouseout', function() { mouse.x = null; mouse.y = null; });

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 3 + 1;
            this.baseX = this.x;
            this.baseY = this.y;
            this.density = (Math.random() * 30) + 1;
            this.speedX = (Math.random() - 0.5) * 0.5;
            this.speedY = (Math.random() - 0.5) * 0.5;
        }
        draw() {
            const isDark = document.documentElement.classList.contains('dark');
            ctx.fillStyle = isDark ? 'rgba(147, 197, 253, 0.4)' : 'rgba(139, 92, 72, 0.3)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
        }
        update() {
            this.baseX += this.speedX;
            this.baseY += this.speedY;

            if (this.baseX > canvas.width) this.baseX = 0;
            if (this.baseX < 0) this.baseX = canvas.width;
            if (this.baseY > canvas.height) this.baseY = 0;
            if (this.baseY < 0) this.baseY = canvas.height;

            if (mouse.x != null && mouse.y != null) {
                let dx = mouse.x - this.x, dy = mouse.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy) || 1;
                if (distance < mouse.radius) {
                    let force = (mouse.radius - distance) / mouse.radius;
                    this.x -= (dx / distance) * force * this.density;
                    this.y -= (dy / distance) * force * this.density;
                } else {
                    this.x -= (this.x - this.baseX) / 10;
                    this.y -= (this.y - this.baseY) / 10;
                }
            } else {
                this.x -= (this.x - this.baseX) / 10;
                this.y -= (this.y - this.baseY) / 10;
            }
        }
    }

    const particlesArray = [];
    const numberOfParticles = 200;

    function init() {
        particlesArray.length = 0;
        for (let i = 0; i < numberOfParticles; i++) {
            particlesArray.push(new Particle());
        }
    }
    init();

    function connect() {
        const isDark = document.documentElement.classList.contains('dark');
        for (let a = 0; a < particlesArray.length; a++) {
            for (let b = a; b < particlesArray.length; b++) {
                let dx = particlesArray[a].x - particlesArray[b].x, dy = particlesArray[a].y - particlesArray[b].y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 100) {
                    ctx.strokeStyle = isDark ? `rgba(147, 197, 253, ${(1 - distance / 100) * 0.3})` : `rgba(139, 92, 72, ${(1 - distance / 100) * 0.2})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                    ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                    ctx.stroke();
                }
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
            particlesArray[i].draw();
        }
        connect();
        requestAnimationFrame(animate);
    }
    animate();
})();
