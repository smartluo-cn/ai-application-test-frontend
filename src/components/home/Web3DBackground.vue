<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import * as THREE from 'three'

const containerRef = ref(null)
let scene, camera, renderer, animationId
let particles, lines, centralSphere
let mouseX = 0
let mouseY = 0
let targetX = 0
let targetY = 0

onMounted(() => {
  initScene()
  animate()
  window.addEventListener('resize', onWindowResize)
  window.addEventListener('mousemove', onMouseMove)
})

onUnmounted(() => {
  window.removeEventListener('resize', onWindowResize)
  window.removeEventListener('mousemove', onMouseMove)
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  if (renderer) {
    renderer.dispose()
  }
})

function initScene() {
  const container = containerRef.value
  if (!container) return

  // 创建场景
  scene = new THREE.Scene()

  // 创建相机
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )
  camera.position.z = 50

  // 创建渲染器
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0x000000, 0)
  container.appendChild(renderer.domElement)

  // 创建粒子系统
  createParticles()

  // 创建连接线
  createConnectionLines()

  // 创建中心球体
  createCentralSphere()

  // 创建环形装饰
  createRings()
}

function createParticles() {
  const particleCount = 2000
  const positions = new Float32Array(particleCount * 3)
  const colors = new Float32Array(particleCount * 3)
  const sizes = new Float32Array(particleCount)

  const color1 = new THREE.Color(0xe63946) // 红色
  const color2 = new THREE.Color(0xf4a261) // 橙色
  const color3 = new THREE.Color(0x6366f1) // 紫色

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3

    // 随机位置（球形分布）
    const radius = 30 + Math.random() * 70
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)

    positions[i3] = radius * Math.sin(phi) * Math.cos(theta)
    positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
    positions[i3 + 2] = radius * Math.cos(phi)

    // 随机颜色
    const colorChoice = Math.random()
    let color
    if (colorChoice < 0.33) {
      color = color1
    } else if (colorChoice < 0.66) {
      color = color2
    } else {
      color = color3
    }

    colors[i3] = color.r
    colors[i3 + 1] = color.g
    colors[i3 + 2] = color.b

    // 随机大小
    sizes[i] = Math.random() * 2 + 0.5
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

  // 创建圆形粒子纹理
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
  gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)')
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 64, 64)

  const texture = new THREE.CanvasTexture(canvas)

  const material = new THREE.PointsMaterial({
    size: 1.5,
    map: texture,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })

  particles = new THREE.Points(geometry, material)
  scene.add(particles)
}

function createConnectionLines() {
  const lineCount = 100
  const positions = new Float32Array(lineCount * 6)

  for (let i = 0; i < lineCount; i++) {
    const i6 = i * 6

    // 起点
    const radius1 = 20 + Math.random() * 40
    const theta1 = Math.random() * Math.PI * 2
    const phi1 = Math.acos(2 * Math.random() - 1)

    positions[i6] = radius1 * Math.sin(phi1) * Math.cos(theta1)
    positions[i6 + 1] = radius1 * Math.sin(phi1) * Math.sin(theta1)
    positions[i6 + 2] = radius1 * Math.cos(phi1)

    // 终点
    const radius2 = 20 + Math.random() * 40
    const theta2 = Math.random() * Math.PI * 2
    const phi2 = Math.acos(2 * Math.random() - 1)

    positions[i6 + 3] = radius2 * Math.sin(phi2) * Math.cos(theta2)
    positions[i6 + 4] = radius2 * Math.sin(phi2) * Math.sin(theta2)
    positions[i6 + 5] = radius2 * Math.cos(phi2)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

  const material = new THREE.LineBasicMaterial({
    color: 0x6366f1,
    transparent: true,
    opacity: 0.15,
    blending: THREE.AdditiveBlending,
  })

  lines = new THREE.LineSegments(geometry, material)
  scene.add(lines)
}

function createCentralSphere() {
  // 创建线框球体
  const geometry = new THREE.IcosahedronGeometry(8, 2)
  const material = new THREE.MeshBasicMaterial({
    color: 0xe63946,
    wireframe: true,
    transparent: true,
    opacity: 0.3,
  })

  centralSphere = new THREE.Mesh(geometry, material)
  scene.add(centralSphere)

  // 内部发光球体
  const innerGeometry = new THREE.SphereGeometry(5, 32, 32)
  const innerMaterial = new THREE.MeshBasicMaterial({
    color: 0xf4a261,
    transparent: true,
    opacity: 0.2,
  })

  const innerSphere = new THREE.Mesh(innerGeometry, innerMaterial)
  centralSphere.add(innerSphere)
}

function createRings() {
  // 创建多个环形装饰
  const ringColors = [0xe63946, 0xf4a261, 0x6366f1]

  for (let i = 0; i < 3; i++) {
    const geometry = new THREE.TorusGeometry(12 + i * 4, 0.1, 16, 100)
    const material = new THREE.MeshBasicMaterial({
      color: ringColors[i],
      transparent: true,
      opacity: 0.3 - i * 0.08,
    })

    const ring = new THREE.Mesh(geometry, material)
    ring.rotation.x = Math.PI / 2 + i * 0.3
    ring.rotation.y = i * 0.5
    scene.add(ring)
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

function onMouseMove(event) {
  mouseX = (event.clientX / window.innerWidth) * 2 - 1
  mouseY = -(event.clientY / window.innerHeight) * 2 + 1
}

function animate() {
  animationId = requestAnimationFrame(animate)

  const time = Date.now() * 0.001

  // 平滑鼠标移动
  targetX += (mouseX - targetX) * 0.02
  targetY += (mouseY - targetY) * 0.02

  // 旋转粒子系统
  if (particles) {
    particles.rotation.y = time * 0.05 + targetX * 0.3
    particles.rotation.x = targetY * 0.2
  }

  // 旋转连接线
  if (lines) {
    lines.rotation.y = -time * 0.03 + targetX * 0.2
    lines.rotation.z = time * 0.02
  }

  // 旋转中心球体
  if (centralSphere) {
    centralSphere.rotation.y = time * 0.2
    centralSphere.rotation.x = time * 0.1
    centralSphere.scale.setScalar(1 + Math.sin(time * 2) * 0.05)
  }

  // 旋转环形装饰
  scene.children.forEach((child, index) => {
    if (child.geometry && child.geometry.type === 'TorusGeometry') {
      child.rotation.z = time * 0.1 * (index % 2 === 0 ? 1 : -1)
    }
  })

  // 相机轻微移动
  camera.position.x = targetX * 5
  camera.position.y = targetY * 3
  camera.lookAt(scene.position)

  renderer.render(scene, camera)
}
</script>

<template>
  <div ref="containerRef" class="web3d-background"></div>
</template>

<style scoped>
.web3d-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}
</style>
