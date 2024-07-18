import { AfterViewInit, Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CSS3DObject, CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
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
  cssObject!: CSS3DObject;
  private tween: TWEEN.Tween<{ t: number }> | null = null;
  private curve!: THREE.CatmullRomCurve3;
  scale: number = 2;

  constructor() { }

  ngAfterViewInit(): void {
    this.initThreeJS();
    this.loadCarModel();
    this.createHtmlPlane(); // Add this line
    this.animate();
    // No call to startCameraAnimation() here
  }

  initThreeJS(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000); // Set a black background for contrast
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    this.camera.position.x = 0;
    this.camera.position.z = 200;
    this.camera.position.y = 50;

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
      this.car.scale.set(20, 20, 20);
      this.car.rotation.y = Math.PI * 1.25;

      this.scene.add(this.car);
    }, undefined, (error) => {
      console.error('An error happened while loading the GLTF model', error);
    });
  }

  createHtmlPlane(): void {
    const element = document.createElement('div');
    element.innerHTML = `
      <iframe
        src="https://open.spotify.com/embed/track/3n3Ppam7vgaVa1iaRUc9Lp"
        width="300"
        height="380"
        frameborder="0"
        allowtransparency="true"
        allow="encrypted-media">
      </iframe>
    `;
    element.style.zIndex = '10'; // Set z-index to ensure it has a proper depth

    this.cssObject = new CSS3DObject(element);
    this.cssObject.rotation.y = Math.PI * 0.25;
    this.cssObject.position.set(0, 0, 0); // Position the plane in the 3D space

    this.scene.add(this.cssObject);
  }

  createSplineCurve(): THREE.CatmullRomCurve3 {
    const points = [
      new THREE.Vector3(0 * this.scale, 50 * this.scale, 200 * this.scale),  // Starting point
      new THREE.Vector3(-15 * this.scale, 40 * this.scale, 150 * this.scale),  // Intermediate point 1
      new THREE.Vector3(-25 * this.scale, 30 * this.scale, 120 * this.scale),  // Intermediate point 2
      new THREE.Vector3(-30 * this.scale, 25 * this.scale, 80 * this.scale),  // Intermediate point 3
      new THREE.Vector3(-27.5 * this.scale, 22 * this.scale, 40 * this.scale),  // Intermediate point 4
      new THREE.Vector3(-20 * this.scale, 20 * this.scale, 20 * this.scale),  // End point
    ];

    return new THREE.CatmullRomCurve3(points);
  }

  animateCameraAlongCurve(curve: THREE.CatmullRomCurve3, duration: number): void {
    const points = curve.getPoints(1000); // Increase for smoother curve
    const positionStart = { t: 0 };
    const positionEnd = { t: 1 };

    const lookAtPoints = [
      new THREE.Vector3(0 * this.scale, 50 * this.scale, 0 * this.scale), // Look at this point while at the start
      new THREE.Vector3(-15.0 * this.scale, 35 * this.scale, -10 * this.scale),  // Look at this point while at the first intermediate point
      new THREE.Vector3(-30 * this.scale, 20 * this.scale, -20 * this.scale)  // Look at this point while at the end
    ];

    if (this.tween) {
      this.tween.stop();
    }

    this.tween = new TWEEN.Tween(positionStart)
      .to(positionEnd, duration)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onUpdate(() => {
        const point = curve.getPointAt(positionStart.t);
        this.camera.position.set(point.x, point.y, point.z);

        // Interpolate lookAt point
        const segmentIndex = Math.floor(positionStart.t * (lookAtPoints.length - 1));
        const segmentT = (positionStart.t * (lookAtPoints.length - 1)) - segmentIndex;

        const lookAtPoint = new THREE.Vector3(
          THREE.MathUtils.lerp(lookAtPoints[segmentIndex].x, lookAtPoints[segmentIndex + 1].x, segmentT),
          THREE.MathUtils.lerp(lookAtPoints[segmentIndex].y, lookAtPoints[segmentIndex + 1].y, segmentT),
          THREE.MathUtils.lerp(lookAtPoints[segmentIndex].z, lookAtPoints[segmentIndex + 1].z, segmentT)
        );

        this.camera.lookAt(lookAtPoint);
      })
      .onComplete(() => {
        this.tween = null;
      })
      .start();
  }

  startCameraAnimation(): void {
    this.curve = this.createSplineCurve();
    const duration = 7000; // Duration in milliseconds (7 seconds)
    this.animateCameraAlongCurve(this.curve, duration);
  }

  animate(): void {
    
    requestAnimationFrame(() => this.animate());
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
      this.cssRenderer.render(this.scene, this.camera);
      TWEEN.update();

      // Check visibility of the CSS object
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.cssRenderer.setSize(window.innerWidth, window.innerHeight);
  }
}
