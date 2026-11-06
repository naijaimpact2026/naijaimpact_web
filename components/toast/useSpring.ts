'use client'

import { useEffect, useRef, useState } from 'react'

interface SpringConfig
{
    stiffness?: number
    damping?: number
    mass?: number
    /** Below this combined displacement+velocity, the spring is considered settled and stops ticking. */
    precision?: number
}

/**
 * Damped harmonic oscillator driven by requestAnimationFrame — a real spring
 * integration (semi-implicit Euler), not a CSS easing curve standing in for
 * one. Retargeting mid-flight (e.g. the stack shifting again before a toast
 * settles) doesn't snap — velocity carries over into the new target, same as
 * a physical spring being redirected.
 */
export function useSpring(target: number, { stiffness = 180, damping = 20, mass = 1, precision = 0.4 }: SpringConfig = {}, initialValue?: number)
{
    const [value, setValue] = useState(initialValue ?? target)
    const valueRef = useRef(initialValue ?? target)
    const velocityRef = useRef(0)
    const targetRef = useRef(target)
    const frameRef = useRef<number | null>(null)
    const lastTimeRef = useRef<number | null>(null)

    targetRef.current = target

    useEffect(() =>
    {
        function step(time: number)
        {
            if (lastTimeRef.current == null) lastTimeRef.current = time
            const dt = Math.min((time - lastTimeRef.current) / 1000, 1 / 30)
            lastTimeRef.current = time

            const displacement = valueRef.current - targetRef.current
            const springForce = -stiffness * displacement
            const dampingForce = -damping * velocityRef.current
            const acceleration = (springForce + dampingForce) / mass

            velocityRef.current += acceleration * dt
            valueRef.current += velocityRef.current * dt

            const atRest = Math.abs(displacement) < precision && Math.abs(velocityRef.current) < precision

            if (atRest)
            {
                valueRef.current = targetRef.current
                velocityRef.current = 0
                setValue(valueRef.current)
                frameRef.current = null
                lastTimeRef.current = null
                return
            }

            setValue(valueRef.current)
            frameRef.current = requestAnimationFrame(step)
        }

        if (frameRef.current == null && Math.abs(valueRef.current - target) > precision)
        {
            lastTimeRef.current = null
            frameRef.current = requestAnimationFrame(step)
        }

        return () =>
        {
            if (frameRef.current != null)
            {
                cancelAnimationFrame(frameRef.current)
                frameRef.current = null
            }
        }
    }, [target, stiffness, damping, mass, precision])

    return value
}
