'use client'

import { useState, useEffect, useRef, ReactNode } from 'react'
import Image from 'next/image'

// Scroll reveal component using Intersection Observer
interface RevealOnScrollProps {
  children: ReactNode
  className?: string
  delay?: number
}

function RevealOnScroll({ children, className = '', delay = 0 }: RevealOnScrollProps) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Add delay before revealing
          setTimeout(() => setIsVisible(true), delay)
          // Once revealed, stop observing
          if (ref.current) observer.unobserve(ref.current)
        }
      },
      {
        threshold: 0.1, // Trigger when 10% of element is visible
        rootMargin: '0px 0px -50px 0px', // Trigger slightly before element enters viewport
      }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [delay])

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${className} ${
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-8'
      }`}
    >
      {children}
    </div>
  )
}

// Tool data
const tools = [
  { name: 'Figma', badge: 'Design', url: 'https://www.figma.com/downloads/', icon: '/figma-icon.svg' },
  { name: 'Granola', badge: 'Meetings', url: 'https://www.granola.ai/', icon: '/granola-icon.png' },
  { name: 'Notion', badge: 'Docs', url: 'https://www.notion.so/desktop', icon: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png' },
  { name: 'Claude Code', badge: 'AI + Code', url: 'https://docs.anthropic.com/en/docs/claude-code/overview', icon: '/claude-icon.svg', isAnthropic: true },
  { name: 'Claude Cowork', badge: 'AI', url: 'https://claude.ai', icon: '/claude-icon.svg', isAnthropic: true },
  { name: 'Claude in Chrome', badge: 'Extension', url: 'https://chromewebstore.google.com/detail/claude/danfgnbmhechchnkmppangadakceohol', icon: '/claude-icon.svg', isAnthropic: true },
  { name: 'Obsidian', badge: 'Notes', url: 'https://obsidian.md/', icon: 'https://obsidian.md/images/obsidian-logo-gradient.svg' },
  { name: 'Cursor', badge: 'AI + Code', url: 'https://www.cursor.com/', icon: 'https://www.cursor.com/apple-touch-icon.png' },
  { name: 'Wispr Flow', badge: 'Voice', url: 'https://wisprflow.ai/', icon: '/wispr-icon.png' },
  { name: 'Granola MCP', badge: 'MCP', url: 'https://github.com/azap121/granola-claude-mcp', icon: '/granola-icon.png', isGitHub: true },
]

// Spotify podcasts
const spotifyShows = [
  { id: '3DpAbiHuflIjaQFjbHbQR9', name: 'Behind the Craft' },
  { id: '5qX1nRTaFsfWdmdj5JWO1G', name: 'AI and I' },
]

// YouTube videos
const youtubeVideos = [
  { id: 'HcLz3ikw-n0', name: 'Dive Club', desc: 'Designers who never stop learning' },
  { id: 'B5yDJAkz0rw', name: 'How I AI', desc: 'Practical AI workflows with live demos' },
]

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export default function Home() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [mounted, setMounted] = useState(false)
  const [showStickyHeader, setShowStickyHeader] = useState(false)
  const [heroScale, setHeroScale] = useState(0.6)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showAudioMenu, setShowAudioMenu] = useState(false)
  const [audioPlayerExpanded, setAudioPlayerExpanded] = useState(true)
  const [audioData, setAudioData] = useState<number[]>(new Array(25).fill(15))
  const videoRef = useRef<HTMLVideoElement>(null)
  const heroSectionRef = useRef<HTMLElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const animationRef = useRef<number | null>(null)
  const isPlayingRef = useRef(false)

  // Format time for audio player (mm:ss)
  const formatAudioTime = (time: number) => {
    const mins = Math.floor(time / 60)
    const secs = Math.floor(time % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Initialize audio analyser
  const initAudioAnalyser = () => {
    if (!audioRef.current || audioContextRef.current) return

    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 256
    analyser.smoothingTimeConstant = 0.4
    analyser.minDecibels = -90
    analyser.maxDecibels = -10

    const source = audioContext.createMediaElementSource(audioRef.current)
    source.connect(analyser)
    analyser.connect(audioContext.destination)

    audioContextRef.current = audioContext
    analyserRef.current = analyser
    sourceRef.current = source
  }

  // Update waveform visualization
  const updateWaveform = () => {
    if (!analyserRef.current || !isPlayingRef.current) {
      // Reset to static wave when not playing
      setAudioData(new Array(25).fill(15))
      return
    }

    const bufferLength = analyserRef.current.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    analyserRef.current.getByteFrequencyData(dataArray)

    // Map frequency data to 25 bars with better distribution
    const bars = 25
    const newData: number[] = []
    
    // Use logarithmic distribution for more natural frequency representation
    for (let i = 0; i < bars; i++) {
      // Focus on lower frequencies which have more energy in speech/music
      const startIdx = Math.floor(Math.pow(i / bars, 1.5) * bufferLength * 0.7)
      const endIdx = Math.floor(Math.pow((i + 1) / bars, 1.5) * bufferLength * 0.7)
      
      let sum = 0
      let count = 0
      for (let j = startIdx; j < endIdx && j < bufferLength; j++) {
        sum += dataArray[j]
        count++
      }
      
      const avg = count > 0 ? sum / count : 0
      // Scale to percentage with more dynamic range
      const scaled = (avg / 255) * 100
      // Add some base height and boost for visibility
      newData.push(Math.max(12, Math.min(95, scaled * 1.2 + 12)))
    }
    
    setAudioData(newData)
    animationRef.current = requestAnimationFrame(updateWaveform)
  }

  // Toggle play/pause
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        isPlayingRef.current = false
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
        }
        // Reset to static wave
        setAudioData(new Array(25).fill(15))
      } else {
        // Initialize analyser on first play
        initAudioAnalyser()
        if (audioContextRef.current?.state === 'suspended') {
          audioContextRef.current.resume()
        }
        audioRef.current.play()
        isPlayingRef.current = true
        animationRef.current = requestAnimationFrame(updateWaveform)
      }
      setIsPlaying(!isPlaying)
    }
  }

  // Handle seeking
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current && duration) {
      const rect = e.currentTarget.getBoundingClientRect()
      const percent = (e.clientX - rect.left) / rect.width
      audioRef.current.currentTime = percent * duration
    }
  }

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  // Target: Thursday, February 5, 2026 at 10:00 AM GMT
  const targetDate = new Date('2026-02-05T10:00:00Z').getTime()

  useEffect(() => {
    setMounted(true)

    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const distance = targetDate - now

      if (distance < 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 }
      }

      return {
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      }
    }

    setTimeLeft(calculateTimeLeft())
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000)

    // Scroll listener for sticky header, hero scale, and progress
    const handleScroll = () => {
      const scrollThreshold = 400 // Show after scrolling past the countdown section
      setShowStickyHeader(window.scrollY > scrollThreshold)

      // Calculate overall scroll progress (0 to 1)
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = Math.min(1, Math.max(0, window.scrollY / documentHeight))
      setScrollProgress(progress)

      // Calculate hero text scale based on scroll position
      if (heroSectionRef.current) {
        const rect = heroSectionRef.current.getBoundingClientRect()
        const windowHeight = window.innerHeight
        
        // Calculate progress: 0 when section enters viewport, 1 when centered
        const sectionTop = rect.top
        const heroProgress = Math.max(0, Math.min(1, 1 - (sectionTop / windowHeight)))
        
        // Scale from 0.6 to 1 based on scroll progress
        const scale = 0.6 + (heroProgress * 0.4)
        setHeroScale(scale)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    // Initial call to set values
    handleScroll()

    return () => {
      clearInterval(timer)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [targetDate])

  // Format time for sticky header
  const formatTime = (value: number) => String(value).padStart(2, '0')

  if (!mounted) return null

  return (
    <>
      {/* Full-screen video background */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="absolute w-full h-full object-cover"
          onEnded={() => {
            // Fallback: restart video if loop doesn't work
            if (videoRef.current) {
              videoRef.current.currentTime = 0
              videoRef.current.play()
            }
          }}
        >
          <source src="/background-video.mp4" type="video/mp4" />
        </video>
        {/* Subtle overlay for text readability */}
        <div 
          className="absolute inset-0" 
          style={{ background: 'rgba(12, 10, 9, 0.4)' }}
        />
      </div>

      {/* Sticky Header */}
      <div
        className={`fixed top-3 left-0 right-0 z-50 px-4 sm:px-6 transition-all duration-500 ease-out ${
          showStickyHeader
            ? 'translate-y-0 opacity-100'
            : '-translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="mx-auto max-w-3xl relative">
          {/* Scroll progress border */}
          <div 
            className="absolute -inset-[1px] rounded-lg overflow-hidden"
            style={{ borderRadius: '9px' }}
          >
            {/* Progress stroke - grows clockwise based on scroll */}
            <div 
              className="absolute inset-0 transition-all duration-150 ease-out"
              style={{
                background: `conic-gradient(from -90deg, var(--color-brand-orange) 0%, var(--color-brand-orange-light) ${scrollProgress * 100}%, transparent ${scrollProgress * 100}%)`,
              }}
            />
            {/* Glow effect */}
            <div 
              className="absolute inset-0 opacity-60 blur-sm transition-all duration-150 ease-out"
              style={{
                background: `conic-gradient(from -90deg, var(--color-brand-orange) 0%, var(--color-brand-orange-light) ${scrollProgress * 100}%, transparent ${scrollProgress * 100}%)`,
              }}
            />
          </div>
          
          <header
            className="relative backdrop-blur-xl rounded-lg"
            style={{
              background: 'rgba(12, 10, 9, 0.9)',
              borderRadius: '8px',
            }}
          >
          <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Logo symbol with fade-in transition */}
              <Image
                src="/ds-symbol.svg"
                alt="Datasite"
                width={28}
                height={28}
                className={`transition-all duration-700 delay-200 ${
                  showStickyHeader ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                }`}
              />
              <span
                className="text-sm sm:text-base font-medium"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Agentic Design Share Out
              </span>
            </div>
            <div
              className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
              style={{ fontFamily: 'var(--font-hoves-mono)', color: 'var(--color-text-tertiary)' }}
            >
              <span className="hidden sm:inline" style={{ color: 'var(--color-text-tertiary)', opacity: 0.6 }}>
                Starts in
              </span>
              <span style={{ color: 'var(--color-text-secondary)' }}>
                {formatTime(timeLeft.days)}d {formatTime(timeLeft.hours)}h {formatTime(timeLeft.minutes)}m {formatTime(timeLeft.seconds)}s
              </span>
            </div>
          </div>
        </header>
        </div>
      </div>

      <div className="relative min-h-screen">
        {/* Main container with responsive padding */}
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12 sm:py-16 md:py-24">

          {/* Header - responsive text sizes */}
          <RevealOnScroll>
            <header className="mb-10 sm:mb-16 text-center">
              {/* Datasite Logo */}
              <div className="flex justify-center mb-6 sm:mb-8">
                <Image
                  src="/ds-logo.svg"
                  alt="Datasite"
                  width={140}
                  height={32}
                  className="h-6 sm:h-8 w-auto"
                  priority
                />
              </div>
              <p className="micro-label mb-3 sm:mb-4 text-[10px] sm:text-xs">Product × Design × Engineering</p>
              <h1
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-3 sm:mb-4"
                style={{ fontFamily: 'var(--font-sigla)' }}
              >
                <span className="gradient-text">Agentic Design</span>
                <br />
                Share Out
              </h1>
              <p className="text-base sm:text-lg" style={{ color: 'var(--color-text-secondary)' }}>
                A perspective on builders&apos; AI workflow, open for discussion
              </p>
            </header>
          </RevealOnScroll>

          {/* Countdown - responsive sizing */}
          <RevealOnScroll delay={100}>
            <section className="mb-10 sm:mb-16">
              <div className="glass rounded-xl sm:rounded-2xl p-5 sm:p-8 md:p-10 text-center">
                <p className="micro-label mb-4 sm:mb-6 text-[10px] sm:text-xs">Starting in</p>

                <div className="flex justify-center gap-3 sm:gap-4 md:gap-8 mb-4 sm:mb-6">
                  {[
                    { value: timeLeft.days, label: 'Days', shortLabel: 'D' },
                    { value: timeLeft.hours, label: 'Hours', shortLabel: 'H' },
                    { value: timeLeft.minutes, label: 'Min', shortLabel: 'M' },
                    { value: timeLeft.seconds, label: 'Sec', shortLabel: 'S' },
                  ].map((item) => (
                    <div key={item.label} className="text-center min-w-[50px] sm:min-w-[60px]">
                      <div
                        className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold gradient-text"
                        style={{ fontFamily: 'var(--font-hoves-mono)' }}
                      >
                        {String(item.value).padStart(2, '0')}
                      </div>
                      <div
                        className="text-[10px] sm:text-xs uppercase tracking-wider sm:tracking-widest mt-1 sm:mt-2"
                        style={{ color: 'var(--color-text-tertiary)' }}
                      >
                        <span className="hidden sm:inline">{item.label}</span>
                        <span className="sm:hidden">{item.shortLabel}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-sm sm:text-base" style={{ color: 'var(--color-text-secondary)' }}>
                  Thursday, February 5 · 10:00 AM GMT
                </p>
              </div>
            </section>
          </RevealOnScroll>

          {/* Tools Grid - responsive columns */}
          <RevealOnScroll delay={50}>
            <section className="mb-10 sm:mb-16">
            <h2 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">Get Set Up</h2>
            <p className="text-xs sm:text-sm mb-4 sm:mb-6" style={{ color: 'var(--color-text-tertiary)' }}>
              All optional — install what interests you
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
              {tools.map((tool) => (
                <a
                  key={tool.name}
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass rounded-lg sm:rounded-xl p-3 sm:p-4 flex flex-col items-center gap-2 sm:gap-3 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  style={{ borderColor: 'transparent' }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-brand-orange)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
                >
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center ${tool.isAnthropic ? 'bg-[#cc785c]' : ''}`}>
                    {tool.isAnthropic ? (
                      <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-7 sm:h-7" fill="white">
                        <path d="M13.827 3.52h3.603L24 20.48h-3.603l-6.57-16.96zm-7.258 0h3.767L16.906 20.48h-3.674l-1.343-3.461H5.017l-1.344 3.46H0L6.57 3.522zm4.132 10.501L7.999 6.502l-2.703 7.52h5.405z"/>
                      </svg>
                    ) : (
                      <Image
                        src={tool.icon}
                        alt={tool.name}
                        width={48}
                        height={48}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-contain"
                        unoptimized
                      />
                    )}
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-center leading-tight">{tool.name}</span>
                  <span
                    className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded"
                    style={{
                      background: 'var(--color-surface-elevated)',
                      color: 'var(--color-text-tertiary)'
                    }}
                  >
                    {tool.badge}
                  </span>
                </a>
              ))}
            </div>
            </section>
          </RevealOnScroll>

          {/* Initial Structure Preview - Markdown Structure */}
          <RevealOnScroll delay={50}>
            <section className="mb-10 sm:mb-16">
            <h2 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">Initial Structure Preview</h2>
            <p className="text-xs sm:text-sm mb-4 sm:mb-6" style={{ color: 'var(--color-text-tertiary)' }}>
              How I structure projects with markdown
            </p>

            {/* Retro Terminal Frame */}
            <div className="rounded-lg sm:rounded-xl overflow-hidden border border-[#333] shadow-2xl">
              {/* Terminal Header */}
              <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-[#1a1a1a] border-b border-[#333]">
                <div className="flex gap-1.5 sm:gap-2">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#ff5f57]"></div>
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#febc2e]"></div>
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#28c840]"></div>
                </div>
                <span className="ml-2 sm:ml-3 text-[10px] sm:text-xs font-mono" style={{ color: 'var(--color-text-tertiary)' }}>
                  ~/project-structure
                </span>
              </div>

              {/* Terminal Content */}
              <div className="bg-[#0d0d0d] p-4 sm:p-6 overflow-x-auto">
                <pre className="font-mono text-xs sm:text-sm leading-relaxed sm:leading-loose">
                  <code>
                    <span style={{ color: '#78716C' }}>## Project Structure Example</span>{'\n'}
                    <span style={{ color: 'var(--color-brand-orange)' }}>/project-name</span>{'\n'}
                    <span style={{ color: '#666' }}>├── </span><span style={{ color: '#0D9488' }}>context/</span>{'\n'}
                    <span style={{ color: '#666' }}>│   ├── </span><span style={{ color: '#A8A29E' }}>product-brief.md</span>{'\n'}
                    <span style={{ color: '#666' }}>│   ├── </span><span style={{ color: '#A8A29E' }}>user-research-summary.md</span>{'\n'}
                    <span style={{ color: '#666' }}>│   └── </span><span style={{ color: '#A8A29E' }}>technical-constraints.md</span>{'\n'}
                    <span style={{ color: '#666' }}>├── </span><span style={{ color: '#0D9488' }}>skills/</span>{'\n'}
                    <span style={{ color: '#666' }}>│   ├── </span><span style={{ color: '#A8A29E' }}>analysis-template.md</span>{'\n'}
                    <span style={{ color: '#666' }}>│   └── </span><span style={{ color: '#A8A29E' }}>writing-style-guide.md</span>{'\n'}
                    <span style={{ color: '#666' }}>└── </span><span style={{ color: '#0D9488' }}>outputs/</span>{'\n'}
                    <span style={{ color: '#666' }}>    └── </span><span style={{ color: '#78716C' }}>[generated content]</span>
                  </code>
                </pre>
              </div>
            </div>
            </section>
          </RevealOnScroll>

          {/* Follow Along - responsive layout */}
          <RevealOnScroll delay={50}>
            <section className="mb-10 sm:mb-16">
            <h2 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">Follow Along</h2>
            <p className="text-xs sm:text-sm mb-4 sm:mb-6" style={{ color: 'var(--color-text-tertiary)' }}>
              Podcasts and channels on AI workflows
            </p>

            {/* Spotify */}
            <div className="mb-6 sm:mb-8">
              <p className="micro-label mb-3 sm:mb-4 flex items-center gap-2 text-[10px] sm:text-xs">
                <span>🎧</span> Spotify Podcasts
              </p>
              <div className="space-y-2 sm:space-y-3">
                {spotifyShows.map((show) => (
                  <div key={show.id} className="rounded-lg sm:rounded-xl overflow-hidden">
                    <iframe
                      src={`https://open.spotify.com/embed/show/${show.id}?utm_source=generator&theme=0`}
                      width="100%"
                      height="152"
                      frameBorder="0"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      className="rounded-lg sm:rounded-xl"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* YouTube Videos */}
            <div>
              <p className="micro-label mb-3 sm:mb-4 flex items-center gap-2 text-[10px] sm:text-xs">
                <span>📺</span> YouTube Videos
              </p>
              <div className="space-y-4 sm:space-y-6">
                {youtubeVideos.map((video) => (
                  <div key={video.id} className="glass rounded-lg sm:rounded-xl overflow-hidden">
                    <div className="aspect-video">
                      <iframe
                        src={`https://www.youtube.com/embed/${video.id}`}
                        title={video.name}
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className="w-full h-full"
                      />
                    </div>
                    <div className="p-3 sm:p-4">
                      <h3 className="font-semibold text-sm sm:text-base">{video.name}</h3>
                      <p className="text-xs sm:text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                        {video.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            </section>
          </RevealOnScroll>
        </div>
      </div>

      {/* Full-screen video reveal section */}
      <section 
        ref={heroSectionRef}
        className="relative h-screen flex items-center justify-center"
      >
        {/* Hero text with scroll-based scale */}
        <div 
          className="relative z-20 text-center px-4 transition-transform duration-100 ease-out"
          style={{ 
            transform: `scale(${heroScale})`,
            opacity: 0.4 + (heroScale - 0.6) * 1.5 // Fade in as it scales
          }}
        >
          <p 
            className="micro-label mb-4 sm:mb-6 text-[10px] sm:text-xs"
            style={{ color: 'rgba(255, 255, 255, 0.6)' }}
          >
            Thursday, February 5 · 10:00 AM GMT
          </p>
          <h2
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold tracking-tight"
            style={{ fontFamily: 'var(--font-sigla)' }}
          >
            <span className="gradient-text">See you there</span>
          </h2>
        </div>
      </section>

      {/* Fixed floating audio player */}
      <div className={`fixed bottom-4 z-50 transition-all duration-300 ease-out ${
        audioPlayerExpanded 
          ? 'left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-6' 
          : 'right-4 sm:right-6'
      }`}>
        {/* Hidden audio element */}
        <audio
          ref={audioRef}
          src="/podcast-episode.m4a"
          onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)}
          onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration)}
          onEnded={() => setIsPlaying(false)}
        />

        <div 
          className={`backdrop-blur-xl rounded-lg border transition-all duration-300 ease-out ${
            audioPlayerExpanded ? 'w-[300px] sm:w-[320px]' : 'w-auto'
          }`}
          style={{
            background: 'rgba(12, 10, 9, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.08)',
          }}
        >
          <div className="px-3 py-3">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Play/Pause button */}
              <button
                onClick={togglePlay}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
                style={{ background: 'linear-gradient(135deg, var(--color-brand-orange) 0%, var(--color-brand-orange-light) 100%)' }}
              >
                {isPlaying ? (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                  </svg>
                ) : (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </button>

              {/* Expanded content */}
              {audioPlayerExpanded && (
                <>
                  {/* Waveform / Progress bar */}
                  <div 
                    className="flex-1 h-8 sm:h-10 flex items-end gap-[2px] cursor-pointer relative"
                    onClick={handleSeek}
                  >
                    {/* Waveform bars */}
                    {audioData.map((height, i) => {
                      const progress = duration ? currentTime / duration : 0
                      const isActive = i / 25 <= progress
                      return (
                        <div
                          key={i}
                          className="flex-1 rounded-full"
                          style={{
                            height: `${height}%`,
                            minHeight: '3px',
                            background: isActive 
                              ? 'var(--color-brand-orange)' 
                              : 'rgba(255, 255, 255, 0.25)',
                            transition: isPlaying ? 'height 50ms ease-out' : 'height 300ms ease-out',
                          }}
                        />
                      )
                    })}
                  </div>

                  {/* Duration */}
                  <div 
                    className="text-[10px] sm:text-xs tabular-nums flex-shrink-0"
                    style={{ fontFamily: 'var(--font-hoves-mono)', color: 'var(--color-text-tertiary)' }}
                  >
                    {formatAudioTime(currentTime)}
                  </div>

                  {/* Menu button */}
                  <button
                    onClick={() => setShowAudioMenu(!showAudioMenu)}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-text-tertiary)' }}>
                      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                    </svg>
                  </button>
                </>
              )}

              {/* Collapse/Expand toggle */}
              <button
                onClick={() => setAudioPlayerExpanded(!audioPlayerExpanded)}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
                title={audioPlayerExpanded ? 'Minimize player' : 'Expand player'}
              >
                <svg 
                  className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 ${audioPlayerExpanded ? 'rotate-0' : 'rotate-180'}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Audio menu dropdown - rendered outside player for proper stacking */}
      {showAudioMenu && (
        <>
          {/* Backdrop to close menu */}
          <div 
            className="fixed inset-0 z-[60]" 
            onClick={() => setShowAudioMenu(false)}
          />
          {/* Menu */}
          <div 
            className="fixed bottom-20 right-4 sm:right-6 py-2 rounded-lg border shadow-2xl min-w-[160px] z-[70]"
            style={{
              background: 'rgba(20, 18, 17, 0.98)',
              borderColor: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <a
              href="/podcast-episode.m4a"
              download="Building_Agentic_Workflows.m4a"
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors"
              onClick={() => setShowAudioMenu(false)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-text-tertiary)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Download</span>
            </a>
            <button
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors text-left"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href)
                setShowAudioMenu(false)
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-text-tertiary)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span>Share</span>
            </button>
          </div>
        </>
      )}
    </>
  )
}
