'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
    Camera,
    CameraOff,
    ExternalLink,
    Loader2,
    Mic,
    MicOff,
    MonitorUp,
    Radio,
    Settings2,
    Square,
    Users,
} from 'lucide-react'
import { toast } from '@/components/toast'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { endLiveStream, getLiveStreamKey, markLiveStreamActive } from '@/lib/actions/modushive'
import LiveChat from '@/components/app/modushive/LiveChat'

interface BrowserStudioProps {
    liveStreamId: string
    streamTitle: string
    initialStatus: 'idle' | 'live' | 'ended'
    chatChannelId?: string | null
    hostId?: string
}

export function BrowserStudio({
    liveStreamId,
    streamTitle,
    initialStatus,
    chatChannelId,
    hostId,
}: BrowserStudioProps) {
    const router = useRouter()
    const [viewerCount, setViewerCount] = useState(0)
    const videoRef = useRef<HTMLVideoElement>(null)
    const pcRef = useRef<RTCPeerConnection | null>(null)
    const localStreamRef = useRef<MediaStream | null>(null)
    const audioContextRef = useRef<AudioContext | null>(null)
    const animFrameRef = useRef<number | null>(null)

    const [status, setStatus] = useState<'idle' | 'connecting' | 'live' | 'ended'>(
        initialStatus === 'live' ? 'live' : initialStatus === 'ended' ? 'ended' : 'idle'
    )
    const [hasPermissions, setHasPermissions] = useState<boolean | null>(null)
    const [audioEnabled, setAudioEnabled] = useState(true)
    const [videoEnabled, setVideoEnabled] = useState(true)
    const [audioLevel, setAudioLevel] = useState(0) // 0 to 100 for VU meter
    const [duration, setDuration] = useState(0)
    const [showEndModal, setShowEndModal] = useState(false)
    const [isEnding, startEndingTransition] = useTransition()

    // Devices
    const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([])
    const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([])
    const [selectedVideoId, setSelectedVideoId] = useState<string>('')
    const [selectedAudioId, setSelectedAudioId] = useState<string>('')
    const [showSettings, setShowSettings] = useState(false)

    // Duration timer when live
    useEffect(() => {
        if (status !== 'live') return
        const interval = setInterval(() => setDuration((d) => d + 1), 1000)
        return () => clearInterval(interval)
    }, [status])

    // Initialize media capture
    useEffect(() => {
        let active = true

        async function initMedia(videoDeviceId?: string, audioDeviceId?: string) {
            try {
                // Stop existing tracks if any
                if (localStreamRef.current) {
                    localStreamRef.current.getTracks().forEach((t) => t.stop())
                }

                const stream = await navigator.mediaDevices.getUserMedia({
                    video: videoDeviceId
                        ? { deviceId: { exact: videoDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
                        : { width: { ideal: 1280 }, height: { ideal: 720 } },
                    audio: audioDeviceId ? { deviceId: { exact: audioDeviceId } } : true,
                })

                if (!active) {
                    stream.getTracks().forEach((t) => t.stop())
                    return
                }

                localStreamRef.current = stream

                if (videoRef.current) {
                    videoRef.current.srcObject = stream
                }

                setHasPermissions(true)

                // List devices
                const devices = await navigator.mediaDevices.enumerateDevices()
                setVideoDevices(devices.filter((d) => d.kind === 'videoinput'))
                setAudioDevices(devices.filter((d) => d.kind === 'audioinput'))

                // Set up audio VU meter
                try {
                    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
                    audioContextRef.current = audioContext
                    const analyser = audioContext.createAnalyser()
                    analyser.fftSize = 64
                    const source = audioContext.createMediaStreamSource(stream)
                    source.connect(analyser)

                    const dataArray = new Uint8Array(analyser.frequencyBinCount)

                    const updateMeter = () => {
                        analyser.getByteFrequencyData(dataArray)
                        let sum = 0
                        for (let i = 0; i < dataArray.length; i++) {
                            sum += dataArray[i]
                        }
                        const average = sum / dataArray.length
                        setAudioLevel(Math.min(100, Math.round((average / 128) * 100)))
                        animFrameRef.current = requestAnimationFrame(updateMeter)
                    }
                    updateMeter()
                } catch {
                    // AudioContext not supported or restricted, ignore VU meter
                }
            } catch (err) {
                console.error('[studio] getUserMedia error:', err)
                if (active) setHasPermissions(false)
            }
        }

        initMedia(selectedVideoId, selectedAudioId)

        return () => {
            active = false
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
            if (audioContextRef.current) audioContextRef.current.close().catch(() => {})
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((t) => t.stop())
            }
        }
    }, [selectedVideoId, selectedAudioId])


    // Toggle Mic
    function toggleMic() {
        if (!localStreamRef.current) return
        const audioTracks = localStreamRef.current.getAudioTracks()
        const newState = !audioEnabled
        audioTracks.forEach((t) => (t.enabled = newState))
        setAudioEnabled(newState)
    }

    // Toggle Camera
    function toggleCamera() {
        if (!localStreamRef.current) return
        const videoTracks = localStreamRef.current.getVideoTracks()
        const newState = !videoEnabled
        videoTracks.forEach((t) => (t.enabled = newState))
        setVideoEnabled(newState)
    }

    // Share Screen
    async function shareScreen() {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
            const screenTrack = screenStream.getVideoTracks()[0]

            if (!screenTrack || !localStreamRef.current) return

            // If we are currently live, replace the video track on the PeerConnection
            if (pcRef.current) {
                const senders = pcRef.current.getSenders()
                const sender = senders.find((s) => s.track?.kind === 'video')
                if (sender) {
                    sender.replaceTrack(screenTrack)
                }
            }

            if (videoRef.current) {
                videoRef.current.srcObject = screenStream
            }

            screenTrack.onended = () => {
                // Revert to camera
                if (localStreamRef.current && videoRef.current) {
                    const camTrack = localStreamRef.current.getVideoTracks()[0]
                    if (pcRef.current) {
                        const sender = pcRef.current.getSenders().find((s) => s.track?.kind === 'video')
                        if (sender && camTrack) sender.replaceTrack(camTrack)
                    }
                    videoRef.current.srcObject = localStreamRef.current
                }
            }
        } catch {
            // User cancelled screen picker
        }
    }

    // Broadcast via WHIP WebRTC
    async function startBroadcasting() {
        if (!localStreamRef.current) {
            toast.error('Camera & microphone are required to go live.')
            return
        }

        setStatus('connecting')

        try {
            // Get live stream credentials (includes WHIP URL)
            const creds = await getLiveStreamKey(liveStreamId)
            if (!creds.ok) {
                toast.error(creds.error)
                setStatus('idle')
                return
            }

            if (!creds.whipUrl) {
                toast.error('Streaming endpoint not ready. Please refresh and try again.')
                setStatus('idle')
                return
            }

            // Create WebRTC PeerConnection
            const pc = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }],
            })
            pcRef.current = pc

            // Add local audio and video tracks
            localStreamRef.current.getTracks().forEach((track) => {
                pc.addTrack(track, localStreamRef.current!)
            })

            // Create SDP Offer
            const offer = await pc.createOffer()
            await pc.setLocalDescription(offer)

            // Send WHIP handshake request
            const response = await fetch(creds.whipUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/sdp',
                },
                body: offer.sdp,
            })

            if (!response.ok) {
                throw new Error(`WHIP connection failed (status ${response.status})`)
            }

            // Handle SDP Answer from Cloudflare
            const answerSdp = await response.text()
            await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp })

            // Mark stream as live in Supabase
            await markLiveStreamActive(liveStreamId)

            setStatus('live')
            toast.success('You are LIVE! Viewers can now watch your stream.')
        } catch (err) {
            console.error('[studio] WHIP broadcasting failed:', err)
            toast.error('Failed to start live stream. Please check your camera connection.')
            setStatus('idle')
            if (pcRef.current) {
                pcRef.current.close()
                pcRef.current = null
            }
        }
    }

    // End stream
    function handleEndBroadcast() {
        startEndingTransition(async () => {
            // Stop WebRTC peer connection
            if (pcRef.current) {
                pcRef.current.close()
                pcRef.current = null
            }

            // End stream in database
            const res = await endLiveStream(liveStreamId)
            if (!res.ok) {
                toast.error(res.error)
                return
            }

            setStatus('ended')
            setShowEndModal(false)
            toast.success('Live stream ended. The recording will process into a replay.')
            router.refresh()
        })
    }

    function formatTime(sec: number) {
        const h = Math.floor(sec / 3600)
        const m = Math.floor((sec % 3600) / 60)
        const s = sec % 60
        return `${h > 0 ? String(h).padStart(2, '0') + ':' : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    }

    const hasLiveChat = Boolean(chatChannelId && status !== 'ended')

    return (
        <div className={hasLiveChat ? 'grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px] items-start' : 'space-y-4'}>
            <div className="space-y-4 min-w-0">
                {/* Main Video Monitor */}
            <div className="relative aspect-video w-full overflow-hidden rounded-3xl border border-border bg-black shadow-2xl">
                {/* Local Video Preview */}
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`h-full w-full object-cover transition-opacity duration-300 ${videoEnabled ? 'opacity-100' : 'opacity-0'}`}
                />

                {/* Camera Off Placeholder */}
                {!videoEnabled && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/90 text-muted-foreground">
                        <CameraOff className="h-10 w-10 text-muted-foreground/60" />
                        <p className="text-sm font-medium">Camera is turned off</p>
                    </div>
                )}

                {/* Permission Request Placeholder */}
                {hasPermissions === false && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card/95 p-6 text-center text-foreground">
                        <Camera className="h-10 w-10 text-destructive" />
                        <h3 className="text-base font-bold">Camera & Microphone Access Required</h3>
                        <p className="max-w-md text-xs text-muted-foreground">
                            Please allow browser access to your webcam and microphone to broadcast directly from this tab.
                        </p>
                    </div>
                )}

                {/* Top Badges Overlay */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                    <div className="flex items-center gap-2">
                        {status === 'live' ? (
                            <>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-lg animate-pulse">
                                    <Radio className="h-3.5 w-3.5" /> LIVE • {formatTime(duration)}
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-xs font-semibold text-white/90">
                                    <Users className="h-3.5 w-3.5 text-emerald" />
                                    <span>{viewerCount} {viewerCount === 1 ? 'viewer' : 'viewers'}</span>
                                </span>
                            </>
                        ) : status === 'connecting' ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-lg">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Connecting...
                            </span>
                        ) : status === 'ended' ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/80 px-3 py-1 text-xs font-semibold text-muted-foreground">
                                Broadcast Ended
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-xs font-semibold text-white/90">
                                📹 Studio Preview
                            </span>
                        )}
                    </div>

                    <a
                        href={`/app/modushive/live/${liveStreamId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-xs font-semibold text-white/90 hover:bg-black/80 transition-colors"
                    >
                        <ExternalLink className="h-3.5 w-3.5" /> View Public Page
                    </a>
                </div>

                {/* Bottom Control Bar Overlay */}
                <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-black/70 backdrop-blur-lg p-3 text-white">
                    {/* Media Toggles */}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={toggleMic}
                            className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                                audioEnabled ? 'bg-white/15 hover:bg-white/25 text-white' : 'bg-destructive text-white'
                            }`}
                            title={audioEnabled ? 'Mute microphone' : 'Unmute microphone'}
                        >
                            {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                        </button>

                        <button
                            type="button"
                            onClick={toggleCamera}
                            className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                                videoEnabled ? 'bg-white/15 hover:bg-white/25 text-white' : 'bg-destructive text-white'
                            }`}
                            title={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
                        >
                            {videoEnabled ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
                        </button>

                        <button
                            type="button"
                            onClick={shareScreen}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors"
                            title="Share Screen"
                        >
                            <MonitorUp className="h-4 w-4" />
                        </button>

                        {/* Audio VU Level Indicator */}
                        <div className="hidden sm:flex items-center gap-1.5 px-2">
                            <span className="text-[10px] uppercase tracking-wider text-white/60">Mic</span>
                            <div className="h-2 w-16 overflow-hidden rounded-full bg-white/20">
                                <div
                                    className="h-full bg-emerald transition-all duration-75"
                                    style={{ width: `${audioLevel}%` }}
                                />
                            </div>
                        </div>

                        {/* Device Settings Toggle */}
                        <button
                            type="button"
                            onClick={() => setShowSettings((s) => !s)}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors"
                            title="Device Settings"
                        >
                            <Settings2 className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Primary Action Button */}
                    <div className="flex items-center gap-2">
                        {status === 'live' ? (
                            <AlertDialog open={showEndModal} onOpenChange={setShowEndModal}>
                                <AlertDialogTrigger asChild>
                                    <button
                                        type="button"
                                        disabled={isEnding}
                                        className="inline-flex items-center gap-2 rounded-full bg-destructive px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-transform hover:scale-105 disabled:opacity-50"
                                    >
                                        {isEnding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
                                        End Broadcast
                                    </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-3xl max-w-md">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="text-lg font-bold text-foreground">
                                            End this live stream?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription className="text-sm text-muted-foreground">
                                            This will stop your camera broadcast for all viewers. The recording will automatically process into a replay video.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="gap-2 sm:gap-0">
                                        <AlertDialogCancel disabled={isEnding} className="rounded-full">
                                            Keep Streaming
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                            disabled={isEnding}
                                            onClick={(e) => {
                                                e.preventDefault()
                                                handleEndBroadcast()
                                            }}
                                            className="rounded-full bg-destructive text-white hover:bg-destructive/90"
                                        >
                                            {isEnding ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                                            End Broadcast
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        ) : status === 'ended' ? (
                            <p className="text-xs text-white/70">Stream has ended</p>
                        ) : (
                            <button
                                type="button"
                                onClick={startBroadcasting}
                                disabled={status === 'connecting' || hasPermissions === false}
                                className="inline-flex items-center gap-2 rounded-full bg-destructive px-6 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-destructive/90 hover:scale-105 disabled:opacity-50"
                            >
                                {status === 'connecting' ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" /> Connecting...
                                    </>
                                ) : (
                                    <>
                                        <Radio className="h-4 w-4" /> Go Live with Webcam
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Device Settings Drawer */}
            {showSettings && (
                <div className="grid gap-3 sm:grid-cols-2 rounded-2xl border border-border bg-card p-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Camera</label>
                        <select
                            value={selectedVideoId}
                            onChange={(e) => setSelectedVideoId(e.target.value)}
                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none"
                        >
                            {videoDevices.map((d, i) => (
                                <option key={d.deviceId} value={d.deviceId}>
                                    {d.label || `Camera ${i + 1}`}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Microphone</label>
                        <select
                            value={selectedAudioId}
                            onChange={(e) => setSelectedAudioId(e.target.value)}
                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none"
                        >
                            {audioDevices.map((d, i) => (
                                <option key={d.deviceId} value={d.deviceId}>
                                    {d.label || `Microphone ${i + 1}`}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            )}
            </div>

            {/* Studio Live Chat Panel */}
            {hasLiveChat && (
                <aside className="w-full lg:sticky lg:top-20 lg:h-[calc(100dvh-8.5rem)]">
                    <LiveChat
                        channelId={chatChannelId!}
                        hostId={hostId}
                        onWatcherCountChange={setViewerCount}
                    />
                </aside>
            )}
        </div>
    )
}
