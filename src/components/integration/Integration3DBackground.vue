<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import * as THREE from 'three'

const containerRef = ref(null)
let scene, camera, renderer, animationId
let hexagonMesh, floatingCubes, wavePlane
let mouseX = 0
let mouseY = 0

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
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )
  camera.position.z = 30
  camera.position.y = 5

  // 创建渲染器
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0x000000, 0)
  container.appendChild(renderer.domElement)

  // 创建六边形网格
  createHexagonGrid()

  // 创建浮动立方体
  createFloatingCubes()

  // 创建波浪平面
  createWavePlane()

  // 添加环境光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
  scene.add(ambientLight)

  // 添加点光源
  const pointLight1 = new THREE.PointLight(0xe63946, 1, 100)
  pointLight1.position.set(20, 20, 20)
  scene.add(pointLight1)

  const pointLight2 = new THREE.PointLight(0x6366f1, 0.8, 100)
  pointLight2.position.set(-20, -10, 15)
  scene.add(pointLight2)
}

function createHexagonGrid() {
  const hexGeometry = new THREE.CircleGeometry(1, 6)
  const hexMaterial = new THREE.MeshBasicMaterial({
    color: 0xe63946,
    transparent: true,
    opacity: 0.15,
    side: THREE.DoubleSide,
  })

  hexagonMesh = new THREE.Group()

  const rows = 8
  const cols = 15
  const spacing = 2.5

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const hex = new THREE.Mesh(hexGeometry, hexMaterial.clone())
      const offsetX = i % 2 === 0 ? 0 : spacing * 0.5
      hex.position.x = (j - cols / 2) * spacing + offsetX
      hex.position.y = (i - rows / 2) * spacing * 0.866
      hex.position.z = Math.sin(i * 0.5 + j * 0.3) * 2
      hex.userData = { baseZ: hex.position.z, row: i, col: j }
      hexagonMesh.add(hex)
    }
  }

  hexagonMesh.position.z = -15
  hexagonMesh.rotation.x = Math.PI * 0.1
  scene.add(hexagonMesh)
}

function createFloatingCubes() {
  floatingCubes = new THREE.Group()

  const cubeGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8)

  for (let i = 0; i < 30; i++) {
    const cubeMaterial = new THREE.MeshBasicMaterial({
      color: Math.random() > 0.5 ? 0xf4a261 : 0x6366f1,
      transparent: true,
      opacity: 0.3,
      wireframe: true,
    })

    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial)

    // 随机位置
    cube.position.x = (Math.random() - 0.5) * 60
    cube.position.y = (Math.random() - 0.5) * 40
    cube.position.z = (Math.random() - 0.5) * 30 - 5

    // 随机旋转
    cube.rotation.x = Math.random() * Math.PI
    cube.rotation.y = Math.random() * Math.PI

    // 存储动画参数
    cube.userData = {
      rotationSpeed: {
        x: (Math.random() - 0.5) * 0.02,
        y: (Math.random() - 0.5) * 0.02,
      },
      floatSpeed: Math.random() * 0.5 + 0.5,
      floatOffset: Math.random() * Math.PI * 2,
      baseY: cube.position.y,
    }

    floatingCubes.add(cube)
  }

  scene.add(floatingCubes)
}

function createWavePlane() {
  const planeGeometry = new THREE.PlaneGeometry(100, 60, 50, 30)
  const planeMaterial = new THREE.MeshBasicMaterial({
    color: 0x6366f1,
    transparent: true,
    opacity: 0.08,
    wireframe: true,
    side: THREE.DoubleSide,
  })

  wavePlane = new THREE.Mesh(planeGeometry, planeMaterial)
  wavePlane.position.z = -25
  wavePlane.rotation.x = -Math.PI * 0.3
  scene.add(wavePlane)
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

  // 动画六边形网格
  if (hexagonMesh) {
    hexagonMesh.children.forEach((hex) => {
      const { baseZ, row, col } = hex.userData
      hex.position.z = baseZ + Math.sin(time + row * 0.3 + col * 0.2) * 0.5
      hex.material.opacity = 0.1 + Math.sin(time * 0.5 + row * 0.2 + col * 0.1) * 0.08
    })
    hexagonMesh.rotation.z = time * 0.02
  }

  // 动画浮动立方体
  if (floatingCubes) {
    floatingCubes.children.forEach((cube) => {
      const { rotationSpeed, floatSpeed, floatOffset, baseY } = cube.userData
      cube.rotation.x += rotationSpeed.x
      cube.rotation.y += rotationSpeed.y
      cube.position.y = baseY + Math.sin(time * floatSpeed + floatOffset) * 2
    })
  }

  // 动画波浪平面
  if (wavePlane) {
    const positions = wavePlane.geometry.attributes.position
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i)
      const y = positions.getY(i)
      const z = Math.sin(x * 0.1 + time) * Math.cos(y * 0.1 + time) * 2
      positions.setZ(i, z)
    }
    positions.needsUpdate = true
    wavePlane.rotation.z = time * 0.01
  }

  // 相机跟随鼠标
  camera.position.x += (mouseX * 5 - camera.position.x) * 0.02
  camera.position.y += (mouseY * 3 + 5 - camera.position.y) * 0.02
  camera.lookAt(0, 0, 0)

  renderer.render(scene, camera)
}
</script>

<template>
  <div ref="containerRef" class="integration-3d-background"></div>
</template>

<style scoped>
.integration-3d-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}
</style>
