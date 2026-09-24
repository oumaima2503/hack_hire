import * as THREE from 'three'

/**
 * The child's 3D companion: a full-body, cartoon (toon-shaded) animal built from
 * primitives, so there are no model files to download. One rig drives every
 * species; each state is a blend of procedural animations.
 */
export type CompanionState = 'idle' | 'walking' | 'talking' | 'listening' | 'thinking' | 'explaining' | 'celebrating' | 'waving'
export type Species = 'fox' | 'camel' | 'owl' | 'turtle' | 'lion' | 'monkey' | 'dino' | 'dolphin' | 'cat' | 'unicorn'
export const SPECIES: Species[] = ['fox', 'camel', 'owl', 'turtle', 'lion', 'monkey', 'dino', 'dolphin', 'cat', 'unicorn']
export const toSpecies = (key?: string | null): Species => (SPECIES.includes(key as Species) ? (key as Species) : 'fox')

type Kind = 'quad' | 'biped' | 'swim'
const KIND: Record<Species, Kind> = {
  fox: 'quad', camel: 'quad', turtle: 'quad', lion: 'quad', cat: 'quad', unicorn: 'quad',
  owl: 'biped', monkey: 'biped', dino: 'biped', dolphin: 'swim',
}
// body, belly/muzzle, dark (nose, pupils), extra
const COLORS: Record<Species, [string, string, string, string]> = {
  fox: ['#f08a3c', '#fff3e3', '#2d1c14', '#3a2418'],
  camel: ['#d9a563', '#f3d9ad', '#3a2616', '#b9844a'],
  owl: ['#9a6a43', '#f0dcb4', '#2a1a10', '#f2a93b'],
  turtle: ['#7cc576', '#eef0b0', '#1f2a1a', '#8a5f2e'],
  lion: ['#f2b84b', '#fde6b6', '#3a2410', '#b85f1e'],
  monkey: ['#8a5a36', '#f2cfa4', '#2a1a10', '#6b4226'],
  dino: ['#6cc070', '#e5f3b4', '#1d2b18', '#3f8f4a'],
  dolphin: ['#6fa8d8', '#eaf4fc', '#1a2a3a', '#4f86b8'],
  cat: ['#b8bcc6', '#f7f7f9', '#2a2a30', '#f6a6b8'],
  unicorn: ['#fbf7ff', '#fff', '#3a2a4a', '#f5c542'],
}
const RAINBOW = ['#ff7ab6', '#ffb347', '#ffe066', '#7ee081', '#6ec6ff', '#b28dff']

interface Rig {
  root: THREE.Group
  body: THREE.Group
  head: THREE.Group
  mouth: THREE.Object3D
  eyes: THREE.Object3D[]
  pupils: THREE.Object3D[]
  ears: THREE.Object3D[]
  armA?: THREE.Group // viewer's right front limb (arm / front leg / flipper)
  armB?: THREE.Group
  legA?: THREE.Group
  legB?: THREE.Group
  tail?: THREE.Group
  baseY: number
}

const damp = (a: number, b: number, lambda: number, dt: number) => a + (b - a) * (1 - Math.exp(-lambda * dt))

export class Companion3D {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50)
  private rig!: Rig
  private shadow!: THREE.Mesh
  private mats = new Map<string, THREE.Material>()
  private gradient: THREE.DataTexture
  private kind: Kind
  private raf = 0
  private last = 0
  private t = 0
  private state: CompanionState = 'idle'
  private speaking = false
  private voiceLevel: number | null = null
  private pulse = 0
  private facing = 1
  private yaw = 0.5
  private spin = 0
  private blinkAt = 2
  private w = { walk: 0, wave: 0, celebrate: 0, think: 0, listen: 0, explain: 0, talk: 0, idle: 1 }
  private talk = 0

  constructor(private canvas: HTMLCanvasElement, private species: Species, accent: string) {
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    this.renderer.setClearColor(0x000000, 0)
    this.gradient = new THREE.DataTexture(new Uint8Array([110, 190, 255]), 3, 1, THREE.RedFormat)
    this.gradient.minFilter = this.gradient.magFilter = THREE.NearestFilter
    this.gradient.needsUpdate = true

    this.camera.position.set(0, 1.45, 6.4)
    this.camera.lookAt(0, 1.2, 0)
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x8a7a9a, 1.6))
    const sun = new THREE.DirectionalLight(0xffffff, 2.2)
    sun.position.set(2.5, 4, 5)
    this.scene.add(sun)

    this.kind = KIND[species]
    this.build(species, accent)
    this.resize()
    this.loop = this.loop.bind(this)
    this.raf = requestAnimationFrame(this.loop)
  }

  // ─────────────────────────── public API ───────────────────────────
  setState(s: CompanionState) {
    this.state = s
  }
  /** -1 = facing left, 1 = facing right. */
  setFacing(dir: number) {
    if (dir) this.facing = dir > 0 ? 1 : -1
  }
  setSpeaking(on: boolean) {
    this.speaking = on
  }
  /** Loudness (0..1) of the Gemini voice while it plays; null = use the procedural mouth. */
  setVoiceLevel(level: number | null) {
    this.voiceLevel = level
  }
  /** Called on each spoken word: gives the mouth a natural "syllable" pop. */
  syllable() {
    this.pulse = 1
  }
  resize() {
    const { clientWidth: w, clientHeight: h } = this.canvas
    this.renderer.setSize(w || 200, h || 200, false)
    this.camera.aspect = (w || 1) / (h || 1)
    this.camera.updateProjectionMatrix()
  }
  dispose() {
    cancelAnimationFrame(this.raf)
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.geometry) m.geometry.dispose()
    })
    this.mats.forEach((m) => m.dispose())
    this.gradient.dispose()
    this.renderer.dispose()
  }

  // ─────────────────────────── building ───────────────────────────
  private mat(color: string) {
    let m = this.mats.get(color)
    if (!m) {
      m = new THREE.MeshToonMaterial({ color, gradientMap: this.gradient })
      this.mats.set(color, m)
    }
    return m
  }
  private ball(r: number, color: string, sx = 1, sy = 1, sz = 1) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 20), this.mat(color))
    m.scale.set(sx, sy, sz)
    return m
  }
  private cone(r: number, h: number, color: string, seg = 20) {
    return new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), this.mat(color))
  }
  private capsule(r: number, len: number, color: string) {
    return new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 14), this.mat(color))
  }
  private at<T extends THREE.Object3D>(o: T, x: number, y: number, z: number, parent: THREE.Object3D) {
    o.position.set(x, y, z)
    parent.add(o)
    return o
  }
  /** A limb hanging from a pivot (shoulder / hip). */
  private limb(parent: THREE.Object3D, x: number, y: number, z: number, r: number, len: number, color: string, foot?: string) {
    const pivot = this.at(new THREE.Group(), x, y, z, parent)
    this.at(this.capsule(r, len, color), 0, -(len / 2 + r * 0.4), 0, pivot)
    if (foot) this.at(this.ball(r * 1.12, foot, 1, 0.7, 1.25), 0, -(len + r * 0.55), r * 0.25, pivot)
    return pivot
  }

  private build(sp: Species, accent: string) {
    const [bodyC, bellyC, darkC, extraC] = COLORS[sp]
    const root = new THREE.Group()
    const body = this.at(new THREE.Group(), 0, 0, 0, root)
    const head = new THREE.Group()
    const rig: Rig = { root, body, head, mouth: new THREE.Object3D(), eyes: [], pupils: [], ears: [], baseY: 0 }
    const k = this.kind

    // ── torso & limbs per body plan ──
    if (k === 'quad') {
      const tall = sp === 'camel' ? 0.16 : sp === 'turtle' ? -0.16 : sp === 'unicorn' ? 0.1 : 0
      const legLen = 0.3 + tall
      const hipY = 0.5 + tall
      this.at(this.ball(0.5, bodyC, 0.92, 0.8, 1.15), 0, 0.72 + tall, 0, body)
      this.at(this.ball(0.3, bellyC, 1, 1, 0.6), 0, 0.7 + tall, 0.46, body)
      const foot = sp === 'fox' ? extraC : sp === 'unicorn' ? '#e8d9ff' : undefined
      rig.armA = this.limb(body, 0.24, hipY, 0.36, 0.12, legLen, bodyC, foot)
      rig.armB = this.limb(body, -0.24, hipY, 0.36, 0.12, legLen, bodyC, foot)
      rig.legA = this.limb(body, 0.24, hipY, -0.36, 0.12, legLen, bodyC, foot)
      rig.legB = this.limb(body, -0.24, hipY, -0.36, 0.12, legLen, bodyC, foot)
      rig.tail = this.at(new THREE.Group(), 0, 0.86 + tall, -0.58, body)
      const neck = sp === 'camel' ? 0.42 : sp === 'unicorn' ? 0.2 : 0
      if (neck) {
        const n = this.at(this.capsule(0.17, neck + 0.1, bodyC), 0, 1.12 + tall + neck * 0.35, 0.5, body)
        n.rotation.x = 0.35
      }
      this.at(head, 0, 1.2 + tall + neck * 0.8, 0.58 + neck * 0.2, body)
      // Theme-coloured scarf: the companion belongs to the child's world.
      const scarf = this.at(new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.075, 10, 28), this.mat(accent)), 0, 1.0 + tall + neck * 0.5, 0.44 + neck * 0.1, body)
      scarf.rotation.x = 1.25
    } else if (k === 'biped') {
      const lean = sp === 'dino' ? 0.12 : 0
      const torso = this.at(this.ball(0.44, bodyC, 1, sp === 'owl' ? 1.2 : 1.12, 0.92), 0, 0.82, 0, body)
      torso.rotation.x = lean
      this.at(this.ball(0.32, bellyC, 1, 1.15, 0.55), 0, 0.76, 0.26, body)
      const arm = sp === 'owl' ? 0.3 : sp === 'dino' ? 0.12 : 0.34
      const armR = sp === 'dino' ? 0.07 : 0.1
      rig.armA = this.limb(body, 0.42, 1.12, 0.04, armR, arm, bodyC)
      rig.armB = this.limb(body, -0.42, 1.12, 0.04, armR, arm, bodyC)
      if (sp === 'owl') {
        // Wings instead of arms: flatten the limbs.
        for (const w of [rig.armA, rig.armB]) w.children[0].scale.set(1.6, 1.25, 0.55)
      }
      const footC = sp === 'owl' ? extraC : sp === 'monkey' ? bellyC : bodyC
      rig.legA = this.limb(body, 0.2, 0.42, 0, 0.12, 0.16, sp === 'owl' ? extraC : bodyC, footC)
      rig.legB = this.limb(body, -0.2, 0.42, 0, 0.12, 0.16, sp === 'owl' ? extraC : bodyC, footC)
      rig.tail = this.at(new THREE.Group(), 0, 0.62, -0.36, body)
      this.at(head, 0, 1.58, 0.06 + lean * 0.5, body)
      const scarf = this.at(new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.075, 10, 28), this.mat(accent)), 0, 1.24, 0.02, body)
      scarf.rotation.x = Math.PI / 2 - 0.12
    } else {
      // swim (dolphin): upright, hovering, flippers and a tail fluke
      this.at(this.ball(0.42, bodyC, 1, 1.45, 0.88), 0, 1.0, 0, body)
      this.at(this.ball(0.3, bellyC, 1, 1.35, 0.55), 0, 0.92, 0.24, body)
      rig.armA = this.at(new THREE.Group(), 0.38, 1.05, 0.05, body)
      rig.armB = this.at(new THREE.Group(), -0.38, 1.05, 0.05, body)
      this.at(this.ball(0.13, extraC, 0.7, 1.8, 0.45), 0.05, -0.2, 0, rig.armA)
      this.at(this.ball(0.13, extraC, 0.7, 1.8, 0.45), -0.05, -0.2, 0, rig.armB)
      rig.tail = this.at(new THREE.Group(), 0, 0.42, -0.05, body)
      this.at(this.capsule(0.13, 0.22, bodyC), 0, -0.1, 0, rig.tail)
      const fluke = this.at(this.ball(0.3, extraC, 1.35, 0.3, 0.6), 0, -0.3, 0.02, rig.tail)
      fluke.rotation.x = 0.2
      const fin = this.at(this.cone(0.14, 0.34, extraC), 0, 1.35, -0.34, body)
      fin.rotation.x = -0.9
      this.at(head, 0, 1.62, 0.04, body)
      rig.baseY = 0.18
    }

    // ── head ──
    const headR = k === 'biped' ? 0.5 : k === 'swim' ? 0.4 : 0.44
    this.at(this.ball(headR, bodyC), 0, 0, 0, head)
    const muzzleC = sp === 'turtle' || sp === 'dino' || sp === 'dolphin' ? bodyC : bellyC
    const face = headR * 0.84
    if (sp === 'owl') {
      this.at(this.ball(0.36, bellyC, 1.15, 1, 0.5), 0, -0.02, 0.28, head)
      const beak = this.at(this.cone(0.07, 0.16, extraC), 0, -0.08, face + 0.1, head)
      beak.rotation.x = Math.PI / 2 + 0.5
    } else if (sp === 'dolphin') {
      const snout = this.at(this.capsule(0.13, 0.22, muzzleC), 0, -0.12, 0.38, head)
      snout.rotation.x = Math.PI / 2
    } else {
      const long = sp === 'fox' ? 1.25 : sp === 'camel' || sp === 'unicorn' ? 1.15 : sp === 'dino' ? 1.2 : 1
      this.at(this.ball(0.21, muzzleC, 1.15, 0.82, long), 0, -0.13, face - 0.02 + (long - 1) * 0.15, head)
      if (sp === 'monkey') this.at(this.ball(0.4, bellyC, 1.05, 0.95, 0.45), 0, 0.04, 0.26, head)
      this.at(this.ball(0.06, sp === 'cat' ? '#f48aa6' : darkC, 1.2, 0.85, 1), 0, -0.06, face + 0.2 + (long - 1) * 0.3, head)
    }
    // mouth (opens while talking)
    rig.mouth = this.at(this.ball(0.085, '#6b1f2a', 1.5, 1, 0.55), 0, -0.25, face + 0.08, head)
    // eyes
    const eyeX = k === 'biped' ? 0.19 : 0.17
    const eyeR = sp === 'owl' ? 0.13 : 0.1
    for (const s of [1, -1]) {
      const eye = this.at(new THREE.Group(), s * eyeX, 0.08, face - 0.02, head)
      if (sp === 'owl') this.at(this.ball(eyeR * 1.35, extraC, 1, 1, 0.35), 0, 0, -0.02, eye)
      this.at(this.ball(eyeR, '#ffffff', 1, 1.1, 0.7), 0, 0, 0.02, eye)
      const pupil = this.at(new THREE.Group(), 0, 0, 0.07, eye)
      this.at(this.ball(eyeR * 0.68, darkC, 1, 1.1, 0.6), 0, 0, 0, pupil)
      this.at(this.ball(eyeR * 0.22, '#ffffff'), eyeR * 0.22, eyeR * 0.3, 0.04, pupil)
      rig.eyes.push(eye)
      rig.pupils.push(pupil)
      // cheeks
      this.at(this.ball(0.06, '#ff9fb2', 1.3, 0.8, 0.4), s * (eyeX + 0.1), -0.12, face - 0.05, head)
    }

    // ── species features ──
    const ear = (x: number, y: number, z: number, o: THREE.Object3D) => {
      const g = this.at(new THREE.Group(), x, y, z, head)
      g.add(o)
      rig.ears.push(g)
      return g
    }
    switch (sp) {
      case 'fox':
      case 'cat': {
        for (const s of [1, -1]) {
          const g = ear(s * 0.24, 0.32, -0.02, this.cone(0.14, 0.32, bodyC, 4))
          g.rotation.z = -s * 0.35
          this.at(this.cone(0.08, 0.2, sp === 'fox' ? darkC : extraC, 4), 0, -0.02, 0.04, g)
        }
        if (sp === 'cat') {
          for (const s of [1, -1])
            for (const dy of [0.02, -0.04]) {
              const w = this.at(new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.3), this.mat('#555')), s * 0.24, -0.1 + dy, face + 0.1, head)
              w.rotation.z = Math.PI / 2 + s * dy * 3
            }
          const tail = this.at(this.capsule(0.07, 0.55, bodyC), 0, 0.28, -0.1, rig.tail!)
          tail.rotation.x = -0.35
        } else {
          const tail = this.at(this.ball(0.2, bodyC, 1, 1, 2), 0, 0.12, -0.3, rig.tail!)
          tail.rotation.x = 0.5
          this.at(this.ball(0.13, bellyC, 1, 1, 1.2), 0, -0.05, -0.62, rig.tail!)
        }
        break
      }
      case 'lion': {
        const ring = this.at(new THREE.Group(), 0, 0, -0.08, head)
        for (let i = 0; i < 14; i++) {
          const a = (i / 14) * Math.PI * 2
          this.at(this.ball(0.17, extraC), Math.cos(a) * 0.42, Math.sin(a) * 0.42, 0, ring)
        }
        for (const s of [1, -1]) ear(s * 0.3, 0.32, 0.02, this.ball(0.1, bodyC, 1, 1, 0.6))
        const tail = this.at(this.capsule(0.05, 0.55, bodyC), 0, -0.1, -0.25, rig.tail!)
        tail.rotation.x = 1.0
        this.at(this.ball(0.1, extraC), 0, -0.28, -0.5, rig.tail!)
        break
      }
      case 'camel': {
        this.at(this.ball(0.3, extraC, 0.9, 0.95, 1.1), 0, 1.24, -0.14, body)
        this.at(this.ball(0.12, extraC, 1, 1.2, 1), 0, 1.5, -0.16, body)
        for (const s of [1, -1]) ear(s * 0.26, 0.3, -0.08, this.ball(0.07, bodyC, 1, 1.4, 0.7))
        const tail = this.at(this.capsule(0.04, 0.35, bodyC), 0, -0.2, -0.05, rig.tail!)
        tail.rotation.x = 0.3
        break
      }
      case 'unicorn': {
        const horn = this.at(this.cone(0.07, 0.42, extraC, 12), 0, 0.46, 0.18, head)
        horn.rotation.x = 0.35
        for (const s of [1, -1]) {
          const g = ear(s * 0.23, 0.33, -0.08, this.cone(0.09, 0.24, bodyC, 12))
          g.rotation.z = -s * 0.3
        }
        RAINBOW.forEach((c, i) => this.at(this.ball(0.12, c), 0.02 * (i % 2 ? 1 : -1), 0.38 - i * 0.14, -0.34 - i * 0.03, head))
        RAINBOW.slice(0, 4).forEach((c, i) => this.at(this.ball(0.13, c, 1, 1, 1.2), 0, -0.05 - i * 0.12, -0.2 - i * 0.12, rig.tail!))
        break
      }
      case 'turtle': {
        const shell = this.at(new THREE.Mesh(new THREE.SphereGeometry(0.62, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2), this.mat(extraC)), 0, 0.56, -0.02, body)
        shell.scale.set(0.95, 0.9, 1.05)
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2
          const spot = this.at(this.ball(0.13, '#a77a42', 1, 0.4, 1), Math.cos(a) * 0.38, 0.9, Math.sin(a) * 0.42, body)
          spot.lookAt(0, 3, 0)
        }
        this.at(this.ball(0.16, '#a77a42', 1, 0.45, 1), 0, 1.1, 0, body)
        this.at(this.cone(0.06, 0.16, bodyC), 0, -0.02, -0.08, rig.tail!).rotation.x = -1.8
        break
      }
      case 'owl': {
        for (const s of [1, -1]) {
          const g = ear(s * 0.3, 0.4, -0.05, this.cone(0.09, 0.26, bodyC, 10))
          g.rotation.z = -s * 0.5
        }
        const tail = this.at(this.ball(0.16, bodyC, 1.2, 0.4, 1), 0, -0.1, -0.05, rig.tail!)
        tail.rotation.x = -0.6
        break
      }
      case 'monkey': {
        for (const s of [1, -1]) {
          const g = ear(s * 0.5, 0.02, -0.05, this.ball(0.15, bodyC, 0.5, 1, 1))
          this.at(this.ball(0.1, bellyC, 0.5, 1, 1), s * 0.03, 0, 0.02, g)
        }
        const curl = this.at(new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.05, 8, 24, Math.PI * 1.5), this.mat(bodyC)), 0, 0.18, -0.22, rig.tail!)
        curl.rotation.y = Math.PI / 2
        break
      }
      case 'dino': {
        const tail = this.at(this.cone(0.24, 0.9, bodyC), 0, 0.02, -0.4, rig.tail!)
        tail.rotation.x = -Math.PI / 2 - 0.25
        for (let i = 0; i < 5; i++) {
          const spike = this.at(this.cone(0.07, 0.16, extraC, 6), 0, 1.32 - i * 0.22, -0.42 - i * 0.03, body)
          spike.rotation.x = -0.5 - i * 0.15
        }
        this.at(this.cone(0.06, 0.14, extraC, 6), 0, 0.5, -0.15, head).rotation.x = -0.3
        break
      }
      case 'dolphin':
        break
    }

    // Soft ground shadow
    this.shadow = new THREE.Mesh(new THREE.CircleGeometry(0.62, 32), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false }))
    this.shadow.rotation.x = -Math.PI / 2
    this.shadow.scale.set(1, 0.55, 1)
    this.shadow.position.y = 0.005
    this.scene.add(this.shadow)
    this.scene.add(root)
    this.rig = rig
  }

  // ─────────────────────────── animation ───────────────────────────
  private loop(now: number) {
    this.raf = requestAnimationFrame(this.loop)
    if (document.hidden) {
      this.last = now
      return
    }
    const dt = Math.min(0.05, this.last ? (now - this.last) / 1000 : 0.016)
    this.last = now
    this.update(dt)
    this.renderer.render(this.scene, this.camera)
  }

  private update(dt: number) {
    this.t += dt
    const t = this.t
    const r = this.rig
    const s = this.state
    const target = {
      walk: s === 'walking' ? 1 : 0, wave: s === 'waving' ? 1 : 0, celebrate: s === 'celebrating' ? 1 : 0,
      think: s === 'thinking' ? 1 : 0, listen: s === 'listening' ? 1 : 0, explain: s === 'explaining' ? 1 : 0,
      talk: s === 'talking' ? 1 : 0, idle: s === 'idle' ? 1 : 0,
    }
    const w = this.w
    for (const key of Object.keys(w) as (keyof typeof w)[]) w[key] = damp(w[key], target[key], 7, dt)

    // ── mouth: syllable pops + a natural wobble while the voice plays ──
    this.pulse = Math.max(0, this.pulse - dt * 6)
    const open = this.voiceLevel !== null ? Math.min(1.1, 0.08 + this.voiceLevel * 1.6) : this.speaking ? 0.3 + 0.45 * Math.abs(Math.sin(t * 13 + Math.sin(t * 4.3) * 2)) + this.pulse * 0.5 : w.listen * 0.15
    this.talk = damp(this.talk, open, 22, dt)
    r.mouth.scale.set(1.5 - this.talk * 0.3, 0.12 + this.talk * 1.25, 0.55)

    // ── facing: profile while walking, turned to the child while talking ──
    const turn = w.walk * 1.2 + (w.talk + w.explain + w.listen + w.wave) * 0.22 + (w.idle + w.think + w.celebrate) * 0.45
    if (w.celebrate > 0.05) this.spin += dt * 7 * w.celebrate
    else this.spin = damp(this.spin, Math.round(this.spin / (Math.PI * 2)) * Math.PI * 2, 5, dt)
    this.yaw = damp(this.yaw, this.facing * turn, 6, dt)
    r.root.rotation.y = this.yaw + this.spin

    // ── whole body ──
    const ph = t * (this.kind === 'quad' ? 9 : 8)
    const breathe = Math.sin(t * 2.3)
    const hop = this.species === 'owl' ? 0.14 : 0.05
    const jump = Math.max(0, Math.sin(t * 6.5)) * 0.42 * w.celebrate
    const swimBob = this.kind === 'swim' ? Math.sin(t * 2) * 0.06 : 0
    r.root.position.y = r.baseY + Math.abs(Math.sin(ph)) * hop * w.walk + jump + swimBob
    r.body.scale.set(1 + breathe * 0.012, 1 + breathe * 0.025, 1)
    r.body.rotation.x = -0.1 * w.wave + 0.08 * w.listen + (this.kind === 'quad' ? 0 : 0.04 * w.walk)
    r.body.rotation.z = Math.sin(ph) * 0.05 * w.walk * (this.kind === 'quad' ? 0.4 : 1) + (this.kind === 'swim' ? Math.sin(t * 1.6) * 0.05 : 0)
    this.shadow.scale.set(1 - jump * 0.6, 0.55 * (1 - jump * 0.6), 1)
    ;(this.shadow.material as THREE.MeshBasicMaterial).opacity = 0.22 - jump * 0.2

    // ── head ──
    const lookAround = Math.sin(t * 0.55) * 0.3 * w.idle
    const nod = Math.sin(t * 7) * 0.06 * (w.talk + w.explain) + Math.sin(t * 3.2) * 0.05 * w.explain
    r.head.rotation.x = nod - 0.22 * w.think + 0.05 * w.listen - 0.12 * w.celebrate
    r.head.rotation.y = lookAround - this.yaw * 0.35 * (1 - w.walk) + Math.sin(t * 1.4) * 0.08 * w.talk
    r.head.rotation.z = 0.24 * w.think - 0.26 * w.listen + Math.sin(t * 2) * 0.04 * w.explain
    for (const e of r.ears) e.scale.y = 1 + 0.2 * w.listen + Math.max(0, Math.sin(t * 9)) * 0.05 * w.walk

    // ── eyes: blink, look up while thinking ──
    this.blinkAt -= dt
    let lid = 1
    if (this.blinkAt < 0.12) lid = Math.abs(this.blinkAt - 0.06) / 0.06
    if (this.blinkAt < 0) this.blinkAt = 2 + Math.random() * 3.5
    const happy = w.celebrate > 0.5 ? 0.45 : 1
    for (const e of r.eyes) e.scale.y = Math.max(0.08, lid * happy)
    for (const p of r.pupils) {
      p.position.y = 0.04 * w.think
      p.position.x = Math.sin(t * 0.55) * 0.02 * w.idle
    }

    // ── limbs ──
    const swing = Math.sin(ph) * 0.65 * w.walk
    const wave = Math.sin(t * 10) * 0.4
    if (this.kind === 'quad') {
      const set = (g: THREE.Group | undefined, x: number, z = 0) => g && (g.rotation.x = x) && (g.rotation.z = z)
      set(r.armA, swing - w.wave * 1.45 - w.celebrate * 0.7 - Math.max(0, Math.sin(t * 3)) * 0.5 * w.explain, w.wave * wave * 0.5)
      set(r.armB, -swing - w.celebrate * 0.7)
      set(r.legA, -swing + w.celebrate * 0.6)
      set(r.legB, swing + w.celebrate * 0.6)
    } else if (this.kind === 'biped') {
      const raiseA = 0.25 + w.wave * (2.25 + wave * 0.35) + w.celebrate * (2.3 + Math.sin(t * 13) * 0.2) + w.explain * (0.5 + Math.sin(t * 3) * 0.3)
      const raiseB = 0.25 + w.celebrate * (2.3 + Math.sin(t * 13 + 1) * 0.2) + w.explain * (0.3 + Math.sin(t * 3 + 2) * 0.25) - w.think * 0.2
      if (r.armA) {
        r.armA.rotation.z = raiseA
        r.armA.rotation.x = -swing * 0.8 - w.explain * 0.6 - w.listen * 0.2
      }
      if (r.armB) {
        r.armB.rotation.z = -raiseB
        r.armB.rotation.x = swing * 0.8 - w.think * 2.1 - w.explain * 0.4
      }
      if (r.legA) r.legA.rotation.x = -swing
      if (r.legB) r.legB.rotation.x = swing
    } else {
      // dolphin: flippers paddle, the fluke beats when "walking" (swimming)
      if (r.armA) r.armA.rotation.z = 0.4 + Math.sin(t * 6) * 0.25 * (w.walk + w.explain) + w.wave * (1.6 + wave) + w.celebrate * 1.8
      if (r.armB) r.armB.rotation.z = -0.4 - Math.sin(t * 6) * 0.25 * (w.walk + w.explain) - w.celebrate * 1.8
    }
    if (r.tail) {
      const wag = this.kind === 'swim' ? 0 : Math.sin(t * (2.2 + w.walk * 6 + w.celebrate * 8)) * (0.25 + 0.3 * w.walk + 0.4 * w.celebrate)
      r.tail.rotation.y = wag
      r.tail.rotation.x = this.kind === 'swim' ? Math.sin(t * (3 + 5 * w.walk)) * (0.2 + 0.3 * w.walk) : 0
    }
  }
}
