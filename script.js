// Initialize EmailJS - REPLACE WITH YOUR PUBLIC KEY
emailjs.init('o9ETzT_4f0WhbDv6U');

// Projects data
const projects = [
    {
        title: 'Lost But Found',
        description: 'Full-stack web app for FBLA. Node.js, Express, PostgreSQL with 3D floor maps and AI item classification.',
        tech: ['Node.js', 'Express', 'PostgreSQL', 'Three.js', 'TensorFlow.js', 'EJS'],
        link: '#'
    },
    {
        title: 'Battle Buddy AI',
        description: 'Voice-activated AI companion for veterans addressing mental health and VA benefits navigation.',
        tech: ['Python', 'AI/ML', 'Voice Processing', 'NLP'],
        link: '#'
    },
    {
        title: 'Java Labs & DSA',
        description: 'Complete CTP 150 coursework: inheritance, exception handling, recursion, polymorphism, and abstract classes.',
        tech: ['Java', 'OOP', 'Data Structures'],
        link: '#'
    },
    {
        title: 'Calculus Problem Solver',
        description: 'Interactive tool for solving calculus problems using Newton\'s method, Riemann sums, and optimization.',
        tech: ['Mathematics', 'Algorithm Design', 'Visualization'],
        link: '#'
    }
];

let projectIndex = 0;
let scrollProgress = 0;
let scene, camera, renderer, model;
let particles = [];
let mouseX = 0;
let mouseY = 0;

// Particle class
class Particle {
    constructor(x, y, z) {
        this.position = new THREE.Vector3(x, y, z);
        this.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.1,
            (Math.random() - 0.5) * 0.1,
            (Math.random() - 0.5) * 0.1
        );
        this.life = 1.0;
        this.decay = Math.random() * 0.01 + 0.005;
        this.geometry = new THREE.BufferGeometry();
        this.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0]), 3));
        this.material = new THREE.PointsMaterial({
            color: 0x7a7a7a,
            size: 0.05,
            sizeAttenuation: true,
            opacity: this.life
        });
        this.mesh = new THREE.Points(this.geometry, this.material);
        this.mesh.position.copy(this.position);
    }

    update(mouseWorldPos) {
        // Apply gravity
        this.velocity.y -= 0.005;

        // Check distance to mouse
        const distance = this.position.distanceTo(mouseWorldPos);
        if (distance < 0.5) { // 10 pixels ≈ 0.5 units in world space
            // Bounce away from cursor
            const direction = new THREE.Vector3().subVectors(this.position, mouseWorldPos).normalize();
            this.velocity.add(direction.multiplyScalar(0.15));
        }

        this.position.add(this.velocity);
        this.life -= this.decay;
        this.material.opacity = this.life;

        this.mesh.position.copy(this.position);

        return this.life > 0;
    }
}

// Three.js Setup
function initThreeJS() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 4);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, canvas: document.getElementById('hero-canvas') });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xd97706, 0.5);
    pointLight.position.set(-5, 5, 5);
    scene.add(pointLight);

    // Load model
    loadModel();

    // Animation loop
    animate();

    // Event listeners
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
}

function loadModel() {
    // Load OBJ model
    const objLoader = new THREE.OBJLoader();
    const mtlLoader = new THREE.MTLLoader();
    
    mtlLoader.load('tinker.mtl', (mtl) => {
        mtl.preload();
        objLoader.setMaterials(mtl);
        objLoader.load('tinker.obj', (obj) => {
            obj.scale.set(3, 3, 3);
            obj.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            scene.add(obj);
            model = obj;
        });
    });
}

function handleMouseMove(event) {
    mouseX = event.clientX;
    mouseY = event.clientY;
}

function animate() {
    requestAnimationFrame(animate);

    // Emit particles around model
    if (model && Math.random() < 0.3) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 2;
        const x = Math.cos(angle) * radius;
        const y = Math.random() * 2 - 1;
        const z = Math.sin(angle) * radius;
        const particle = new Particle(x, y, z);
        scene.add(particle.mesh);
        particles.push(particle);
    }

    // Update particles
    const mouseNDC = {
        x: (mouseX / window.innerWidth) * 2 - 1,
        y: -(mouseY / window.innerHeight) * 2 + 1
    };
    const mouseWorldPos = new THREE.Vector3(mouseNDC.x * 2, mouseNDC.y * 2, 0);

    particles = particles.filter(p => {
        const alive = p.update(mouseWorldPos);
        if (!alive) {
            scene.remove(p.mesh);
        }
        return alive;
    });

    if (model) {
        // Rotate based on scroll
        const targetRotationY = scrollProgress * Math.PI * 4;
        model.rotation.y += (targetRotationY - model.rotation.y) * 0.05;

        // Scale based on section
        const sectionProgress = scrollProgress * 3;
        let targetScale = 3;
        if (sectionProgress > 0.5 && sectionProgress < 2.5) {
            targetScale = 3 + (Math.sin((sectionProgress - 0.5) * Math.PI / 2) * 1.5);
        }
        model.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.05);

        // Position shift
        const targetPositionY = (sectionProgress - 1) * 0.5;
        model.position.y += (targetPositionY - model.position.y) * 0.05;
    }

    renderer.render(scene, camera);
}

function handleScroll() {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    scrollProgress = window.scrollY / scrollHeight;
}

function handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

function handleProjectNavigate(direction) {
    projectIndex = (projectIndex + direction + projects.length) % projects.length;
    updateProjectCard();
}

function updateProjectCard() {
    const project = projects[projectIndex];
    const card = document.getElementById('project-card');
    card.innerHTML = `
        <h2>${project.title}</h2>
        <p class="project-description">${project.description}</p>
        <div class="tech-stack">
            ${project.tech.map(tech => `<span class="tech-badge">${tech}</span>`).join('')}
        </div>
        <a href="${project.link}" class="project-link">View Project →</a>
    `;

    // Update indicators
    const indicators = document.getElementById('carousel-indicators');
    indicators.innerHTML = projects.map((_, i) => `
        <div class="indicator ${i === projectIndex ? 'active' : ''}" onclick="handleProjectNavigate(${i - projectIndex})"></div>
    `).join('');
}

async function handleContactSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
        await emailjs.send(
            'service_7u1lzfv', // REPLACE WITH YOUR SERVICE ID
            'portfolio_contact', // Template name
            {
                to_email: 'noreplylostbutfound@gmail.com', // CHANGE THIS TO YOUR EMAIL
                from_email: formData.get('email'),
                from_name: formData.get('name'),
                message: formData.get('message'),
                subject: formData.get('subject')
            }
        );

        document.getElementById('success-message').classList.add('show');
        e.target.reset();
        setTimeout(() => {
            document.getElementById('success-message').classList.remove('show');
        }, 3000);
    } catch (error) {
        console.error('Email send failed:', error);
        alert('Failed to send message. Please check console and verify EmailJS setup.');
    }
}

// Initialize on load
window.addEventListener('load', () => {
    initThreeJS();
    updateProjectCard();
});
