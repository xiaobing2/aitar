<template>
  <div ref="container" class="scene-3d"></div>
</template>

<script>
import * as THREE from 'three'

export default {
  name: 'Scene3D',
  data() {
    return {
      scene: null,
      camera: null,
      renderer: null,
      particles: null,
      animationId: null,
      mouse: new THREE.Vector2(),
      raycaster: new THREE.Raycaster()
    }
  },
  mounted() {
    this.initScene()
    this.animate()
    this.handleResize()
    window.addEventListener('resize', this.handleResize)
    window.addEventListener('mousemove', this.onMouseMove)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
    window.removeEventListener('mousemove', this.onMouseMove)
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
    if (this.renderer) {
      this.renderer.dispose()
    }
  },
  methods: {
    initScene() {
      // 创建场景
      this.scene = new THREE.Scene()
      
      // 创建相机
      this.camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      )
      this.camera.position.z = 5
      
      // 创建渲染器
      this.renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true
      })
      this.renderer.setSize(window.innerWidth, window.innerHeight)
      this.renderer.setPixelRatio(window.devicePixelRatio)
      this.renderer.setClearColor(0x000000, 0)
      this.container.appendChild(this.renderer.domElement)
      
      // 创建粒子系统
      this.createParticles()
      
      // 创建网格
      this.createGrid()
      
      // 创建光晕效果
      this.createGlow()
      
      // 创建深度层
      this.createDepthLayers()
    },
    
    createParticles() {
      const geometry = new THREE.BufferGeometry()
      const particlesCount = 2000
      const positions = new Float32Array(particlesCount * 3)
      const colors = new Float32Array(particlesCount * 3)
      const sizes = new Float32Array(particlesCount)
      
      const color1 = new THREE.Color(0xff6b9d)
      const color2 = new THREE.Color(0xc471ed)
      const color3 = new THREE.Color(0xf093fb)
      
      for (let i = 0; i < particlesCount; i++) {
        const i3 = i * 3
        
        // 位置
        positions[i3] = (Math.random() - 0.5) * 20
        positions[i3 + 1] = (Math.random() - 0.5) * 20
        positions[i3 + 2] = (Math.random() - 0.5) * 20
        
        // 颜色
        const color = Math.random() > 0.5 
          ? (Math.random() > 0.5 ? color1 : color2)
          : color3
        colors[i3] = color.r
        colors[i3 + 1] = color.g
        colors[i3 + 2] = color.b
        
        // 大小
        sizes[i] = Math.random() * 3 + 1
      }
      
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
      
      const material = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          pixelRatio: { value: window.devicePixelRatio }
        },
        vertexShader: `
          attribute float size;
          attribute vec3 color;
          varying vec3 vColor;
          uniform float time;
          
          void main() {
            vColor = color;
            vec3 pos = position;
            pos.z += sin(time * 0.5 + position.x * 0.1) * 0.5;
            pos.y += cos(time * 0.3 + position.z * 0.1) * 0.5;
            
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_PointSize = size * (300.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying vec3 vColor;
          
          void main() {
            float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
            float alpha = 1.0 - smoothstep(0.0, 0.5, distanceToCenter);
            gl_FragColor = vec4(vColor, alpha * 0.6);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
      
      this.particles = new THREE.Points(geometry, material)
      this.scene.add(this.particles)
    },
    
    createGrid() {
      const gridHelper = new THREE.GridHelper(30, 30, 0xffffff, 0xffffff)
      gridHelper.material.opacity = 0.1
      gridHelper.material.transparent = true
      this.scene.add(gridHelper)
      
      // 添加彩色网格线
      const edges = new THREE.EdgesGeometry(new THREE.PlaneGeometry(30, 30, 30, 30))
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0xff6b9d,
        transparent: true,
        opacity: 0.2
      })
      const lines = new THREE.LineSegments(edges, lineMaterial)
      lines.rotation.x = -Math.PI / 2
      lines.position.y = -5
      this.scene.add(lines)
    },
    
    createGlow() {
      // 创建多个光球
      for (let i = 0; i < 8; i++) {
        const geometry = new THREE.SphereGeometry(0.8, 32, 32)
        const hue = (i / 8) * 0.3 + 0.7 // 紫色到粉色范围
        const material = new THREE.MeshBasicMaterial({
          color: new THREE.Color().setHSL(hue, 0.8, 0.6),
          transparent: true,
          opacity: 0.4
        })
        const sphere = new THREE.Mesh(geometry, material)
        sphere.position.set(
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 15
        )
        this.scene.add(sphere)
      }
    },
    
    createDepthLayers() {
      // 创建多层深度效果
      for (let i = 0; i < 3; i++) {
        const geometry = new THREE.PlaneGeometry(40, 40, 10, 10)
        const material = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.05,
          wireframe: true
        })
        const plane = new THREE.Mesh(geometry, material)
        plane.rotation.x = -Math.PI / 2
        plane.position.y = -8 + i * 4
        plane.position.z = -5 + i * 3
        this.scene.add(plane)
      }
    },
    
    animate() {
      this.animationId = requestAnimationFrame(this.animate)
      
      const time = Date.now() * 0.001
      
      // 旋转粒子
      if (this.particles) {
        this.particles.rotation.y = time * 0.08
        this.particles.material.uniforms.time.value = time
        
        // 鼠标交互 - 更平滑的跟随
        this.particles.rotation.x += (this.mouse.y * 0.3 - this.particles.rotation.x) * 0.03
        this.particles.rotation.y += (this.mouse.x * 0.3 - this.particles.rotation.y) * 0.03
      }
      
      // 相机轻微移动，创造深度感
      this.camera.position.x += (this.mouse.x * 1.5 - this.camera.position.x) * 0.03
      this.camera.position.y += (-this.mouse.y * 1.5 - this.camera.position.y) * 0.03
      this.camera.position.z = 5 + Math.sin(time * 0.5) * 0.5
      this.camera.lookAt(this.scene.position)
      
      this.renderer.render(this.scene, this.camera)
    },
    
    onMouseMove(event) {
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
    },
    
    handleResize() {
      if (!this.camera || !this.renderer) return
      this.camera.aspect = window.innerWidth / window.innerHeight
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(window.innerWidth, window.innerHeight)
    }
  }
}
</script>

<style scoped>
.scene-3d {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}
</style>

