class Spaceship extends THREE.Mesh {
    constructor() {
        const geometry = new THREE.BoxGeometry(2, 1, 3);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        super(geometry, material);
        
        this.velocity = new THREE.Vector3();
        this.rotationVelocity = new THREE.Vector3();
        this.maxRotationSpeed = 0.02; // Added maximum rotation speed
        
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
        this.maxSpeed = 2.0;
        this.acceleration = 0.04;
        this.strafeAcceleration = this.acceleration * 0.7;
        this.rotationAcceleration = 0.0008;
        this.rollAcceleration = 0.0015;
        this.damping = 0.98;
        this.rotationDamping = 0.95;
        this.boostMultiplier = 2.0;
    }

    handleMovement(keys) {
        const boost = keys.shift ? this.boostMultiplier : 1;
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.quaternion);

        // Apply damping first
        this.velocity.multiplyScalar(this.damping);

        // Forward/backward thrust
        if (keys.w) this.velocity.add(forward.multiplyScalar(this.acceleration * boost));
        if (keys.s) this.velocity.add(forward.multiplyScalar(-this.acceleration * 0.5 * boost));

        // Strafing
        if (keys.a) this.velocity.add(right.multiplyScalar(-this.strafeAcceleration * boost));
        if (keys.d) this.velocity.add(right.multiplyScalar(this.strafeAcceleration * boost));

        // Clamp velocity
        const currentMaxSpeed = this.maxSpeed * (boost > 1 ? 1.5 : 1);
        if (this.velocity.length() > currentMaxSpeed) {
            this.velocity.normalize().multiplyScalar(currentMaxSpeed);
        }

        this.position.add(this.velocity);
    }

    handleRotation(keys, mouseLocked, crosshairOffsetX, crosshairOffsetY) {
        // Roll controls
        if (keys.q) this.rotationVelocity.z += this.rollAcceleration;
        if (keys.e) this.rotationVelocity.z -= this.rollAcceleration;
        
        // Apply rotational damping
        this.rotationVelocity.multiplyScalar(this.rotationDamping);

        // Mouse rotation based on crosshair offset
        if (mouseLocked) {
            const sensitivity = 0.00002; // Greatly reduced sensitivity
            const smoothing = 0.1; // Increased smoothing
            const minVertical = -Math.PI/3;
            const maxVertical = Math.PI/3;

            // Calculate target rotation with reduced sensitivity
            const targetRotationY = -crosshairOffsetX * sensitivity;
            const targetRotationX = -crosshairOffsetY * sensitivity;

            // Apply smoothing and clamp to max rotation speed
            this.rotationVelocity.y += (targetRotationY - this.rotationVelocity.y) * smoothing;
            this.rotationVelocity.x += (targetRotationX - this.rotationVelocity.x) * smoothing;
            
            // Clamp rotation speed
            this.rotationVelocity.clampLength(0, this.maxRotationSpeed);

            // Clamp vertical rotation
            const currentEuler = new THREE.Euler().setFromQuaternion(this.quaternion, 'YXZ');
            currentEuler.x = THREE.MathUtils.clamp(currentEuler.x, minVertical, maxVertical);
            this.quaternion.setFromEuler(currentEuler);
        }

        // Apply accumulated rotations
        const deltaQuaternion = new THREE.Quaternion()
            .setFromEuler(new THREE.Euler(
                this.rotationVelocity.x,
                this.rotationVelocity.y,
                this.rotationVelocity.z,
                'YXZ'
            ));
        this.quaternion.multiply(deltaQuaternion);
    }

    updateCamera(camera) {
        const offset = new THREE.Vector3(0, 3, 10);
        offset.applyQuaternion(this.quaternion);
        camera.position.copy(this.position).add(offset);
        camera.lookAt(this.position);
    }
    
    updateDebugVectors() {
        const velLength = this.velocity.length();
        if (velLength > 0) {
            this.velocityArrow.setDirection(this.velocity.clone().normalize());
            this.velocityArrow.setLength(velLength * 2);
        } else {
            this.velocityArrow.setLength(0);
        }
        this.velocityArrow.position.copy(this.position);

        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.quaternion);
        this.forwardArrow.setDirection(forward.normalize());
        this.forwardArrow.setLength(3);
        this.forwardArrow.position.copy(this.position);
    }
}
