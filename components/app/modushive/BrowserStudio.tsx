'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
    Activity,
    Camera,
    CameraOff,
    Check,
    Clock,
    Copy,
    ExternalLink,
    Loader2,
    Mic,
    MicOff,
    MonitorUp,
    Radio,
    Settings2,
    Square,
    Users,
    Volume2,
    Wifi,
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
    streamDescription?: string | null
    initialStatus: 'idle' | 'live' | 'ended'
    chatChannelId?: string | null
    hostId?: string
}

export function BrowserStudio({
    liveStreamId,
    streamTitle,
    streamDescription,
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
    const [isSharingScreen, setIsSharingScreen] = useState(false)
    const [audioLevel, setAudioLevel] = useState(0) // 0 to 100
    const [duration, setDuration] = useState(0)
    const [showEndModal, setShowEndModal] = useState(false)
    const [isEnding, startEndingTransition] = useTransition()
    const [copiedLink, setCopiedLink] = useState(false)

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
        if (!newState) setAudioLevel(0)
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

            setIsSharingScreen(true)

            // If live, replace video track on PeerConnection
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
                setIsSharingScreen(false)
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

            // Mark stream as live in database
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
            if (pcRef.current) {
                pcRef.current.close()
                pcRef.current = null
            }

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

    function copyStreamUrl() {
        if (typeof window === 'undefined') return
        const url = `${window.location.origin}/app/modushive/live/${liveStreamId}`
        navigator.clipboard.writeText(url)
        setCopiedLink(true)
        toast.success('Stream link copied to clipboard!')
        setTimeout(() => setCopiedLink(false), 2000)
    }

    function formatTime(sec: number) {
        const h = Math.floor(sec / 3600)
        const m = Math.floor((sec % 3600) / 60)
        const s = sec % 60
        return `${h > 0 ? String(h).padStart(2, '0') + ':' : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    }

    const hasLiveChat = Boolean(chatChannelId && status !== 'ended')

    return (
        <div className={hasLiveChat ? 'grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px] items-start' : 'space-y-6'}>
            {/* Left Column: Broadcaster Deck & Video Monitor */}
            <div className="space-y-5 min-w-0">
                {/* Main Video Monitor */}
                <div
                    className={`relative aspect-video w-full overflow-hidden rounded-3xl border bg-black shadow-2xl transition-all duration-300 ${
                        status === 'live'
                            ? 'border-destructive/40 ring-2 ring-destructive/20 shadow-[0_0_50px_-10px_rgba(239,68,68,0.25)]'
                            : 'border-border/80 ring-1 ring-border/40'
                    }`}
                >
                    {/* Local Video Preview */}
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`h-full w-full object-cover transition-opacity duration-300 ${
                            videoEnabled ? 'opacity-100' : 'opacity-0'
                        }`}
                    />

                    {/* Camera Off Placeholder */}
                    {!videoEnabled && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/95 text-muted-foreground">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 border border-white/10 text-muted-foreground/60 shadow-inner">
                                <CameraOff className="h-7 w-7" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-semibold text-foreground">Camera is turned off</p>
                                <p className="text-xs text-muted-foreground/80 mt-0.5">Click the camera icon below to resume video</p>
                            </div>
                        </div>
                    )}

                    {/* Permission Request Placeholder */}
                    {hasPermissions === false && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card/95 p-6 text-center text-foreground">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                                <Camera className="h-7 w-7" />
                            </div>
                            <h3 className="text-base font-bold">Camera & Microphone Access Required</h3>
                            <p className="max-w-md text-xs text-muted-foreground">
                                Please allow browser access to your webcam and microphone to broadcast directly from this studio tab.
                            </p>
                        </div>
                    )}

                    {/* Top Badges Overlay */}
                    <div className="absolute top-3.5 left-3.5 right-3.5 sm:top-4 sm:left-4 sm:right-4 flex items-center justify-between pointer-events-none z-10">
                        <div className="flex items-center gap-2 flex-wrap">
                            {status === 'live' ? (
                                <>
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-lg animate-pulse">
                                        <Radio className="h-3.5 w-3.5" /> LIVE • {formatTime(duration)}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/65 backdrop-blur-md border border-white/10 px-3 py-1 text-xs font-semibold text-white/95">
                                        <span className="relative flex h-2 w-2">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald opacity-75" />
                                            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald" />
                                        </span>
                                        <span>{viewerCount} {viewerCount === 1 ? 'Viewer' : 'Viewers'}</span>
                                    </span>
                                    <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-black/65 backdrop-blur-md border border-white/10 px-2.5 py-1 text-[11px] font-medium text-emerald">
                                        <Wifi className="h-3 w-3" />
                                        HD WebRTC
                                    </span>
                                </>
                            ) : status === 'connecting' ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-lg">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Connecting to Broadcast...
                                </span>
                            ) : status === 'ended' ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 px-3 py-1 text-xs font-semibold text-white/70">
                                    Broadcast Ended
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/65 backdrop-blur-md border border-white/10 px-3 py-1 text-xs font-semibold text-white/95">
                                    📹 Studio Preview (Off-Air)
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2 pointer-events-auto">
                            <button
                                type="button"
                                onClick={copyStreamUrl}
                                className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-black/65 backdrop-blur-md border border-white/10 px-3 py-1 text-xs font-semibold text-white/90 hover:bg-black/85 transition-colors"
                                title="Copy public watch URL"
                            >
                                {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald" /> : <Copy className="h-3.5 w-3.5" />}
                                <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                            </button>

                            <a
                                href={`/app/modushive/live/${liveStreamId}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-full bg-black/65 backdrop-blur-md border border-white/10 px-3 py-1 text-xs font-semibold text-white/90 hover:bg-black/85 transition-colors"
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Watch Page</span>
                            </a>
                        </div>
                    </div>

                    {/* Bottom Control Dock Overlay */}
                    <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 flex flex-wrap items-center justify-between gap-2.5 rounded-2xl bg-slate-950/80 backdrop-blur-xl border border-white/15 p-2 sm:p-2.5 text-white shadow-2xl z-10">
                        {/* Media Toggles */}
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            {/* Mic Toggle */}
                            <button
                                type="button"
                                onClick={toggleMic}
                                className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full transition-all ${
                                    audioEnabled
                                        ? 'bg-white/15 hover:bg-white/25 text-white ring-1 ring-white/10'
                                        : 'bg-destructive text-white ring-2 ring-destructive/50'
                                }`}
                                title={audioEnabled ? 'Mute microphone' : 'Unmute microphone'}
                            >
                                {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                            </button>

                            {/* Camera Toggle */}
                            <button
                                type="button"
                                onClick={toggleCamera}
                                className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full transition-all ${
                                    videoEnabled
                                        ? 'bg-white/15 hover:bg-white/25 text-white ring-1 ring-white/10'
                                        : 'bg-destructive text-white ring-2 ring-destructive/50'
                                }`}
                                title={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
                            >
                                {videoEnabled ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
                            </button>

                            {/* Screen Share */}
                            <button
                                type="button"
                                onClick={shareScreen}
                                className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full transition-all ${
                                    isSharingScreen
                                        ? 'bg-primary text-white ring-2 ring-primary/50'
                                        : 'bg-white/15 hover:bg-white/25 text-white ring-1 ring-white/10'
                                }`}
                                title={isSharingScreen ? 'Sharing screen (Click to manage)' : 'Share Screen'}
                            >
                                <MonitorUp className="h-4 w-4" />
                            </button>

                            {/* Audio VU Mini Meter */}
                            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/10 ring-1 ring-white/10">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">Mic</span>
                                <div className="h-2 w-14 overflow-hidden rounded-full bg-white/20">
                                    <div
                                        className={`h-full transition-all duration-75 ${
                                            !audioEnabled
                                                ? 'w-0'
                                                : audioLevel > 75
                                                ? 'bg-destructive'
                                                : audioLevel > 40
                                                ? 'bg-amber-400'
                                                : 'bg-emerald'
                                        }`}
                                        style={{ width: `${audioEnabled ? audioLevel : 0}%` }}
                                    />
                                </div>
                            </div>

                            {/* Device Settings Toggle */}
                            <button
                                type="button"
                                onClick={() => setShowSettings((s) => !s)}
                                className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full transition-all ${
                                    showSettings
                                        ? 'bg-primary text-white ring-2 ring-primary/50'
                                        : 'bg-white/15 hover:bg-white/25 text-white ring-1 ring-white/10'
                                }`}
                                title="Device & Audio Settings"
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
                                            className="inline-flex items-center gap-2 rounded-full bg-destructive px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
                                        >
                                            {isEnding ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Square className="h-4 w-4 fill-current" />
                                            )}
                                            <span>End Broadcast</span>
                                        </button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="rounded-3xl max-w-md">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle className="text-lg font-bold text-foreground">
                                                End this live stream?
                                            </AlertDialogTitle>
                                            <AlertDialogDescription className="text-sm text-muted-foreground">
                                                This will stop your camera broadcast for all viewers. The recording will automatically process into a replay video on your profile.
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
                                <span className="text-xs font-medium text-white/70 px-3 py-1 rounded-full bg-white/10">
                                    Stream Ended
                                </span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={startBroadcasting}
                                    disabled={status === 'connecting' || hasPermissions === false}
                                    className="inline-flex items-center gap-2 rounded-full bg-destructive px-5 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg transition-all hover:bg-destructive/90 hover:scale-105 active:scale-95 disabled:opacity-50"
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
                    <div className="grid gap-3.5 sm:grid-cols-2 rounded-3xl border border-border/80 bg-card/95 p-4 sm:p-5 shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <Camera className="h-3.5 w-3.5 text-primary" /> Camera Device
                            </label>
                            <select
                                value={selectedVideoId}
                                onChange={(e) => setSelectedVideoId(e.target.value)}
                                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                {videoDevices.map((d, i) => (
                                    <option key={d.deviceId} value={d.deviceId}>
                                        {d.label || `Camera ${i + 1}`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <Mic className="h-3.5 w-3.5 text-primary" /> Microphone Device
                            </label>
                            <select
                                value={selectedAudioId}
                                onChange={(e) => setSelectedAudioId(e.target.value)}
                                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
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

                {/* Broadcaster Performance Metrics Dashboard */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* Metric 1: Live Audience */}
                    <div className="rounded-2xl border border-border/80 bg-card/90 p-3.5 sm:p-4 backdrop-blur-md shadow-xs space-y-1">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Audience</span>
                            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald/10 text-emerald">
                                <Users className="h-3.5 w-3.5" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-xl sm:text-2xl font-extrabold text-foreground">{viewerCount}</span>
                            <span className="text-[11px] text-muted-foreground">{viewerCount === 1 ? 'viewer' : 'viewers'}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground/80 truncate">Active live watchers</p>
                    </div>

                    {/* Metric 2: Session Timer */}
                    <div className="rounded-2xl border border-border/80 bg-card/90 p-3.5 sm:p-4 backdrop-blur-md shadow-xs space-y-1">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Duration</span>
                            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Clock className="h-3.5 w-3.5" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-xl sm:text-2xl font-extrabold text-foreground tabular-nums">
                                {formatTime(duration)}
                            </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground/80 truncate">Up to 4h broadcast</p>
                    </div>

                    {/* Metric 3: Broadcast Health */}
                    <div className="rounded-2xl border border-border/80 bg-card/90 p-3.5 sm:p-4 backdrop-blur-md shadow-xs space-y-1">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Connection</span>
                            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-cyan/10 text-cyan">
                                <Activity className="h-3.5 w-3.5" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-base sm:text-lg font-bold text-foreground">
                                {status === 'live' ? 'Optimal' : status === 'connecting' ? 'Connecting' : 'Ready'}
                            </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground/80 truncate">WebRTC Ultra-Low Latency</p>
                    </div>

                    {/* Metric 4: Mic VU Level */}
                    <div className="rounded-2xl border border-border/80 bg-card/90 p-3.5 sm:p-4 backdrop-blur-md shadow-xs space-y-1">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Mic Sensitivity</span>
                            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                                <Volume2 className="h-3.5 w-3.5" />
                            </div>
                        </div>
                        <div className="flex items-center gap-1 h-7">
                            {[10, 25, 40, 55, 70, 85, 95].map((threshold) => (
                                <span
                                    key={threshold}
                                    className={`w-1 rounded-full transition-all duration-75 ${
                                        audioEnabled && audioLevel >= threshold
                                            ? threshold > 75
                                                ? 'bg-destructive h-5'
                                                : threshold > 45
                                                ? 'bg-amber-400 h-4'
                                                : 'bg-emerald h-3'
                                            : 'bg-muted-foreground/20 h-1'
                                    }`}
                                />
                            ))}
                        </div>
                        <p className="text-[10px] text-muted-foreground/80 truncate">
                            {audioEnabled ? `${audioLevel}% active level` : 'Microphone muted'}
                        </p>
                    </div>
                </div>

            </div>

            {/* Right Column: Sticky Live Stream Chat */}
            {hasLiveChat && (
                <aside className="w-full lg:sticky lg:top-20 lg:h-[calc(100dvh-7rem)] min-h-[460px]">
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

