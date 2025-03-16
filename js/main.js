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

// Create spaceship
const shipGeometry = new THREE.BoxGeometry(2, 1, 3);
const shipMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const spaceship = new THREE.Mesh(shipGeometry, shipMaterial);
scene.add(spaceship);
console.log('Spaceship added:', spaceship);

// Position camera behind spaceship
camera.position.set(0, 2, -10);
camera.lookAt(spaceship.position);

// Movement variables
const keys = { w: false, a: false, s: false, d: false };
let velocity = new THREE.Vector3();
let rotationVelocity = new THREE.Vector3();
const maxSpeed = 0.5;
const acceleration = 0.02;
const rotationAcceleration = 0.0008;
const damping = 0.98;


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

    // Physics-based movement
    if (keys.w) velocity.z -= acceleration;
    if (keys.s) velocity.z += acceleration * 0.5; // Less powerful for braking
    if (keys.a) rotationVelocity.y += rotationAcceleration;
    if (keys.d) rotationVelocity.y -= rotationAcceleration;

    // Apply velocity damping
    velocity.multiplyScalar(damping);
    rotationVelocity.multiplyScalar(damping * 0.95);

    // Clamp maximum speed
    if (velocity.length() > maxSpeed) {
        velocity.normalize().multiplyScalar(maxSpeed);
    }

    // Apply movement and rotation
    spaceship.translateZ(velocity.z);
    spaceship.rotateY(rotationVelocity.y);

    // Mouse-aimed rotation
    if (mouseLocked) {
        const aimSensitivity = 0.002;
        const targetQuaternion = new THREE.Quaternion()
            .setFromEuler(new THREE.Euler(
                -deltaY * aimSensitivity,
                -deltaX * aimSensitivity,
                0,
                'XYZ'
            ));
        spaceship.quaternion.slerp(targetQuaternion, 0.3);
        deltaX = 0;
        deltaY = 0;
    }

    // Adjust camera position to show crosshair above spaceship
    const offset = new THREE.Vector3(0, 3, 10); // Increased Y value
    offset.applyQuaternion(spaceship.quaternion);
    camera.position.copy(spaceship.position).add(offset);
    camera.lookAt(spaceship.position);

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
