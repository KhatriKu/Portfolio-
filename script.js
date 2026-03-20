// Initialize EmailJS
emailjs.init('YOUR_EMAILJS_PUBLIC_KEY');

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
let scene, camera, renderer, model;
let particles = [];
let mouseX = 0, mouseY = 0;

// ─── Particle class ────────────────────────────────────────────────────────────
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
            color: 0xff9844,
            size: 0.05,
            sizeAttenuation: true,
            transparent: true,
            opacity: 1.0
        });
        this.mesh = new THREE.Points(this.geometry, this.material);
        this.mesh.position.copy(this.position);
    }

    update(mouseWorldPos) {
        this.velocity.y -= 0.005;
        const distance = this.position.distanceTo(mouseWorldPos);
        if (distance < 0.5) {
            const dir = new THREE.Vector3().subVectors(this.position, mouseWorldPos).normalize();
            this.velocity.add(dir.multiplyScalar(0.15));
        }
        this.position.add(this.velocity);
        this.life -= this.decay;
        this.material.opacity = this.life;
        this.mesh.position.copy(this.position);
        return this.life > 0;
    }
}

// ─── Three.js Setup ────────────────────────────────────────────────────────────
function initThreeJS() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 4);

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        canvas: document.getElementById('hero-canvas')
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0xd97706, 0.5);
    pointLight.position.set(-5, 5, 5);
    scene.add(pointLight);

    loadModel();
    initScrollAnimations();
    animate();

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
}

// ─── OBJ + MTL Loader ─────────────────────────────────────────────────────────
function loadModel() {
    // MTLLoader and OBJLoader are available globally after the CDN scripts load
    const mtlLoader = new THREE.MTLLoader();
    mtlLoader.load('obj.mtl', (mtl) => {
        mtl.preload();

        const objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(mtl);
        objLoader.load('tinker.obj', (obj) => {
            // Centre and normalise the model to fit the scene
            const box = new THREE.Box3().setFromObject(obj);
            const centre = new THREE.Vector3();
            box.getCenter(centre);
            obj.position.sub(centre); // centre at origin

            const size = new THREE.Vector3();
            box.getSize(size);
            const maxDim = Math.max(size.x, size.y, size.z);
            const targetSize = 3;
            const scale = targetSize / maxDim;
            obj.scale.setScalar(scale);

            obj.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            scene.add(obj);
            model = obj;
        },
        // progress
        undefined,
        (err) => console.error('OBJ load error', err));
    },
    undefined,
    (err) => console.error('MTL load error', err));
}

// ─── GSAP ScrollTrigger – scrolljack animation ─────────────────────────────────
// We drive the model's rotation and position entirely through GSAP tweened
// proxy values so the animation is frame-perfect and tied to actual scroll position.
const modelProxy = { rotY: 0, posY: 0, scale: 3 };

function initScrollAnimations() {
    gsap.registerPlugin(ScrollTrigger);

    const sections = ['#section-about', '#section-projects', '#section-contact'];
    const totalSections = sections.length;

    // ── Section fade-in on enter ──────────────────────────────────────────────
    sections.forEach((sel) => {
        gsap.from(sel + ' .content-wrapper', {
            scrollTrigger: {
                trigger: sel,
                start: 'top 80%',
                toggleActions: 'play none none reverse'
            },
            opacity: 0,
            y: 60,
            duration: 0.8,
            ease: 'power2.out'
        });
    });

    // ── Model rotation: full spin across the whole page ───────────────────────
    gsap.to(modelProxy, {
        rotY: Math.PI * 4,          // two full rotations over all sections
        ease: 'none',
        scrollTrigger: {
            trigger: '#scroll-container',
            start: 'top top',
            end: 'bottom bottom',
            scrub: 1.2                // slight lag = cinematic feel
        }
    });

    // ── Model scale: grow during projects section, normal elsewhere ───────────
    // grow on enter projects
    gsap.to(modelProxy, {
        scale: 4.5,
        ease: 'power1.inOut',
        scrollTrigger: {
            trigger: '#section-projects',
            start: 'top 70%',
            end: 'top 20%',
            scrub: true
        }
    });
    // shrink on leave projects
    gsap.to(modelProxy, {
        scale: 3,
        ease: 'power1.inOut',
        scrollTrigger: {
            trigger: '#section-projects',
            start: 'bottom 80%',
            end: 'bottom 30%',
            scrub: true
        }
    });

    // ── Model vertical drift ─────────────────────────────────────────────────
    gsap.to(modelProxy, {
        posY: -1.5,
        ease: 'none',
        scrollTrigger: {
            trigger: '#scroll-container',
            start: 'top top',
            end: 'bottom bottom',
            scrub: 1.5
        }
    });
}

// ─── Animation Loop ────────────────────────────────────────────────────────────
function animate() {
    requestAnimationFrame(animate);

    // Emit particles
    if (model && Math.random() < 0.3) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 2;
        const particle = new Particle(
            Math.cos(angle) * radius,
            Math.random() * 2 - 1,
            Math.sin(angle) * radius
        );
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
        if (!alive) scene.remove(p.mesh);
        return alive;
    });

    // Apply GSAP-driven proxy values directly — no lerp needed, scrub handles smoothing
    if (model) {
        model.rotation.y = modelProxy.rotY;
        model.position.y = modelProxy.posY;
        model.scale.setScalar(modelProxy.scale);
    }

    renderer.render(scene, camera);
}

// ─── Handlers ─────────────────────────────────────────────────────────────────
function handleMouseMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
}

function handleResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    ScrollTrigger.refresh();
}

// ─── Projects Carousel ────────────────────────────────────────────────────────
function handleProjectNavigate(direction) {
    projectIndex = (projectIndex + direction + projects.length) % projects.length;
    updateProjectCard();
}

function updateProjectCard() {
    const project = projects[projectIndex];
    document.getElementById('project-card').innerHTML = `
        <h2>${project.title}</h2>
        <p class="project-description">${project.description}</p>
        <div class="tech-stack">
            ${project.tech.map(t => `<span class="tech-badge">${t}</span>`).join('')}
        </div>
        <a href="${project.link}" class="project-link">View Project →</a>
    `;

    document.getElementById('carousel-indicators').innerHTML = projects.map((_, i) => `
        <div class="indicator ${i === projectIndex ? 'active' : ''}"
             onclick="handleProjectNavigate(${i - projectIndex})"></div>
    `).join('');
}

// ─── Contact Form ─────────────────────────────────────────────────────────────
async function handleContactSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
        await emailjs.send(
            'YOUR_SERVICE_ID',
            'portfolio_contact',
            {
                to_email: 'noreply@kushal.dev',
                from_email: formData.get('email'),
                from_name: formData.get('name'),
                message: formData.get('message'),
                subject: formData.get('subject')
            }
        );
        document.getElementById('success-message').classList.add('show');
        e.target.reset();
        setTimeout(() => document.getElementById('success-message').classList.remove('show'), 3000);
    } catch (err) {
        console.error('EmailJS error:', err);
        alert('Failed to send message. Check console for details.');
    }
}

// ─── Init ──────────────────────────────────────────────────────────────────────
window.addEventListener('load', () => {
    initThreeJS();
    updateProjectCard();
});
