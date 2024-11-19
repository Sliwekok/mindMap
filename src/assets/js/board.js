const THREE = require('three');

const content = document.querySelector('#boardContent');
if (content) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    content .appendChild(renderer.domElement);

// Set initial camera position
    camera.position.z = 20;
    const panFactor = 0.02;

// Add a simple cube as a placeholder for board content
    const geometry = new THREE.BoxGeometry(5, 5, 0);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const box = new THREE.Mesh(geometry, material);
    scene.add(box);

// Define zoom levels
    const zoomLevels = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 3.0];
    let currentZoomIndex = 1;
    camera.zoom = zoomLevels[currentZoomIndex];
    camera.updateProjectionMatrix();

// Smooth transition settings
    let targetZoom = camera.zoom;
    const zoomSpeed = 0.1;
    const zoomFactor = 1 / camera.zoom; // Lower zoom factor for higher zoom levels (higher zoom = slower panning)

// Variables for panning
    let isPanning = false;
    let panStart = new THREE.Vector2();
    let panOffset = new THREE.Vector2();

// Handle zooming using the mouse wheel (steps)
    window.addEventListener('wheel', (event) => {
        if (event.deltaY < 0) {
            // Zoom in
            if (currentZoomIndex < zoomLevels.length - 1) {
                currentZoomIndex++;
            }
        } else {
            // Zoom out
            if (currentZoomIndex > 0) {
                currentZoomIndex--;
            }
        }
        targetZoom = zoomLevels[currentZoomIndex];
    });

// Handle panning when holding the Ctrl key and dragging with the left mouse button
    renderer.domElement.addEventListener('mousedown', (event) => {
        if (event.ctrlKey) {
            isPanning = true;
            panStart.set(event.clientX, event.clientY);
        }
    });

    renderer.domElement.addEventListener('mousemove', (event) => {
        if (isPanning) {
            const panDelta = new THREE.Vector2(event.clientX, event.clientY).sub(panStart);
            camera.position.x -= panDelta.x * panFactor * zoomFactor;
            camera.position.y += panDelta.y * panFactor * zoomFactor;

            panStart.set(event.clientX, event.clientY);
        }
    });

    renderer.domElement.addEventListener('mouseup', () => {
        isPanning = false;
    });

// Animation loop
    function animate() {
        requestAnimationFrame(animate);

        // Smooth zoom transition
        camera.zoom += (targetZoom - camera.zoom) * zoomSpeed;
        camera.updateProjectionMatrix();

        renderer.render(scene, camera);
    }
    animate();

}
