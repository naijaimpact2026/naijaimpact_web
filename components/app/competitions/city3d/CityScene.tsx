'use client'

/*
 * 3D competition city (three.js via React Three Fiber). Low-poly CC0 models
 * from Kenney (City Kit Commercial/Suburban/Roads, Car Kit, Nature Kit, Mini
 * Characters), meshopt-compressed in /public/competitions/city.
 *
 * The scene only renders the world. Mission panels are React UI opened via
 * `onZoneEnter` when the player reaches a building's door (or taps a marker).
 */

import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Clone, Html, OrbitControls, useAnimations, useGLTF, useProgress } from '@react-three/drei'
import * as THREE from 'three'
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { CHARACTERS, characterModelUrl } from '@/lib/competitions/config'
import {
    CAR_LOOP, CENTER, N, assignSlots, buildDecor, buildRoads, findPath, idx, inside, nearestFree, tileToWorld, worldToTile,
    type DecorItem, type Slot,
} from './layout'

export interface CityZone { key: string; label: string; done: number; total: number }

export interface CitySceneProps
{
    zones: CityZone[]
    character: number
    themeColor: string
    paused: boolean
    onZoneEnter: (key: string) => void
    onReady: () => void
    onError: () => void
    /** Joystick input, written by the overlay (-1..1, y down = +1). */
    joystick: React.MutableRefObject<{ x: number; y: number }>
    /** Movement keys currently held (owned by the focusable wrapper). */
    keys: React.MutableRefObject<Set<string>>
    /** Bump to recentre the camera on the player. */
    recenter: number
}

const A = '/competitions/city'
const M = {
    road: `${A}/roads/road-straight.glb`,
    crossroad: `${A}/roads/road-crossroad.glb`,
    roundabout: `${A}/roads/road-roundabout.glb`,
    light: `${A}/roads/light-curved.glb`,
    palm: `${A}/nature/tree_palm.glb`,
    palmTall: `${A}/nature/tree_palmTall.glb`,
    bush: `${A}/nature/plant_bushLarge.glb`,
    flower: [`${A}/nature/flower_redA.glb`, `${A}/nature/flower_yellowA.glb`],
    shop: ['a', 'c', 'e', 'g', 'h', 'k', 'l', 'm'].map((k) => `${A}/commercial/building-${k}.glb`),
    house: ['a', 'c', 'f', 'k'].map((k) => `${A}/suburban/building-type-${k}.glb`),
    tall: ['b', 'c', 'e'].map((k) => `${A}/commercial/building-skyscraper-${k}.glb`),
    skyscraper: ['a', 'b', 'c', 'e'].map((k) => `${A}/commercial/building-skyscraper-${k}.glb`),
    parasol: [`${A}/commercial/detail-parasol-a.glb`, `${A}/commercial/detail-parasol-b.glb`],
    planter: `${A}/suburban/planter.glb`,
    cars: ['taxi', 'van', 'sedan', 'delivery', 'suv', 'truck'].map((k) => `${A}/cars/${k}.glb`),
}

/** Kenney city buildings face -z; turn them so their shopfronts face our +z "door" side. */
const FRONT = Math.PI

const PLAYER_SPEED = 2.4
const CHAR_SCALE = 0.55
const CAR_SCALE = 0.28

// ─── Small model helper ──────────────────────────────────────────────────────

function Model({ url, position, rotation = 0, scale = 1, shadow = true }: { url: string; position: [number, number, number]; rotation?: number; scale?: number; shadow?: boolean })
{
    const { scene } = useGLTF(url)
    return <Clone object={scene} position={position} rotation={[0, rotation, 0]} scale={scale} castShadow={shadow} receiveShadow />
}

const wx = tileToWorld
const at = (x: number, z: number, y = 0): [number, number, number] => [wx(x), y, wx(z)]

// ─── Ground + roads ──────────────────────────────────────────────────────────

function Ground({ onTap }: { onTap: (e: ThreeEvent<MouseEvent>) => void })
{
    return (
        <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow onClick={onTap}>
                <planeGeometry args={[N + 30, N + 30]} />
                <meshStandardMaterial color="#86c46d" />
            </mesh>
            {/* Lagoon edge beyond the city */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, N / 2 + 9]}>
                <planeGeometry args={[N + 60, 12]} />
                <meshStandardMaterial color="#4fb3e3" />
            </mesh>
        </group>
    )
}

function Roads()
{
    const roads = useMemo(buildRoads, [])
    return (
        <group>
            {roads.map((r) => (
                <Model
                    key={`${r.x}-${r.z}`}
                    url={r.piece === 'straight' ? M.road : r.piece === 'crossroad' ? M.crossroad : M.roundabout}
                    position={at(r.x, r.z, 0.001)}
                    rotation={r.rot}
                    shadow={false}
                />
            ))}
        </group>
    )
}

// ─── Landmarks ───────────────────────────────────────────────────────────────

function Trophy({ color }: { color: string })
{
    const ref = useRef<THREE.Group>(null)
    useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.5 })
    const gold = <meshStandardMaterial color="#f6c445" metalness={0.75} roughness={0.25} emissive="#7a5200" emissiveIntensity={0.25} />
    return (
        <group>
            <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.55, 0.65, 0.5, 24]} />
                <meshStandardMaterial color={color} roughness={0.6} />
            </mesh>
            <group ref={ref} position={[0, 0.5, 0]}>
                <mesh position={[0, 0.12, 0]} castShadow><boxGeometry args={[0.5, 0.24, 0.5]} />{gold}</mesh>
                <mesh position={[0, 0.45, 0]} castShadow><cylinderGeometry args={[0.07, 0.1, 0.45, 16]} />{gold}</mesh>
                <mesh position={[0, 0.95, 0]} castShadow><cylinderGeometry args={[0.38, 0.16, 0.6, 24, 1, true]} />{gold}</mesh>
                <mesh position={[0.38, 1.0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><torusGeometry args={[0.14, 0.035, 8, 20]} />{gold}</mesh>
                <mesh position={[-0.38, 1.0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><torusGeometry args={[0.14, 0.035, 8, 20]} />{gold}</mesh>
            </group>
        </group>
    )
}

/** Building cluster for one zone, composed in a local frame where +z is the door side. */
function LandmarkBody({ slot, color }: { slot: Slot; color: string })
{
    switch (slot.style)
    {
        case 'market':
            return (
                <group>
                    <Model url={M.shop[0]} position={[-1.8, 0, -1.4]} rotation={FRONT} scale={1.25} />
                    <Model url={M.shop[1]} position={[0, 0, -1.4]} rotation={FRONT} scale={1.25} />
                    <Model url={M.shop[2]} position={[1.8, 0, -1.4]} rotation={FRONT} scale={1.25} />
                    <Model url={M.parasol[0]} position={[-1.7, 0, 1.0]} scale={1.8} />
                    <Model url={M.parasol[1]} position={[0, 0, 1.1]} scale={1.8} />
                    <Model url={M.parasol[0]} position={[1.7, 0, 1.0]} scale={1.8} />
                </group>
            )
        case 'tower':
            return (
                <group>
                    <Model url={M.skyscraper[0]} position={[0, 0, -0.9]} rotation={FRONT} scale={1.5} />
                    <Model url={M.planter} position={[-1.8, 0, 1.2]} scale={1.2} />
                    <Model url={M.planter} position={[1.8, 0, 1.2]} scale={1.2} />
                    <Model url={M.palmTall} position={[-2.3, 0, -2.3]} scale={0.9} />
                    <Model url={M.palmTall} position={[2.3, 0, -2.3]} scale={0.9} />
                </group>
            )
        case 'logistics':
            return (
                <group>
                    <Model url={M.shop[5]} position={[-1.2, 0, -1.3]} rotation={FRONT} scale={1.4} />
                    <Model url={M.shop[6]} position={[1.5, 0, -1.5]} rotation={FRONT} scale={1.15} />
                    <Model url={M.cars[3]} position={[1.6, 0.08, 0.9]} rotation={Math.PI / 2} scale={CAR_SCALE * 1.4} />
                    <Model url={M.cars[5]} position={[-0.8, 0.08, 1.0]} rotation={Math.PI / 2} scale={CAR_SCALE * 1.4} />
                </group>
            )
        case 'arena':
            return (
                <group>
                    <Model url={M.skyscraper[2]} position={[-1.3, 0, -1.2]} rotation={FRONT} scale={1.2} />
                    <Model url={M.shop[7]} position={[1.4, 0, -1.4]} rotation={FRONT} scale={1.25} />
                    {/* Big screen */}
                    <group position={[1.6, 0, 1.2]} rotation={[0, -0.4, 0]}>
                        <mesh position={[0, 0.55, 0]} castShadow><boxGeometry args={[0.08, 1.1, 0.08]} /><meshStandardMaterial color="#4b5563" /></mesh>
                        <mesh position={[0, 1.15, 0]} castShadow><boxGeometry args={[1.4, 0.8, 0.08]} /><meshStandardMaterial color="#4b5563" /></mesh>
                        <mesh position={[0, 1.15, 0.045]}><planeGeometry args={[1.28, 0.68]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} /></mesh>
                        <mesh position={[0, 1.15, -0.045]} rotation={[0, Math.PI, 0]}><planeGeometry args={[1.28, 0.68]} /><meshStandardMaterial color="#102A43" emissive="#102A43" emissiveIntensity={0.4} /></mesh>
                    </group>
                </group>
            )
        case 'trophy':
            return <Trophy color={color} />
        default:
            return <Model url={M.shop[3]} position={[0, 0, -1]} rotation={FRONT} scale={1.6} />
    }
}

const MARKER_HEIGHT: Record<Slot['style'], number> = { market: 2.3, tower: 5.2, logistics: 2.6, arena: 3.9, trophy: 2.6, plaza: 2.3 }
/** Marker sits over the main building (local z, before rotation). */
const MARKER_Z: Record<Slot['style'], number> = { market: -1.4, tower: -0.9, logistics: -1.3, arena: -1.2, trophy: 0, plaza: -1 }

function Landmark({ zone, slot, color, onTapBuilding, onTapMarker }: {
    zone: CityZone; slot: Slot; color: string; onTapBuilding: () => void; onTapMarker: () => void
})
{
    const cx = (slot.x0 + slot.x1) / 2 - N / 2
    const cz = slot.style === 'trophy' ? wx(CENTER) : ((slot.z0 + slot.z1) / 2 - N / 2) + (slot.facing === 0 ? 0.5 : -0.5)
    const isIsland = slot.style === 'trophy'
    const done = zone.total > 0 && zone.done === zone.total
    return (
        <group position={[isIsland ? wx(CENTER) : cx, 0, cz]}>
            {!isIsland && (
                <mesh position={[0, 0.02, 0]} receiveShadow>
                    <boxGeometry args={[6, 0.04, 6]} />
                    <meshStandardMaterial color="#dcd6c8" />
                </mesh>
            )}
            <group
                rotation={[0, slot.facing, 0]}
                onClick={(e) => { if (e.delta > 6) return; e.stopPropagation(); onTapBuilding() }}
                onPointerOver={() => { document.body.style.cursor = 'pointer' }}
                onPointerOut={() => { document.body.style.cursor = '' }}
            >
                <LandmarkBody slot={slot} color={color} />
            </group>
            <Html
                position={[MARKER_Z[slot.style] * Math.sin(slot.facing), MARKER_HEIGHT[slot.style], MARKER_Z[slot.style] * Math.cos(slot.facing)]}
                center
                distanceFactor={10}
                zIndexRange={[30, 0]}
            >
                <button
                    type="button"
                    onClick={onTapMarker}
                    className="flex flex-col items-center gap-1 select-none"
                    style={{ transform: 'translateY(-50%)' }}
                >
                    <span
                        className="flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-white text-lg shadow-lg"
                        style={{ backgroundColor: done ? '#16a34a' : color }}
                    >
                        {done ? '✓' : MARKER_EMOJI[slot.style]}
                    </span>
                    <span className="whitespace-nowrap rounded-full bg-[#102A43]/90 px-3 py-1 text-[13px] font-bold text-white shadow-md">
                        {zone.label}{zone.total > 0 ? ` · ${zone.done}/${zone.total}` : ''}
                    </span>
                </button>
            </Html>
        </group>
    )
}

const MARKER_EMOJI: Record<Slot['style'], string> = { market: '🛍️', tower: '🎓', logistics: '🚚', arena: '🎤', trophy: '🏆', plaza: '📍' }

// ─── Decor ───────────────────────────────────────────────────────────────────

function Decor({ items }: { items: DecorItem[] })
{
    return (
        <group>
            {items.map((d, i) =>
            {
                const p = at(d.x, d.z)
                switch (d.kind)
                {
                    case 'palm': return <Model key={i} url={M.palm} position={p} rotation={d.rot} scale={0.75} />
                    case 'palmTall': return <Model key={i} url={M.palmTall} position={p} rotation={d.rot} scale={0.85} />
                    case 'palmBend': return <Model key={i} url={M.palmTall} position={p} rotation={d.rot} scale={0.75} />
                    case 'bush': return <Model key={i} url={M.bush} position={p} rotation={d.rot} scale={0.6} />
                    case 'flower': return <Model key={i} url={M.flower[d.variant % 2]} position={p} rotation={d.rot} scale={0.8} shadow={false} />
                    case 'house': return <Model key={i} url={M.house[d.variant % M.house.length]} position={p} rotation={d.rot + FRONT} scale={0.75} />
                    case 'shop': return <Model key={i} url={M.shop[d.variant % M.shop.length]} position={p} rotation={d.rot + FRONT} scale={0.95} />
                    case 'tall': return <Model key={i} url={M.tall[d.variant % M.tall.length]} position={p} rotation={d.rot + FRONT} scale={0.7} />
                    case 'light': return <Model key={i} url={M.light} position={[p[0], 0, p[2] + 0.4]} rotation={Math.PI} scale={1.1} />
                }
            })}
        </group>
    )
}

// ─── Cars on the ring road ───────────────────────────────────────────────────

function Car({ url, offset, speed }: { url: string; offset: number; speed: number })
{
    const ref = useRef<THREE.Group>(null)
    const { scene } = useGLTF(url)
    const seg = useMemo(() =>
    {
        const pts = CAR_LOOP
        const lens = pts.map((p, i) => { const q = pts[(i + 1) % pts.length]; return Math.hypot(q.x - p.x, q.z - p.z) })
        return { pts, lens, total: lens.reduce((a, b) => a + b, 0) }
    }, [])
    const t = useRef(offset * seg.total)
    useFrame((_, dt) =>
    {
        const g = ref.current
        if (!g) return
        t.current = (t.current + dt * speed) % seg.total
        let d = t.current, i = 0
        while (d > seg.lens[i]) { d -= seg.lens[i]; i++ }
        const p = seg.pts[i], q = seg.pts[(i + 1) % seg.pts.length]
        const f = d / seg.lens[i]
        const dx = q.x - p.x, dz = q.z - p.z, len = Math.hypot(dx, dz)
        // Keep left (Nigeria drives on the right → offset to the right of travel).
        const ox = (-dz / len) * 0.22, oz = (dx / len) * 0.22
        g.position.set(p.x + dx * f + ox, 0.08, p.z + dz * f + oz)
        const target = Math.atan2(dx, dz)
        g.rotation.y += Math.atan2(Math.sin(target - g.rotation.y), Math.cos(target - g.rotation.y)) * Math.min(1, dt * 8)
    })
    return <group ref={ref}><Clone object={scene} scale={CAR_SCALE} castShadow /></group>
}

// ─── Characters ──────────────────────────────────────────────────────────────

function useCharacter(url: string)
{
    const { scene, animations } = useGLTF(url)
    const model = useMemo(() =>
    {
        const c = cloneSkinned(scene)
        c.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true } })
        return c
    }, [scene])
    return { model, animations }
}

interface WorldState
{
    blocked: Uint8Array
    path: { x: number; z: number }[]
    keys: Set<string>
    inputEnabled: boolean
    insideDoor: string | null
    player: THREE.Vector3
}

function Player({ url, world, joystick, doors, onDoor }: {
    url: string
    world: React.MutableRefObject<WorldState>
    joystick: React.MutableRefObject<{ x: number; y: number }>
    doors: { key: string; x: number; z: number }[]
    onDoor: (key: string) => void
})
{
    const group = useRef<THREE.Group>(null)
    const { model, animations } = useCharacter(url)
    const { actions } = useAnimations(animations, group)
    const moving = useRef(false)
    const camera = useThree((s) => s.camera)
    const fwd = useMemo(() => new THREE.Vector3(), [])
    const right = useMemo(() => new THREE.Vector3(), [])

    useEffect(() => { actions.idle?.reset().fadeIn(0.2).play() }, [actions])

    useFrame((_, rawDt) =>
    {
        const g = group.current
        if (!g) return
        const dt = Math.min(rawDt, 0.05)
        const w = world.current
        let vx = 0, vz = 0

        if (w.inputEnabled)
        {
            const k = w.keys
            const ix = (k.has('d') || k.has('arrowright') ? 1 : 0) - (k.has('a') || k.has('arrowleft') ? 1 : 0) + joystick.current.x
            const iy = (k.has('s') || k.has('arrowdown') ? 1 : 0) - (k.has('w') || k.has('arrowup') ? 1 : 0) + joystick.current.y
            if (ix || iy)
            {
                // Screen-relative: "up" walks away from the camera.
                camera.getWorldDirection(fwd); fwd.y = 0; fwd.normalize()
                right.crossVectors(fwd, THREE.Object3D.DEFAULT_UP).normalize()
                vx = right.x * ix - fwd.x * iy
                vz = right.z * ix - fwd.z * iy
                w.path = []
            } else if (w.path.length)
            {
                const n = w.path[0]
                const dx = wx(n.x) - g.position.x, dz = wx(n.z) - g.position.z
                if (Math.hypot(dx, dz) < 0.08) w.path.shift()
                else { vx = dx; vz = dz }
            }
        }

        const len = Math.hypot(vx, vz)
        if (len > 0.001)
        {
            const step = Math.min(PLAYER_SPEED * dt * Math.min(1, len > 1 ? 1 : Math.max(len, 0.6)), w.path.length ? Math.hypot(vx, vz) : Infinity)
            const nx = g.position.x + (vx / len) * step, nz = g.position.z + (vz / len) * step
            const ok = (x: number, z: number) => { const tx = worldToTile(x), tz = worldToTile(z); return inside(tx, tz) && !w.blocked[idx(tx, tz)] }
            if (ok(nx, nz)) g.position.set(nx, 0, nz)
            else if (ok(nx, g.position.z)) g.position.x = nx
            else if (ok(g.position.x, nz)) g.position.z = nz
            const target = Math.atan2(vx, vz)
            g.rotation.y += Math.atan2(Math.sin(target - g.rotation.y), Math.cos(target - g.rotation.y)) * Math.min(1, dt * 12)
            if (!moving.current) { moving.current = true; actions.idle?.fadeOut(0.15); actions.walk?.reset().fadeIn(0.15).play() }
        } else if (moving.current)
        {
            moving.current = false
            actions.walk?.fadeOut(0.2); actions.idle?.reset().fadeIn(0.2).play()
        }
        w.player.copy(g.position)

        // Door check: fire once when stepping onto a door tile.
        const tx = worldToTile(g.position.x), tz = worldToTile(g.position.z)
        const hit = doors.find((d) => d.x === tx && d.z === tz)
        if (hit && hit.key !== w.insideDoor && w.inputEnabled)
        {
            w.insideDoor = hit.key
            w.path = []
            onDoor(hit.key)
        } else if (!hit) w.insideDoor = null
    })

    return (
        <group ref={group} position={[world.current.player.x, 0, world.current.player.z]}>
            <primitive object={model} scale={CHAR_SCALE} />
            <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.2, 0.26, 32]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.85} />
            </mesh>
        </group>
    )
}

/** Wandering townspeople. */
function Npc({ url, world, seed }: { url: string; world: React.MutableRefObject<WorldState>; seed: number })
{
    const group = useRef<THREE.Group>(null)
    const { model, animations } = useCharacter(url)
    const { actions } = useAnimations(animations, group)
    const state = useRef({ path: [] as { x: number; z: number }[], wait: 1 + (seed % 3), moving: false, r: seed * 9301 + 49297 })
    const start = useMemo(() => nearestFree(world.current.blocked, 3 + (seed * 5) % 15, 3 + (seed * 7) % 15), [world, seed])

    useEffect(() => { actions.idle?.play() }, [actions])

    useFrame((_, rawDt) =>
    {
        const g = group.current
        if (!g) return
        const dt = Math.min(rawDt, 0.05)
        const s = state.current
        if (!s.path.length)
        {
            if (s.moving) { s.moving = false; actions.walk?.fadeOut(0.2); actions.idle?.reset().fadeIn(0.2).play() }
            s.wait -= dt
            if (s.wait <= 0)
            {
                s.r = (s.r * 1664525 + 1013904223) >>> 0
                const tx = 3 + (s.r % (N - 6)), tz = 3 + ((s.r >> 8) % (N - 6))
                const target = nearestFree(world.current.blocked, tx, tz)
                s.path = findPath(world.current.blocked, worldToTile(g.position.x), worldToTile(g.position.z), target.x, target.z)?.slice(1) ?? []
                s.wait = 2 + (s.r % 4)
            }
            return
        }
        const n = s.path[0]
        const dx = wx(n.x) - g.position.x, dz = wx(n.z) - g.position.z
        const d = Math.hypot(dx, dz)
        if (d < 0.08) { s.path.shift(); return }
        const step = Math.min(d, 1.3 * dt)
        g.position.x += (dx / d) * step
        g.position.z += (dz / d) * step
        const target = Math.atan2(dx, dz)
        g.rotation.y += Math.atan2(Math.sin(target - g.rotation.y), Math.cos(target - g.rotation.y)) * Math.min(1, dt * 10)
        if (!s.moving) { s.moving = true; actions.idle?.fadeOut(0.2); actions.walk?.reset().fadeIn(0.2).play() }
    })

    return <group ref={group} position={[wx(start.x), 0, wx(start.z)]}><primitive object={model} scale={CHAR_SCALE} /></group>
}

// ─── Camera ──────────────────────────────────────────────────────────────────

function CameraRig({ world, recenter }: { world: React.MutableRefObject<WorldState>; recenter: number })
{
    const controls = useRef<OrbitControlsImpl>(null)
    const camera = useThree((s) => s.camera)
    const last = useRef(new THREE.Vector3())
    const delta = useMemo(() => new THREE.Vector3(), [])

    useEffect(() =>
    {
        const p = world.current.player
        camera.position.set(p.x + 7, 13, p.z + 13)
        controls.current?.target.copy(p)
        last.current.copy(p)
        controls.current?.update()
    }, [camera, world, recenter])

    useFrame((_, dt) =>
    {
        const c = controls.current
        if (!c) return
        // Follow the player: move target and camera together so the user's zoom/rotation is kept.
        delta.copy(world.current.player).sub(c.target).multiplyScalar(Math.min(1, dt * 4))
        c.target.add(delta)
        camera.position.add(delta)
        c.update()
    })

    return (
        <OrbitControls
            ref={controls}
            makeDefault
            enablePan={false}
            enableDamping
            minDistance={6}
            maxDistance={30}
            minPolarAngle={0.45}
            maxPolarAngle={1.15}
            rotateSpeed={0.6}
        />
    )
}

// ─── Loading / errors ────────────────────────────────────────────────────────

function ReadyWatcher({ onReady }: { onReady: () => void })
{
    const { active, progress } = useProgress()
    const fired = useRef(false)
    useEffect(() => { if (!active && progress >= 100 && !fired.current) { fired.current = true; onReady() } }, [active, progress, onReady])
    // Also fire once mounted (everything cached → no progress events).
    useEffect(() => { const t = setTimeout(() => { if (!fired.current) { fired.current = true; onReady() } }, 50); return () => clearTimeout(t) }, [onReady])
    return null
}

class SceneErrorBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }>
{
    state = { failed: false }
    static getDerivedStateFromError() { return { failed: true } }
    componentDidCatch() { this.props.onError() }
    render() { return this.state.failed ? null : this.props.children }
}

// ─── Scene root ──────────────────────────────────────────────────────────────

export default function CityScene(props: CitySceneProps)
{
    const { zones, character, themeColor, paused, onZoneEnter, onReady, onError, joystick, keys, recenter } = props
    const placed = useMemo(() => assignSlots(zones), [zones])

    // Static world: blocked tiles, doors, decor (depends only on which slots are used).
    const slotKey = placed.map((p) => `${p.zone.key}:${p.slot.style}`).join('|')
    const { blocked, doors, decor } = useMemo(() =>
    {
        const blocked = new Uint8Array(N * N)
        const occupiedBy = (x: number, z: number) => placed.some(({ slot }) => slot.style !== 'trophy' && x >= slot.x0 && x < slot.x1 && z >= Math.min(slot.z0, slot.door.z) && z <= Math.max(slot.z1 - 1, slot.door.z))
        for (const { slot } of placed)
        {
            if (slot.style === 'trophy') continue
            // Building rows (everything except the walkway row with the door).
            for (let z = slot.z0; z < slot.z1; z++) for (let x = slot.x0; x < slot.x1; x++)
                if (z !== slot.door.z) blocked[idx(x, z)] = 1
        }
        const decor = buildDecor(occupiedBy)
        for (const d of decor) if (d.kind !== 'flower') blocked[idx(d.x, d.z)] = 1
        // Map edges are scenery.
        for (let i = 0; i < N; i++) { blocked[idx(i, 0)] = blocked[idx(i, N - 1)] = blocked[idx(0, i)] = blocked[idx(N - 1, i)] = 1 }
        const doors = placed.map(({ zone, slot }) => ({ key: zone.key, x: slot.door.x, z: slot.door.z }))
        return { blocked, doors, decor }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slotKey])

    const world = useRef<WorldState>({
        blocked,
        path: [],
        keys: keys.current,
        inputEnabled: true,
        insideDoor: null,
        player: new THREE.Vector3(wx(CENTER - 3), 0, wx(CENTER)),
    })
    world.current.blocked = blocked
    world.current.inputEnabled = !paused

    const walkTo = (tx: number, tz: number) =>
    {
        const w = world.current
        const target = nearestFree(w.blocked, tx, tz)
        const path = findPath(w.blocked, worldToTile(w.player.x), worldToTile(w.player.z), target.x, target.z)
        if (path) w.path = path.slice(1)
    }

    const onTapGround = (e: ThreeEvent<MouseEvent>) =>
    {
        if (e.delta > 6 || paused) return
        walkTo(worldToTile(e.point.x), worldToTile(e.point.z))
    }

    const npcChars = useMemo(() => CHARACTERS.map((_, i) => i).filter((i) => i !== character).slice(0, 5), [character])

    return (
        <SceneErrorBoundary onError={onError}>
            <Canvas
                shadows
                dpr={[1, 1.75]}
                camera={{ fov: 40, near: 0.1, far: 200, position: [8, 10, 12] }}
                gl={{ antialias: true, powerPreference: 'high-performance' }}
                onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping }}
            >
                <color attach="background" args={['#bfe6f7']} />
                <fog attach="fog" args={['#bfe6f7', 22, 48]} />
                <ambientLight intensity={0.55} />
                <hemisphereLight args={['#ffffff', '#9fd18a', 1.1]} />
                <directionalLight
                    position={[8, 14, 6]}
                    intensity={1.35}
                    castShadow
                    shadow-mapSize={[1024, 1024]}
                    shadow-camera-left={-14}
                    shadow-camera-right={14}
                    shadow-camera-top={14}
                    shadow-camera-bottom={-14}
                    shadow-bias={-0.0005}
                    shadow-normalBias={0.02}
                />
                <Suspense fallback={null}>
                    <Ground onTap={onTapGround} />
                    <Roads />
                    <Decor items={decor} />
                    {placed.map(({ zone, slot }) => (
                        <Landmark
                            key={zone.key}
                            zone={zone}
                            slot={slot}
                            color={themeColor}
                            onTapBuilding={() => { if (!paused) { world.current.insideDoor = null; walkTo(slot.door.x, slot.door.z) } }}
                            onTapMarker={() => { if (!paused) onZoneEnter(zone.key) }}
                        />
                    ))}
                    <Car url={M.cars[0]} offset={0} speed={2.2} />
                    <Car url={M.cars[1]} offset={0.33} speed={1.8} />
                    <Car url={M.cars[0]} offset={0.6} speed={2.0} />
                    <Car url={M.cars[2]} offset={0.82} speed={2.4} />
                    {npcChars.map((c, i) => <Npc key={c} url={characterModelUrl(c)} world={world} seed={i + 1} />)}
                    <Player url={characterModelUrl(character)} world={world} joystick={joystick} doors={doors} onDoor={onZoneEnter} />
                    <ReadyWatcher onReady={onReady} />
                </Suspense>
                <CameraRig world={world} recenter={recenter} />
            </Canvas>
        </SceneErrorBoundary>
    )
}
