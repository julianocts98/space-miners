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
        this.maxSpeed = 2.0;
        this.acceleration = 0.04;
        this.rotationAcceleration = 0.0008;
        this.damping = 1.0;
        this.rotationDamping = 0.95;
    }

    handleMovement(keys) {
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(this.quaternion);

        if (keys.w) {
            this.velocity.add(forward.multiplyScalar(this.acceleration));
        }
        if (keys.s) {
            this.velocity.add(forward.multiplyScalar(-this.acceleration * 0.3));
        }

        if (this.velocity.length() > this.maxSpeed) {
            this.velocity.normalize().multiplyScalar(this.maxSpeed);
        }

        this.position.add(this.velocity);
    }

    handleRotation(keys, deltaX, deltaY, mouseLocked) {
        if (keys.a) this.rotationVelocity.y += this.rotationAcceleration;
        if (keys.d) this.rotationVelocity.y -= this.rotationAcceleration;
        this.rotationVelocity.multiplyScalar(this.rotationDamping);
        this.rotateY(this.rotationVelocity.y);

        if (mouseLocked) {
            const sensitivity = 0.002;
            const minVertical = -Math.PI/3;
            const maxVertical = Math.PI/3;
            
            const deltaQuaternion = new THREE.Quaternion()
                .setFromEuler(new THREE.Euler(
                    -deltaY * sensitivity,
                    -deltaX * sensitivity,
                    0,
                    'YXZ'
                ));
            
            this.quaternion.multiply(deltaQuaternion);
            
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
