'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { VideoModal } from '@/components/VideoModal'
import { InfoTooltip } from '@/components/InfoTooltip'
import { VibeToggle } from '@/components/VibeToggle'
import { motion } from 'framer-motion'
import { Play } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function Hero() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [vibe, setVibe] = useState<'chill' | 'epic'>('chill')
  const [isGlitching, setIsGlitching] = useState(false)
  const [rotationDirection, setRotationDirection] = useState<'left' | 'right'>('left')
  const videoRef = useRef<HTMLVideoElement>(null)
  const preloadVideoRef = useRef<HTMLVideoElement>(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const [inviteName, setInviteName] = useState<string | null>(null)
  const [showInviteButton, setShowInviteButton] = useState(false)
  const [invalidInvite, setInvalidInvite] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null)
  const supabase = createClient()

  // Prefetch event page as soon as Hero loads for instant navigation
  useEffect(() => {
    router.prefetch('/events/ados-2025')
    router.prefetch('/events/ados-2025/apply')
  }, [router])

  const handleVibeChange = (newVibe: 'chill' | 'epic') => {
    if (newVibe === vibe) return
    
    // Store current video time
    const currentTime = videoRef.current?.currentTime || 0
    
    // Set rotation direction: right for epic, left for chill
    setRotationDirection(newVibe === 'epic' ? 'right' : 'left')
    
    setIsGlitching(true)
    setTimeout(() => {
      setVibe(newVibe)
      // Restore video time after source change
      if (videoRef.current) {
        videoRef.current.currentTime = currentTime
      }
    }, 300) // Change content mid-glitch
    setTimeout(() => {
      setIsGlitching(false)
    }, 600) // End glitch
  }

  // Check if user is admin and application status, but after a short delay
  // to prioritize initial render and prefetching.
  useEffect(() => {
    const timer = setTimeout(() => {
      async function checkUserStatus() {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
          
          if (profile?.role === 'admin') {
            setIsAdmin(true)
          }

          // Check if user has applied to the main event (ados-2025)
          const { data: events } = await supabase
            .from('events')
            .select('id')
            .eq('slug', 'ados-2025')
            .single()

          if (events) {
            const { data: attendance } = await supabase
              .from('attendance')
              .select('status')
              .eq('user_id', user.id)
              .eq('event_id', events.id)
              .single()

            if (attendance) {
              setApplicationStatus(attendance.status)
            }
          }
        }
      }
      checkUserStatus()
    }, 1000) // 1-second delay

    return () => clearTimeout(timer)
  }, [supabase])

  // Fetch invite name from database, but after a short delay.
  useEffect(() => {
    const timer = setTimeout(() => {
      const inviteCode = searchParams.get('invite')
      if (inviteCode) {
        async function fetchInvite() {
          // Small delay to make the animation more noticeable is fine here
          await new Promise(resolve => setTimeout(resolve, 500))
          
          const { data, error } = await supabase
            .from('invites')
            .select('*')
            .eq('code', inviteCode)
            .single()
          
          if (!error && data) {
            // Check if invite has uses left
            if (data.used_count < data.max_uses) {
              setInviteName(data.name)
              // Persist to localStorage
              localStorage.setItem('invite_code', JSON.stringify({
                code: inviteCode,
                name: data.name
              }))
              // Delay showing the button change until after name animation completes
              setTimeout(() => {
                setShowInviteButton(true)
              }, 1200) // Wait for name animation to complete
            } else {
              // Invite is used up
              setInvalidInvite(true)
            }
          } else {
            // Invalid invite code
            setInvalidInvite(true)
          }
        }
        fetchInvite()
      }
    }, 1000) // 1-second delay

    return () => clearTimeout(timer)
  }, [searchParams, supabase])

  // Update video source when vibe changes
  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current
      const currentTime = video.currentTime
      const wasPlaying = !video.paused
      
      video.poster = vibe === 'epic' ? '/epic-hero-poster.jpg' : '/chill-hero-poster.jpg'
      video.src = vibe === 'epic' ? '/epic-hero.mp4' : '/chill-hero.mp4'
      video.load()
      
      const handleCanPlay = () => {
        video.currentTime = currentTime
        if (wasPlaying) {
          video.play().catch(() => {})
        }
      }
      
      video.addEventListener('canplay', handleCanPlay, { once: true })
      
      // Update preload video to load the opposite video
      if (preloadVideoRef.current) {
        preloadVideoRef.current.src = vibe === 'epic' ? '/chill-hero.mp4' : '/epic-hero.mp4'
        preloadVideoRef.current.load()
      }
      
      return () => {
        video.removeEventListener('canplay', handleCanPlay)
      }
    }
  }, [vibe])

  const getCtaText = () => {
    if (showInviteButton) return "Accept Invitation"
    if (applicationStatus === 'approved') return "We're excited to have you join!"
    if (applicationStatus === 'pending') return "Check status"
    return "I'd like to join"
  }

  const getCtaLink = () => {
    return '/events/ados-2025'
  }

  const content = {
    chill: {
      subtitle: 'A celebration of art and open source AI',
      date: 'Los Angeles | November 7th',
      cta: getCtaText(),
      watchTrailer: 'Watch the Trailer',
      whatIsIt: (<>We'll bring people together for a day-long event with a day-time and evening portion:{'\n\n'}- Day-time: panels, roundtables, hangouts{'\n'}- Evening: show, drinks, frivolities{'\n\n'}Thanks to our friends at Asteria, we'll host at the legendary Mack Sennett studio.</>),
      whoIsItFor: (<>We hope to bring together a mix of people who are curious or passionate about art and open source models:{'\n\n'}- Artists: creators of art{'\n'}- Developers: people who build with open models{'\n'}- Interested parties: founders, executives, investors, etc.{'\n'}- Curious oddballs: undefinable{'\n\n'}We won't release specifics on attendees, speakers or presenters in advance.</>),
      whyGather: (<>Open models are an essential weapon against the <strong>slop machine</strong> - they offer as much control as traditional mediums, unconstrained by invented limitations or constrained imaginations - but they require an ecosystem of effort and support to thrive.{'\n\n'}We gather to celebrate AI art and open models, hang out with fellow connoisseurs, and scheme on how to help the ecosystem and community succeed.</>),
    },
    epic: {
      subtitle: 'A SYMPOSIUM ON THE FUTURE OF CREATIVITY',
      date: 'The City of Angels | November 7th',
      cta: getCtaText(),
      watchTrailer: 'Feast your eyes',
      whatIsIt: (<>We'll bring people together for a day-long event with a day-time and evening portion:{'\n\n'}- Day-time: panels, roundtables, hangouts - for hardcore enthusiasts{'\n'}- Evening: show, drinks, frivolities - for curious people{'\n\n'}Thanks to our friends at Asteria, we'll host at the legendary Mack Sennett studio.</>),
      whoIsItFor: (<>We hope to bring together a mix of people who are curious or passionate about art and open source models:{'\n\n'}- Artists: creators of art{'\n'}- Developers: people who build with open models{'\n'}- Interested parties: founders, executives, investors, etc.{'\n'}- Curious oddballs: undefinable{'\n\n'}We won't release specifics on attendees, speakers or presenters in advance.</>),
      whyGather: (<>Open models are an essential weapon against the <strong>slop machine</strong> - they offer as much control as traditional mediums, unconstrained by invented limitations or constrained imaginations - but they require an ecosystem of effort and support to thrive.{'\n\n'}We gather to celebrate AI art and open models, hang out with fellow connoisseurs, and scheme on how to help the ecosystem and community succeed.</>),
    },
  }

  return (
    <div className="relative h-[100dvh] flex items-center justify-center overflow-hidden">
      {/* Admin Button */}
      {isAdmin && (
        <Link href="/admin">
          <button className="absolute top-6 right-6 z-50 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white font-semibold transition-all">
            Admin
          </button>
        </Link>
      )}
      {/* Background Video */}
      {/* Visible Background Video */}
      <motion.video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        poster={vibe === 'epic' ? '/epic-hero-poster.jpg' : '/chill-hero-poster.jpg'}
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ 
          opacity: 1,
          scale: isGlitching ? [1, 1.05, 0.95, 1] : 1,
          rotate: isGlitching ? (rotationDirection === 'right' ? [0, 1, -1, 0] : [0, -1, 1, 0]) : 0,
        }}
        transition={{ duration: isGlitching ? 0.6 : 0.5 }}
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          filter: isGlitching ? `blur(8px) saturate(2) hue-rotate(${rotationDirection === 'right' ? 30 : -30}deg)` : 'none',
        }}
      >
        <source src={vibe === 'epic' ? '/epic-hero.mp4' : '/chill-hero.mp4'} type="video/mp4" />
      </motion.video>

      {/* Hidden preload video for the inactive vibe */}
      <video
        ref={preloadVideoRef}
        loop
        muted
        playsInline
        preload="auto"
        className="hidden"
        src={vibe === 'epic' ? '/chill-hero.mp4' : '/epic-hero.mp4'}
      />

      {/* Overlay */}
      <div className={`absolute inset-0 ${vibe === 'epic' ? 'bg-white/20' : 'bg-black/30'}`} />

      {/* Kaleidoscope Vortex Overlay */}
      {isGlitching && (
        <>
          {/* Gentle center flash */}
          <motion.div
            className="absolute inset-0 z-20 pointer-events-none"
            animate={{
              opacity: [0, 0.4, 0],
            }}
            style={{ 
              background: vibe === 'epic' 
                ? 'radial-gradient(circle at 50% 50%, rgba(255,200,150,0.5) 0%, transparent 35%)'
                : 'radial-gradient(circle at 50% 50%, rgba(150,200,255,0.4) 0%, transparent 35%)',
              mixBlendMode: 'screen' 
            }}
            transition={{ duration: 0.3 }}
          />

          {/* Subtle edge vignette pulse */}
          <motion.div
            className="absolute inset-0 z-20 pointer-events-none"
            animate={{
              opacity: [0, 0.6, 0],
            }}
            style={{ 
              background: 'radial-gradient(circle at 50% 50%, transparent 40%, rgba(0,0,0,0.5) 100%)',
            }}
            transition={{ duration: 0.6 }}
          />

          {/* Radial gradient pulses */}
          {[0, 1, 2, 3].map((i) => {
            const multiplier = rotationDirection === 'right' ? 1 : -1
            const pulseColor = vibe === 'epic' ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.1)'
            return (
              <motion.div
                key={i}
                className="absolute inset-0 z-20 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at 50% 50%, transparent ${20 + i * 15}%, ${pulseColor} ${25 + i * 15}%, transparent ${30 + i * 15}%)`,
                  mixBlendMode: 'overlay',
                }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0, 0.8, 0],
                  rotate: [0, 180 * multiplier * (i % 2 ? 1 : -1), 360 * multiplier * (i % 2 ? 1 : -1)],
                }}
                transition={{ duration: 0.6, delay: i * 0.05 }}
              />
            )
          })}
          
          {/* Kaleidoscope mirror effect */}
          <motion.div
            className="absolute inset-0 z-20 pointer-events-none"
            style={{
              background: vibe === 'epic' 
                ? 'conic-gradient(from 0deg, transparent 0deg, rgba(255,0,0,0.4) 60deg, transparent 120deg, rgba(255,128,0,0.4) 180deg, transparent 240deg, rgba(255,255,0,0.4) 300deg, transparent 360deg)'
                : 'conic-gradient(from 0deg, transparent 0deg, rgba(255,100,255,0.3) 60deg, transparent 120deg, rgba(100,255,255,0.3) 180deg, transparent 240deg, rgba(255,255,100,0.3) 300deg, transparent 360deg)',
              mixBlendMode: 'screen',
            }}
            animate={{
              rotate: rotationDirection === 'right' ? [0, 720] : [0, -720],
              scale: [1, 1.2, 1],
              opacity: [0, 1, 0],
            }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          />
          
          {/* Prismatic color burst */}
          <motion.div
            className="absolute inset-0 z-20 pointer-events-none"
            animate={{
              background: vibe === 'epic' 
                ? [
                    'radial-gradient(circle at 50% 50%, rgba(255,50,0,0.5) 0%, transparent 30%)',
                    'radial-gradient(circle at 50% 50%, rgba(255,128,0,0.5) 0%, transparent 50%)',
                    'radial-gradient(circle at 50% 50%, rgba(255,200,0,0.5) 0%, transparent 30%)',
                    'radial-gradient(circle at 50% 50%, transparent 0%, transparent 30%)',
                  ]
                : [
                    'radial-gradient(circle at 50% 50%, rgba(255,0,255,0.4) 0%, transparent 30%)',
                    'radial-gradient(circle at 50% 50%, rgba(0,255,255,0.4) 0%, transparent 50%)',
                    'radial-gradient(circle at 50% 50%, rgba(255,255,0,0.4) 0%, transparent 30%)',
                    'radial-gradient(circle at 50% 50%, transparent 0%, transparent 30%)',
                  ],
              scale: [0.5, 2, 0.5],
              opacity: [0, 0.8, 0],
            }}
            style={{ mixBlendMode: 'screen' }}
            transition={{ duration: 0.6 }}
          />
        </>
      )}

      {/* Content */}
      <motion.div 
        className="relative z-10 text-center px-6 w-full"
        animate={isGlitching ? {
          scale: [1, 0.95, 1.02, 1],
          rotateZ: rotationDirection === 'right' ? [0, -2, 2, 0] : [0, 2, -2, 0],
          filter: [
            'hue-rotate(0deg) brightness(1)',
            `hue-rotate(${rotationDirection === 'right' ? 180 : -180}deg) brightness(1.3)`,
            'hue-rotate(0deg) brightness(1)',
          ],
        } : {}}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center w-full"
        >
              <div className="w-full max-w-5xl flex flex-col items-center px-4">
                {inviteName && (
                  <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ 
                      duration: 0.8, 
                      ease: [0.16, 1, 0.3, 1],
                      delay: 0.1
                    }}
                    className="mb-4 relative"
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                      className={`absolute bottom-0 left-0 h-[2px] ${
                        vibe === 'epic' ? 'bg-black/30' : 'bg-white/30'
                      }`}
                    />
                    <p className={`text-sm sm:text-base md:text-lg font-light uppercase text-center tracking-wider px-4 pb-2 ${
                      vibe === 'epic' ? 'text-black/70' : 'text-white/70'
                    }`}>
                      An Invitation To{' '}
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4, delay: 0.5 }}
                        className="font-semibold"
                      >
                        {inviteName}
                      </motion.span>
                    </p>
                  </motion.div>
                )}
                {invalidInvite && (
                  <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ 
                      duration: 0.8, 
                      ease: [0.16, 1, 0.3, 1],
                      delay: 0.1
                    }}
                    className="mb-4 relative"
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                      className={`absolute bottom-0 left-0 h-[2px] ${
                        vibe === 'epic' ? 'bg-black/30' : 'bg-white/30'
                      }`}
                    />
                    <p className={`text-sm sm:text-base md:text-lg font-light uppercase text-center tracking-wider px-4 pb-2 ${
                      vibe === 'epic' ? 'text-black/70' : 'text-white/70'
                    }`}>
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4, delay: 0.5 }}
                        className="font-semibold"
                      >
                        Nice try
                      </motion.span>
                    </p>
                  </motion.div>
                )}
                <h1 className={`text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-8 uppercase text-center transition-colors duration-300 ${
                  vibe === 'epic' ? 'text-black' : 'text-white'
                }`}>
                  <span className="inline-block tracking-[0.3em] sm:tracking-[0.5em] -mr-[0.3em] sm:-mr-[0.5em]">ADOS</span>
                </h1>
                <motion.p 
                  key={`subtitle-${vibe}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`text-sm sm:text-base md:text-lg lg:text-xl mb-4 font-light uppercase text-center transition-colors duration-300 px-2 ${
                    vibe === 'epic' ? 'text-black' : 'text-white'
                  }`}
                >
                  <span className="inline-block tracking-[0.1em] sm:tracking-[0.2em] -mr-[0.1em] sm:-mr-[0.2em]">{content[vibe].subtitle}</span>
                </motion.p>
                <motion.p
                  key={`date-${vibe}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`text-xs sm:text-sm md:text-sm lg:text-base mb-8 font-light uppercase text-center transition-colors duration-300 ${
                    vibe === 'epic' ? 'text-black/70' : 'text-white/70'
                  }`}
                >
                  <span className="inline-block tracking-[0.1em] sm:tracking-[0.2em] -mr-[0.1em] sm:-mr-[0.2em]">{content[vibe].date}</span>
                </motion.p>
              </div>
          <div className="flex flex-col gap-6 items-center">
            <Link 
              href={inviteName ? `/events/ados-2025/apply?invite=${searchParams.get('invite')}` : getCtaLink()}
              onMouseEnter={() => {
                // Prefetch the event page
                router.prefetch('/events/ados-2025')
              }}
            >
              <motion.div
                key={`cta-${vibe}-${inviteName ? 'invite' : 'normal'}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  animate={showInviteButton ? {
                    scale: [1, 1.05, 1],
                    boxShadow: [
                      'none',
                      vibe === 'epic' ? '0 0 20px rgba(0,0,0,0.3)' : '0 0 20px rgba(255,255,255,0.3)',
                      'none'
                    ]
                  } : {}}
                  transition={{ duration: 0.6 }}
                >
                  <Button size="lg" className="min-w-[200px]" isDark={vibe === 'epic'}>
                    {content[vibe].cta}
                  </Button>
                </motion.div>
              </motion.div>
            </Link>
            
                <motion.button
                  key={`trailer-${vibe}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setIsModalOpen(true)}
                  className={`flex items-center gap-2 transition-colors text-sm uppercase tracking-wide group ${
                    vibe === 'epic' ? 'text-black hover:text-gray-700' : 'text-white hover:text-gray-300'
                  }`}
                >
                  <motion.div
                    className="inline-block"
                    whileHover={{
                      rotate: [0, -10, 10, -10, 10, 0],
                      transition: { duration: 0.5 }
                    }}
                  >
                    <Play size={20} />
                  </motion.div>
                  <span>{content[vibe].watchTrailer}</span>
                </motion.button>

                <div className="flex items-center gap-6 mt-2">
                  <InfoTooltip
                    trigger={vibe === 'epic' ? 'Purpose' : 'Why'}
                    content={content[vibe].whyGather}
                    isDark={vibe === 'epic'}
                    arrowPosition="left"
                  />
                  <span className={vibe === 'epic' ? 'text-black/40' : 'text-white/40'}>|</span>
                  <InfoTooltip
                    trigger={vibe === 'epic' ? 'Vision' : 'What'}
                    content={content[vibe].whatIsIt}
                    isDark={vibe === 'epic'}
                    arrowPosition="center"
                  />
                  <span className={vibe === 'epic' ? 'text-black/40' : 'text-white/40'}>|</span>
                  <InfoTooltip
                    trigger={vibe === 'epic' ? 'Group' : 'Who'}
                    content={content[vibe].whoIsItFor}
                    isDark={vibe === 'epic'}
                    arrowPosition="right"
                  />
                </div>

            {/* Vibe Toggle below info tooltips */}
            <div className="mt-4">
              <VibeToggle value={vibe} onChange={handleVibeChange} />
            </div>

            {/* Hosted By Section */}
            <div className="mt-12 flex items-center justify-center gap-4">
              <p className={`text-sm font-light uppercase tracking-wider ${
                vibe === 'epic' ? 'text-black/50' : 'text-white/50'
              }`}>
                Cohosted by
              </p>
              <div className="flex items-center gap-3">
                <a href="https://www.asteriafilm.com" target="_blank" rel="noopener noreferrer" className="opacity-75 hover:opacity-100 transition-opacity">
                  <img 
                    src="/a.png" 
                    alt="Asteria" 
                    className="h-8 w-8 object-contain transition-all" 
                    style={{ filter: vibe === 'epic' ? 'invert(1)' : 'none' }}
                  />
                </a>
                <span className={`text-xl ${vibe === 'epic' ? 'text-black/30' : 'text-white/30'}`}>×</span>
                <a href="https://banodoco.ai/" target="_blank" rel="noopener noreferrer" className="opacity-75 hover:opacity-100 transition-opacity">
                  <img 
                    src="/b.png" 
                    alt="Banodoco" 
                    className="h-8 w-8 object-contain transition-all" 
                    style={{ filter: vibe === 'epic' ? 'invert(1)' : 'none' }}
                  />
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <VideoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        videoSrc={vibe === 'epic' ? '/epic-hero-full.mp4' : '/chill-hero-full.mp4'}
      />
    </div>
  )
}