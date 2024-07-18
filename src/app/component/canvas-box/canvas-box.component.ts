import { AfterViewInit, Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import * as TWEEN from '@tweenjs/tween.js';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-canvas-box',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './canvas-box.component.html',
  styleUrls: ['./canvas-box.component.scss'],
  providers: [{ provide: Window, useValue: window }]
})
export class CanvasBoxComponent implements AfterViewInit {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef;
  scene!: THREE.Scene;
  camera!: THREE.PerspectiveCamera;
  renderer!: THREE.WebGLRenderer;
  cssRenderer!: CSS3DRenderer;
  car!: THREE.Group;

  constructor() { }

  ngAfterViewInit(): void {
    this.initThreeJS();
    this.loadCarModel();
    this.animate();
  }

  initThreeJS(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000); // Set a black background for contrast
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.x = 0;
    this.camera.position.z = 20;
    this.camera.position.y = 5;

    // WebGL Renderer
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.canvasRef.nativeElement.appendChild(this.renderer.domElement);

    // CSS3D Renderer
    this.cssRenderer = new CSS3DRenderer();
    this.cssRenderer.setSize(window.innerWidth, window.innerHeight);
    this.cssRenderer.domElement.style.position = 'absolute';
    this.cssRenderer.domElement.style.top = '0';
    this.canvasRef.nativeElement.appendChild(this.cssRenderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(5, 10, 7.5);
    this.scene.add(directionalLight);

    // Axes Helper
    const axesHelper = new THREE.AxesHelper(100); // Length of the axes lines
    this.scene.add(axesHelper);


  }

  loadCarModel(): void {
    const loader = new GLTFLoader();
    loader.load('/assets/blender/car.gltf', (gltf) => {
      this.car = gltf.scene;
      this.car.rotation.y = Math.PI * 1.25;

      this.scene.add(this.car);
    }, undefined, (error) => {
      console.error('An error happened while loading the GLTF model', error);
    });
  }

  createSplineCurve(): THREE.CatmullRomCurve3 {
    const points = [
      new THREE.Vector3(0, 5, 20),  // Starting point
      new THREE.Vector3(-1.5, 4, 15),  // Intermediate point 3
      new THREE.Vector3(-2.5, 3, 12),  // Intermediate point 3
      new THREE.Vector3(-3, 2.5, 8),  // Intermediate point 3
      new THREE.Vector3(-2.75, 2.2, 4),  // End point
      new THREE.Vector3(-2, 2, 2),  // End point
    ];

    return new THREE.CatmullRomCurve3(points);
  }

  animateCameraAlongCurve(curve: THREE.CatmullRomCurve3, duration: number): void {
    const points = curve.getPoints(1000); // Increase for smoother curve
    const positionStart = { t: 0 };
    const positionEnd = { t: 1 };

    const tween = new TWEEN.Tween(positionStart)
      .to(positionEnd, duration)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onUpdate(() => {
        const point = curve.getPointAt(positionStart.t);
        const lookAtPoint = curve.getPointAt(Math.min(positionStart.t + 0.01, 1)); // Look ahead slightly on the curve
        this.camera.position.set(point.x, point.y, point.z);
      })
      .start();
  }

  startCameraAnimation(): void {
    const curve = this.createSplineCurve();
    const duration = 7000; // Duration in milliseconds (5 seconds)
    this.animateCameraAlongCurve(curve, duration);
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.cssRenderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate(): void {
    requestAnimationFrame(() => this.animate());
    this.renderer.render(this.scene, this.camera);
    this.cssRenderer.render(this.scene, this.camera);
    TWEEN.update(); // Update tweens
  }
}
