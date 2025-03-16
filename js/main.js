console.log('Main script loaded');
console.log('THREE.js version:', THREE.REVISION);

// Helper function
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

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
    let crosshairOffsetX = 0;
    let crosshairOffsetY = 0;
    const maxCrosshairOffset = 100; // pixels from center
    
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
const keys = { w: false, a: false, s: false, d: false, q: false, e: false, shift: false };


// Event listeners
window.addEventListener('keydown', (e) => {
    if (e.key === 'w') keys.w = true;
    if (e.key === 's') keys.s = true;
    if (e.key === 'a') keys.a = true;
    if (e.key === 'd') keys.d = true;
    if (e.key === 'q') keys.q = true;
    if (e.key === 'e') keys.e = true;
    if (e.key === 'Shift') keys.shift = true;
    
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
    if (e.key === 'q') keys.q = false;
    if (e.key === 'e') keys.e = false;
    if (e.key === 'Shift') keys.shift = false;
});

window.addEventListener('mousemove', (e) => {
    if (!mouseLocked) return;
    
    // Update crosshair position with mouse movement
    crosshairOffsetX += e.movementX;
    crosshairOffsetY += e.movementY;

    // Keep crosshair within screen bounds (100px buffer for crosshair size)
    const screenEdgeX = window.innerWidth/2 - 20;
    const screenEdgeY = window.innerHeight/2 - 20;
    
    // Update floating crosshair position
    const floatingCrosshair = document.getElementById('floatingCrosshair');
    floatingCrosshair.style.transform = `
        translate(
            calc(clamp(${crosshairOffsetX}px, -${screenEdgeX}px, ${screenEdgeX}px) - 50%), 
            calc(clamp(${crosshairOffsetY}px, -${screenEdgeY}px, ${screenEdgeY}px) - 50%)
    `;
});

// Pointer lock controls
renderer.domElement.addEventListener('click', () => {
    if (!mouseLocked && !paused) {
        renderer.domElement.requestPointerLock()
            .catch(err => {
                console.error('Error requesting pointer lock:', err);
                alert('Click the game view to lock controls!');
            });
    }
});

// Pointer lock change handlers
document.addEventListener('pointerlockchange', () => {
    mouseLocked = document.pointerLockElement === renderer.domElement;
    document.getElementById('fixedCrosshair').style.display = mouseLocked ? 'block' : 'none';
    document.getElementById('floatingCrosshair').style.display = mouseLocked ? 'block' : 'none';
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
    menu.style.display = 'none';
    renderer.domElement.requestPointerLock()
        .catch(err => {
            console.error('Error resuming pointer lock:', err);
        });
});

quitBtn.addEventListener('click', () => {
    window.location.reload();
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    if (paused) return;

    spaceship.handleMovement(keys);
    spaceship.handleRotation(keys, mouseLocked, crosshairOffsetX, crosshairOffsetY);
    spaceship.updateCamera(camera);
    
    if (debugMode) {
        spaceship.updateDebugVectors();
        debugInfo.innerHTML = `
            Velocity: ${spaceship.velocity.length().toFixed(2)} m/s<br>
            Position:<br>
            ${spaceship.position.toArray().map((v, i) => 
                `${['X', 'Y', 'Z'][i]}: ${v.toFixed(1)}`
            ).join('<br>')}
            <br>Rotation:<br>
            ${[spaceship.rotation.x, spaceship.rotation.y, spaceship.rotation.z]
                .map((v, i) => 
                    `${['X', 'Y', 'Z'][i]}: ${typeof v === 'number' ? v.toFixed(2) : '0.00'}`
                ).join('<br>')}
        `;
    }
    
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
