"use client";

import { useEffect, useRef } from "react";

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uPixelRatio;
  attribute float aRand;
  varying float vHeight;
  varying float vFade;

  void main() {
    vec3 p = position;
    float wave =
      sin(p.x * 0.32 + uTime * 0.55) * 0.55 +
      sin(p.z * 0.46 + uTime * 0.38) * 0.45 +
      sin((p.x + p.z) * 0.18 + uTime * 0.25) * 0.8;

    // Ground rises toward the cursor, like money growing where you look.
    float d = distance(p.xz, uMouse);
    wave += smoothstep(5.5, 0.0, d) * 1.6;

    p.y += wave;
    vHeight = wave;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = (1.6 + aRand * 1.8) * uPixelRatio * (14.0 / -mv.z);
    gl_Position = projectionMatrix * mv;

    vFade = smoothstep(-26.0, -8.0, p.z) * smoothstep(21.0, 12.0, abs(p.x));
  }
`;

const fragmentShader = /* glsl */ `
  varying float vHeight;
  varying float vFade;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r = length(c);
    if (r > 0.5) discard;
    float soft = smoothstep(0.5, 0.1, r);

    vec3 sage = vec3(0.482, 0.588, 0.522);
    vec3 mint = vec3(0.784, 0.847, 0.745);
    vec3 cream = vec3(0.961, 0.949, 0.910);
    float t = clamp((vHeight + 1.2) / 3.4, 0.0, 1.0);
    vec3 color = mix(sage, mint, t);
    color = mix(color, cream, smoothstep(0.85, 1.0, t));

    gl_FragColor = vec4(color, soft * vFade * (0.35 + t * 0.65));
  }
`;

export default function HeroScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let cleanup = () => {};

    import("three").then((THREE) => {
      if (disposed) return;

      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({
          canvas,
          alpha: true,
          antialias: false,
          powerPreference: "low-power",
        });
      } catch {
        return; // No WebGL: the photo background still carries the hero.
      }

      const pixelRatio = Math.min(window.devicePixelRatio, 1.75);
      renderer.setPixelRatio(pixelRatio);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
      camera.position.set(0, 3.4, 9);
      camera.lookAt(0, 0, -4);

      const cols = window.innerWidth < 768 ? 90 : 170;
      const rows = window.innerWidth < 768 ? 50 : 80;
      const positions = new Float32Array(cols * rows * 3);
      const rand = new Float32Array(cols * rows);
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const k = i * rows + j;
          positions[k * 3] = (i / (cols - 1) - 0.5) * 44;
          positions[k * 3 + 1] = -1.4;
          positions[k * 3 + 2] = -(j / (rows - 1)) * 30 + 5;
          rand[k] = Math.random();
        }
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("aRand", new THREE.BufferAttribute(rand, 1));

      const uniforms = {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, -3) },
        uPixelRatio: { value: pixelRatio },
      };

      const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      scene.add(new THREE.Points(geometry, material));

      // Map the pointer onto the ground plane.
      const raycaster = new THREE.Raycaster();
      const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const hit = new THREE.Vector3();
      const ndc = new THREE.Vector2();
      const target = new THREE.Vector2(0, -3);
      const cameraTarget = { x: 0, y: 3.4 };
      // Scrolling the hero away flies the camera forward over the field.
      let scrollT = 0;
      const onScroll = () => {
        scrollT = Math.min(window.scrollY / window.innerHeight, 1);
      };

      const onPointerMove = (event: PointerEvent) => {
        const rect = canvas.getBoundingClientRect();
        ndc.set(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          -((event.clientY - rect.top) / rect.height) * 2 + 1
        );
        raycaster.setFromCamera(ndc, camera);
        if (raycaster.ray.intersectPlane(ground, hit)) {
          target.set(hit.x, hit.z);
        }
        cameraTarget.x = ndc.x * 0.8;
        cameraTarget.y = 3.4 + ndc.y * 0.3;
      };

      const resize = () => {
        const { clientWidth, clientHeight } = canvas;
        if (!clientWidth || !clientHeight) return;
        renderer.setSize(clientWidth, clientHeight, false);
        camera.aspect = clientWidth / clientHeight;
        camera.updateProjectionMatrix();
      };
      resize();
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(canvas);

      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      let frame = 0;
      let visible = true;
      const clock = new THREE.Clock();

      const render = () => {
        const dt = Math.min(clock.getDelta(), 0.05);
        uniforms.uTime.value += dt;
        uniforms.uMouse.value.lerp(target, 0.06);
        camera.position.x += (cameraTarget.x - camera.position.x) * 0.04;
        camera.position.y += (cameraTarget.y - scrollT * 1.2 - camera.position.y) * 0.05;
        camera.position.z += (9 - scrollT * 5 - camera.position.z) * 0.05;
        camera.lookAt(0, 0, -4 - scrollT * 3);
        renderer.render(scene, camera);
      };

      const loop = () => {
        render();
        frame = requestAnimationFrame(loop);
      };

      const start = () => {
        if (reducedMotion || frame || !visible || document.hidden) return;
        clock.getDelta();
        frame = requestAnimationFrame(loop);
      };
      const stop = () => {
        cancelAnimationFrame(frame);
        frame = 0;
      };

      // Only animate while the hero is on screen.
      const visibility = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) start();
        else stop();
      });
      visibility.observe(canvas);

      const onVisibilityChange = () => (document.hidden ? stop() : start());
      document.addEventListener("visibilitychange", onVisibilityChange);

      if (reducedMotion) {
        uniforms.uTime.value = 2;
        render();
      } else {
        window.addEventListener("pointermove", onPointerMove, { passive: true });
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
        start();
      }

      canvas.dataset.ready = "true";

      cleanup = () => {
        stop();
        visibility.disconnect();
        resizeObserver.disconnect();
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("scroll", onScroll);
        document.removeEventListener("visibilitychange", onVisibilityChange);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
      };
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-0 transition-opacity duration-[2000ms] data-[ready=true]:opacity-100"
    />
  );
}
