console.log('Main script loaded');
console.log('THREE.js version:', THREE.REVISION);

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
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
const moveSpeed = 0.1;
const rotationSpeed = 0.02;
const keys = { w: false, a: false, s: false, d: false };

// Mouse movement tracking
const mouse = new THREE.Vector2();
const targetRotation = new THREE.Vector2();

// Event listeners
window.addEventListener('keydown', (e) => {
    if (['w', 'a', 's', 'd'].includes(e.key)) {
        keys[e.key] = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (['w', 'a', 's', 'd'].includes(e.key)) {
        keys[e.key] = false;
    }
});

window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

// Animation loop
function animate() {
    console.log('Animation frame running');
    requestAnimationFrame(animate);

    // Spaceship movement
    if (keys.w) spaceship.translateZ(-moveSpeed);
    if (keys.s) spaceship.translateZ(moveSpeed);
    if (keys.a) spaceship.translateX(-moveSpeed);
    if (keys.d) spaceship.translateX(moveSpeed);

    // Spaceship rotation based on mouse
    targetRotation.x = mouse.x * Math.PI / 4;
    targetRotation.y = mouse.y * Math.PI / 4;
    spaceship.rotation.y += (targetRotation.x - spaceship.rotation.y) * rotationSpeed;
    spaceship.rotation.x += (targetRotation.y - spaceship.rotation.x) * rotationSpeed;

    // Camera follow
    const offset = new THREE.Vector3(0, 2, 10);
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
