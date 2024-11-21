// import * as THREE from './three.js-master/build/three.module.js';
// import {CSS3DRenderer, CSS3DObject} from "./three.js-master/examples/jsm/renderers/CSS3DRenderer.js";
//
// class SceneManager {
//     constructor() {
//         // Three.js WebGL setup
//         this.scene = new THREE.Scene();
//         this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
//         this.renderer = new THREE.WebGLRenderer({ antialias: true });
//         this.renderer.setSize(window.innerWidth, window.innerHeight);
//         document.querySelector('#boardContent').appendChild(this.renderer.domElement);
//
//
//         // Camera initial position
//         this.camera.position.z = 20;
//
//         // Handle button click to add forms
//         document.getElementById('addCard').addEventListener('click', () => this.addCard());
//
//         // Board content (e.g., cube placeholder)
//         const geometry = new THREE.BoxGeometry(5, 5, 0);
//         const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
//         const box = new THREE.Mesh(geometry, material);
//         this.scene.add(box);
//     }
//
//
//
//     animate() {
//         requestAnimationFrame(() => this.animate());
//
//         // Render both WebGL and CSS3D layers
//         this.renderer.render(this.scene, this.camera);
//         this.cssRenderer.render(this.scene, this.camera);
//     }
// }
//
// // Initialize the scene manager
// const sceneManager = new SceneManager();
// sceneManager.animate();
