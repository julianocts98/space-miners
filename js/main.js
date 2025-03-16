console.log('Main script loaded');
console.log('THREE.js version:', THREE.REVISION);

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    let mouseLocked = false;
    let paused = false;
    const menu = document.getElementById('menu');
    const resumeBtn = document.getElementById('resumeBtn');
    const quitBtn = document.getElementById('quitBtn');
    const crosshair = document.getElementById('crosshair');
    let deltaX = 0, deltaY = 0;
    
    // Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add stars background
const starGeometry = new THREE.BufferGeometry();
const starVertices = [];
for (let i = 0; i < 10000; i++) {
    const x = (Math.random() - 0.5) * 2000;
    const y = (Math.random() - 0.5) * 2000;
    const z = (Math.random() - 0.5) * 2000;
    starVertices.push(x, y, z);
}
starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
const starMaterial = new THREE.PointsMaterial({ color: 0xFFFFFF });
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);
console.log('Stars added:', stars);

// Spaceship class definition
class Spaceship extends THREE.Mesh {
    constructor() {
        const geometry = new THREE.BoxGeometry(2, 1, 3);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        super(geometry, material);
        
        this.velocity = new THREE.Vector3();
        this.rotationVelocity = new THREE.Vector3();
        this.maxSpeed = 0.5;
        this.acceleration = 0.02;
        this.rotationAcceleration = 0.0008;
        this.damping = 0.98;
    }

    handleMovement(keys) {
        // Physics-based movement
        if (keys.w) this.velocity.z -= this.acceleration;
        if (keys.s) this.velocity.z += this.acceleration * 0.5;

        // Apply velocity damping
        this.velocity.multiplyScalar(this.damping);
        
        // Clamp maximum speed
        if (this.velocity.length() > this.maxSpeed) {
            this.velocity.normalize().multiplyScalar(this.maxSpeed);
        }

        // Apply movement
        this.translateZ(this.velocity.z);
    }

    handleRotation(keys, deltaX, deltaY) {
        // Keyboard rotation
        if (keys.a) this.rotationVelocity.y += this.rotationAcceleration;
        if (keys.d) this.rotationVelocity.y -= this.rotationAcceleration;

        // Apply rotation damping
        this.rotationVelocity.multiplyScalar(this.damping * 0.95);
        
        // Apply keyboard rotation
        this.rotateY(this.rotationVelocity.y);

        // Mouse-aimed rotation
        if (deltaX !== 0 || deltaY !== 0) {
            const aimSensitivity = 0.002;
            const targetQuaternion = new THREE.Quaternion()
                .setFromEuler(new THREE.Euler(
                    -deltaY * aimSensitivity,
                    -deltaX * aimSensitivity,
                    0,
                    'XYZ'
                ));
            this.quaternion.slerp(targetQuaternion, 0.3);
        }
    }

    updateCamera(camera) {
        const offset = new THREE.Vector3(0, 3, 10);
        offset.applyQuaternion(this.quaternion);
        camera.position.copy(this.position).add(offset);
        camera.lookAt(this.position);
    }
}

// Create and add spaceship
const spaceship = new Spaceship();
scene.add(spaceship);
console.log('Spaceship added:', spaceship);

// Position camera behind spaceship
camera.position.set(0, 2, -10);
camera.lookAt(spaceship.position);

// Movement keys
const keys = { w: false, a: false, s: false, d: false };


// Event listeners
window.addEventListener('keydown', (e) => {
    if (e.key === 'w') keys.w = true;
    if (e.key === 's') keys.s = true;
    if (e.key === 'a') keys.a = true;
    if (e.key === 'd') keys.d = true;
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'w') keys.w = false;
    if (e.key === 's') keys.s = false;
    if (e.key === 'a') keys.a = false;
    if (e.key === 'd') keys.d = false;
});

window.addEventListener('mousemove', (e) => {
    if (!mouseLocked) return;
    deltaX += e.movementX;
    deltaY += e.movementY;
});

// Pointer lock controls
renderer.domElement.addEventListener('click', () => {
    if (!mouseLocked && !paused) {
        renderer.domElement.requestPointerLock();
    }
});

// Pointer lock change handlers
document.addEventListener('pointerlockchange', () => {
    mouseLocked = document.pointerLockElement === renderer.domElement;
    crosshair.style.display = mouseLocked ? 'block' : 'none';
    document.body.style.cursor = 'none';
});

document.addEventListener('pointerlockerror', () => {
    console.error('Pointer lock failed');
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.exitPointerLock();
        paused = true;
        mouseLocked = false;
        menu.style.display = 'block';
    }
});

resumeBtn.addEventListener('click', () => {
    paused = false;
    mouseLocked = true;
    menu.style.display = 'none';
    document.body.classList.add('crosshair');
});

quitBtn.addEventListener('click', () => {
    window.location.reload();
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    if (paused) return;
    
    console.log('Animation frame running');

    spaceship.handleMovement(keys);
    spaceship.handleRotation(keys, deltaX, deltaY);
    spaceship.updateCamera(camera);
    
    // Reset mouse deltas
    deltaX = 0;
    deltaY = 0;

    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

    // Start animation
    animate();
});
