import * as THREE from 'three';

export class SceneManager {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        
        // State for environment controls (MUST be initialized before setupLights is called)
        this.directionalLightRotation = new THREE.Euler(-1.0, 0, 0, 'YXZ'); // Initial pitch/yaw (radians)
        this.directionalLightDistance = 20; // Fixed distance
        this.fogColor = 0x1a1a1a;
        
        this.scene.background = new THREE.Color(this.fogColor);
        
        this.setupCamera();
        this.setupRenderer();
        this.setupLights();
        this.setupGrid();
        this.setupFog();
        
        this.objects = [];
    }

    setupCamera() {
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
        this.camera.position.set(0, 15, 10);
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
        this.renderer.setSize(this.container.clientWidth || 800, this.container.clientHeight || 600);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);
    }

    setupLights() {
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(this.ambientLight);

        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        
        // Initialize directional light based on state
        this.setDirectionalLightRotation(this.directionalLightRotation.x, this.directionalLightRotation.y);
        
        this.directionalLight.castShadow = true;
        this.directionalLight.shadow.mapSize.width = 2048;
        this.directionalLight.shadow.mapSize.height = 2048;
        this.directionalLight.shadow.camera.near = 0.5;
        this.directionalLight.shadow.camera.far = 50;
        this.directionalLight.shadow.camera.left = -20;
        this.directionalLight.shadow.camera.right = 20;
        this.directionalLight.shadow.camera.top = 20;
        this.directionalLight.shadow.camera.bottom = -20;
        this.scene.add(this.directionalLight);
    }

    setCamera(camera) {
        this.camera = camera;
        this.handleResize(); // Update aspect ratio etc.
    }

    setAmbientLightIntensity(intensity) {
        this.ambientLight.intensity = intensity;
    }

    setAmbientLightColor(color) {
        this.ambientLight.color.setHex(color);
    }
    
    setDirectionalLightIntensity(intensity) {
        this.directionalLight.intensity = intensity;
    }

    setDirectionalLightColor(color) {
        this.directionalLight.color.setHex(color);
    }

    setDirectionalLightRotation(x, y) {
        this.directionalLightRotation.x = x; // Pitch (altitude)
        this.directionalLightRotation.y = y; // Yaw (azimuth)
        
        const matrix = new THREE.Matrix4().makeRotationFromEuler(this.directionalLightRotation);
        
        // Start vector along Y axis (straight up). Rotate it to find the light source position.
        const direction = new THREE.Vector3(0, this.directionalLightDistance, 0);
        direction.applyMatrix4(matrix);
        
        this.directionalLight.position.copy(direction);
        this.directionalLight.target.position.set(0, 0, 0);
        this.directionalLight.target.updateMatrixWorld();
    }
    
    setSceneBackgroundColor(color) {
        this.scene.background.setHex(color);
    }
    
    setFogColor(color) {
        this.fogColor = color;
        if (this.scene.fog) {
            this.scene.fog.color.setHex(color);
        }
    }

    getEnvironmentState() {
        const rotationX = this.directionalLightRotation.x;
        const rotationY = this.directionalLightRotation.y;

        return {
            ambientLight: this.ambientLight.intensity,
            ambientColor: this.ambientLight.color.getHex(),
            directionalLight: this.directionalLight.intensity,
            directionalColor: this.directionalLight.color.getHex(),
            directionalRotationX: rotationX,
            directionalRotationY: rotationY,
            fogDensity: this.fogDensity,
            fogColor: this.fogColor,
            backgroundColor: this.scene.background.getHex()
        };
    }

    setupFog() {
        this.fogDensity = 0;
    }

    setFogDensity(density) {
        this.fogDensity = density;
        const color = this.fogColor || 0x1a1a1a;
        if (density > 0) {
            this.scene.fog = new THREE.FogExp2(color, density);
        } else {
            this.scene.fog = null;
        }
    }

    setupGrid() {
        // Visual quadrant overlay to show buildable (+X, +Z) vs disallowed quadrants.
        // Create subtle ground grid plus four colored planes (one per quadrant).
        const size = 100;
        const half = size / 2;

        // main grid helper (neutral)
        const gridHelper = new THREE.GridHelper(size, size / 1, 0x2a2a2a, 0x151515);
        gridHelper.rotation.x = Math.PI / 2 * 0; // keep flat
        this.scene.add(gridHelper);

        const quadGroup = new THREE.Group();
        const darkMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.55, depthWrite: false });
        const lightMat = new THREE.MeshBasicMaterial({ color: 0x1a1a1a, transparent: true, opacity: 0.08, depthWrite: false });

        // create a plane geometry for one quadrant
        const planeGeo = new THREE.PlaneGeometry(half, half);
        // Quadrants: (-X,-Z), (+X,-Z), (-X,+Z), (+X,+Z)
        const positions = [
          { x: -half/2, z: -half/2, mat: darkMat },
          { x:  half/2, z: -half/2, mat: darkMat },
          { x: -half/2, z:  half/2, mat: darkMat },
          { x:  half/2, z:  half/2, mat: lightMat } // positive-positive is highlighted lightly
        ];

        positions.forEach(p => {
          const mesh = new THREE.Mesh(planeGeo, p.mat);
          mesh.rotation.x = -Math.PI / 2;
          mesh.position.set(p.x, 0.01, p.z);
          mesh.renderOrder = 10;
          mesh.userData.isPlacementOverlay = true;
          quadGroup.add(mesh);
        });

        this.scene.add(quadGroup);
    }

    addObject(object) {
        // Allow passing wrapper objects (LightObject/TextObject/ShapeObject) or raw Object3D.
        const node = (object && object.container && object.container.isObject3D) ? object.container
                   : (object && object.isObject3D) ? object
                   : null;
        if (!node) {
            console.warn('SceneManager.addObject: attempted to add a non-Object3D', object);
            return null;
        }
        this.scene.add(node);
        this.objects.push(node);
        return node;
    }

    removeObject(object) {
        const node = (object && object.container && object.container.isObject3D) ? object.container
                   : (object && object.isObject3D) ? object
                   : null;
        if (!node) {
            console.warn('SceneManager.removeObject: attempted to remove a non-Object3D', object);
            return;
        }
        this.scene.remove(node);
        const index = this.objects.indexOf(node);
        if (index > -1) {
            this.objects.splice(index, 1);
        }
    }

    handleResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}