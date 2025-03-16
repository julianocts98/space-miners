console.log('Main script loaded');
console.log('THREE.js version:', THREE.REVISION);

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    let mouseLocked = false;
    let paused = false;
    let debugMode = false;
    const debugInfo = document.getElementById('debugInfo');
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
        
        // Add debug vectors
        this.velocityArrow = new THREE.ArrowHelper(
            new THREE.Vector3(0, 0, 1),
            this.position,
            5,
            0xff0000,
            0.5,
            0.3
        );
        this.forwardArrow = new THREE.ArrowHelper(
            new THREE.Vector3(0, 0, 1),
            this.position,
            3,
            0x00ff00,
            0.5,
            0.3
        );
        this.velocityArrow.visible = false;
        this.forwardArrow.visible = false;
        this.maxSpeed = 2.0;  // Increased from 0.5
        this.acceleration = 0.04;  // Increased from 0.02
        this.rotationAcceleration = 0.0008;
        this.damping = 1.0;  // Changed from 0.98 (no friction in space)
        this.rotationDamping = 0.95;  // New separate rotation damping
    }

    handleMovement(keys) {
        // Get forward vector based on current orientation
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(this.quaternion);

        // Apply thrust in direction ship is facing (FIXED DIRECTIONS)
        if (keys.w) {
            this.velocity.add(forward.multiplyScalar(this.acceleration)); // Removed negative
        }
        if (keys.s) {  // Braking/reverse thrust
            this.velocity.add(forward.multiplyScalar(-this.acceleration * 0.3)); // Added negative
        }

        // Clamp maximum speed
        if (this.velocity.length() > this.maxSpeed) {
            this.velocity.normalize().multiplyScalar(this.maxSpeed);
        }

        // Apply movement
        this.position.add(this.velocity);
    }

    handleRotation(keys, deltaX, deltaY) {
        // Keyboard rotation (existing code)
        if (keys.a) this.rotationVelocity.y += this.rotationAcceleration;
        if (keys.d) this.rotationVelocity.y -= this.rotationAcceleration;
        this.rotationVelocity.multiplyScalar(this.rotationDamping);
        this.rotateY(this.rotationVelocity.y);

        // New mouse-based rotation system
        if (mouseLocked) {
            const sensitivity = 0.002;
            const minVertical = -Math.PI/3;
            const maxVertical = Math.PI/3;
            
            // Create rotation quaternion from mouse movement
            const deltaQuaternion = new THREE.Quaternion()
                .setFromEuler(new THREE.Euler(
                    -deltaY * sensitivity, // Pitch (vertical)
                    -deltaX * sensitivity, // Yaw (horizontal)
                    0,                     // Roll (we'll keep this at 0)
                    'YXZ'                  // Rotation order: Yaw first, then Pitch
                ));
            
            // Apply the rotation directly to current orientation
            this.quaternion.multiply(deltaQuaternion);
            
            // Clamp vertical rotation
            const currentEuler = new THREE.Euler().setFromQuaternion(this.quaternion, 'YXZ');
            currentEuler.x = THREE.MathUtils.clamp(currentEuler.x, minVertical, maxVertical);
            this.quaternion.setFromEuler(currentEuler);
        }
    }

    updateCamera(camera) {
        const offset = new THREE.Vector3(0, 3, 10);
        offset.applyQuaternion(this.quaternion);
        camera.position.copy(this.position).add(offset);
        camera.lookAt(this.position);
    }
    
    updateDebugVectors() {
        // Update velocity arrow
        const velLength = this.velocity.length();
        if (velLength > 0) {
            this.velocityArrow.setDirection(this.velocity.clone().normalize());
            this.velocityArrow.setLength(velLength * 2);
        } else {
            this.velocityArrow.setLength(0); // Hide arrow when stationary
        }
        this.velocityArrow.position.copy(this.position);

        // Update forward arrow
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.quaternion);
        this.forwardArrow.setDirection(forward.normalize());
        this.forwardArrow.setLength(3);
        this.forwardArrow.position.copy(this.position);
    }
}

// Create and add spaceship
const spaceship = new Spaceship();
scene.add(spaceship);
scene.add(spaceship.velocityArrow);
scene.add(spaceship.forwardArrow);
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
    
    if (e.key === 'm') {
        e.preventDefault(); // Add this line
        debugMode = !debugMode;
        debugInfo.style.display = debugMode ? 'block' : 'none';
        spaceship.velocityArrow.visible = debugMode;
        spaceship.forwardArrow.visible = debugMode;
    }
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'w') keys.w = false;
    if (e.key === 's') keys.s = false;
    if (e.key === 'a') keys.a = false;
    if (e.key === 'd') keys.d = false;
});

window.addEventListener('mousemove', (e) => {
    if (!mouseLocked) return;
    deltaX = e.movementX;  // Direct assignment instead of +=
    deltaY = e.movementY;  // for immediate response
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

    spaceship.handleMovement(keys);
    spaceship.handleRotation(keys, deltaX, deltaY);
    spaceship.updateCamera(camera);
    
    if (debugMode) {
        spaceship.updateDebugVectors();
        debugInfo.innerHTML = `
            Velocity: ${spaceship.velocity.length().toFixed(2)} m/s<br>
            Position: ${spaceship.position.toArray().map(v => v.toFixed(1)).join(', ')}<br>
            Rotation: ${spaceship.rotation.toArray().map(v => v.toFixed(2)).join(', ')}
        `;
    }
    
    // Keep mouse deltas until next frame
    deltaX *= 0.3;  // Add slight persistence
    deltaY *= 0.3;  // for smoother movement
    
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
