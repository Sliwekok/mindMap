import * as THREE from './three/three.module.js';
import { CSS3DRenderer, CSS3DObject } from './three/examples/jsm/renderers/CSS3DRenderer.js';

class Board {
    constructor(selector) {
        this.content = document.querySelector(selector);
        if (!this.content) {
            throw new Error(`Element with selector "${selector}" not found.`);
        }

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.zoomLevels = [
            0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 3.0,
        ];
        this.currentZoomIndex = 1;
        this.targetZoom = this.zoomLevels[this.currentZoomIndex];
        this.zoomSpeed = 0.1;
        this.panFactor = 0.02;
        this.isPanning = false;
        this.panStart = new THREE.Vector2();
        this.zoomFactor = 1 / this.camera.zoom; // Adjust panning speed based on zoom level

        document.querySelector('#boardContent').appendChild(this.renderer.domElement);

        this.backgroundTexture = null; // Placeholder for the background texture

        this.initialize();
    }

    initialize() {
        // Setup renderer and attach to DOM
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.content.appendChild(this.renderer.domElement);

        // Setup initial camera position and zoom
        this.camera.position.z = 20;
        this.camera.zoom = this.targetZoom;
        this.camera.updateProjectionMatrix();

        // CSS3DRenderer setup for HTML elements
        this.cssRenderer = new CSS3DRenderer();
        this.cssRenderer.domElement.style.position = 'absolute';
        this.cssRenderer.domElement.style.top = '0';
        this.cssRenderer.domElement.style.left = '0';
        document.querySelector('#boardContent').appendChild(this.cssRenderer.domElement);

        // Add a background
        this.addBackground();

        // Add event listeners
        this.addEventListeners();

        // Start the animation loop
        this.animate();
    }

    addBackground() {
        const canvas = document.createElement('canvas');
        const size = 40; // Size of the grid squares
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Draw radial gradient dots
        ctx.fillStyle = '#ccc';
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, 1, 0, Math.PI * 2);
        ctx.fill();

        // Create a Three.js texture from the canvas
        this.backgroundTexture = new THREE.CanvasTexture(canvas);
        this.backgroundTexture.wrapS = THREE.RepeatWrapping;
        this.backgroundTexture.wrapT = THREE.RepeatWrapping;

        this.updateBackgroundScale(); // Set initial scaling
        this.scene.background = this.backgroundTexture;
    }

    updateBackgroundScale() {
        const scale = 1 / this.zoomLevels[this.currentZoomIndex]; // Inverse scaling
        this.backgroundTexture.repeat.set(
            (window.innerWidth / 40) * scale,
            (window.innerHeight / 40) * scale
        );
        this.backgroundTexture.needsUpdate = true;
    }

    addEventListeners() {
        // Handle zooming
        window.addEventListener('wheel', this.handleZoom.bind(this));

        // Handle panning
        this.renderer.domElement.addEventListener('mousedown', this.startPan.bind(this));
        this.renderer.domElement.addEventListener('mousemove', this.pan.bind(this));
        this.renderer.domElement.addEventListener('mouseup', this.endPan.bind(this));
    }

    handleZoom(event) {
        // Calculate normalized device coordinates (NDC) for the mouse position
        const rect = this.renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            -((event.clientY - rect.top) / rect.height) * 2 + 1
        );

        // Use raycaster to find the point in the scene
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);

        // Intersect with a plane at z = 0 (board plane)
        const zoomTargetPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0); // Plane at z=0
        const intersection = new THREE.Vector3();
        raycaster.ray.intersectPlane(zoomTargetPlane, intersection);

        // Determine new zoom level
        const oldZoom = this.camera.zoom;
        if (event.deltaY < 0) {
            // Zoom in
            if (this.currentZoomIndex < this.zoomLevels.length - 1) {
                this.currentZoomIndex++;
            }
        } else {
            // Zoom out
            if (this.currentZoomIndex > 0) {
                this.currentZoomIndex--;
            }
        }
        this.targetZoom = this.zoomLevels[this.currentZoomIndex];

        // Calculate the zoom factor (new zoom relative to old zoom)
        const zoomFactor = this.targetZoom / oldZoom;

        // Adjust the camera position to zoom toward the cursor
        this.camera.position.x += (intersection.x - this.camera.position.x) * (1 - zoomFactor);
        this.camera.position.y += (intersection.y - this.camera.position.y) * (1 - zoomFactor);

        // Apply the new zoom level
        this.camera.zoom = this.targetZoom;
        this.camera.updateProjectionMatrix();

        // Update the background scale to reflect the new zoom level
        this.updateBackgroundScale();
    }

    startPan(event) {
        if (event.ctrlKey) {
            this.isPanning = true;
            this.panStart.set(event.clientX, event.clientY);
        }
    }

    pan(event) {
        if (this.isPanning) {
            const panDelta = new THREE.Vector2(event.clientX, event.clientY).sub(this.panStart);
            this.camera.position.x -= panDelta.x * this.panFactor * this.zoomFactor;
            this.camera.position.y += panDelta.y * this.panFactor * this.zoomFactor;
            this.panStart.set(event.clientX, event.clientY);
        }
    }

    endPan() {
        this.isPanning = false;
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        // Smooth zoom transition
        this.camera.zoom += (this.targetZoom - this.camera.zoom) * this.zoomSpeed;
        this.camera.updateProjectionMatrix();

        this.renderer.render(this.scene, this.camera);
        this.cssRenderer.render(this.scene, this.camera);  // Render CSS3D objects
    }

    addCard() {
        const canvas = document.querySelector('canvas');
        const nextDiv = canvas?.nextElementSibling;

        if (nextDiv && nextDiv.tagName.toLowerCase() === 'div') {
            nextDiv.style.width = '200px';
            nextDiv.style.height = '200px';
            nextDiv.style.transform = 'translate(-50%, -50%) matrix3d(1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)';
        }
        // Create a DOM element for the form
        const formElement = document.createElement('div');
        formElement.innerHTML = `
        <div class="dynamicForm">
            <strong>Card</strong>
            <input type="text" placeholder="Title" />
            <textarea placeholder="Description"></textarea>
            <button type="button" onclick="alert('Form submitted!')">Submit</button>
        </div>
    `;
        formElement.style.width = '200px';
        formElement.style.height = '150px';
        formElement.style.background = 'white';
        formElement.style.border = '1px solid #ccc';
        formElement.style.borderRadius = '4px';
        formElement.style.zIndex = '10000';

        // Create a CSS3DObject from the form element
        const cssObject = new CSS3DObject(formElement);

        // Set the object's position relative to the board
        const cardCount = this.scene.children.filter(obj => obj instanceof CSS3DObject).length;
        cssObject.position.set((cardCount * 5) + this.camera.position.x, (cardCount * -5) + + this.camera.position.y, 0); // Adjust position based on card count

        // Add the CSS3DObject to the scene
        this.scene.add(cssObject);

        console.log(`Card added at position: (${cssObject.position.x}, ${cssObject.position.y}, ${cssObject.position.z})`);
    }
}

// Initialize the board
const board = new Board('#boardContent');
document.getElementById('addCard').addEventListener('click', () => board.addCard());
