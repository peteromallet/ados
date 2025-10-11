export default function Loading() {
  return (
    <>
      {/* Background Video - same as event page, should be cached from home page */}
      <video
        autoPlay
        loop
        muted
        playsInline
        poster="/chill-hero-poster.jpg"
        className="fixed inset-0 w-full h-full object-cover -z-10"
      >
        <source src="/chill-hero.mp4" type="video/mp4" />
      </video>

      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40 -z-10" />

      <div className="h-screen flex items-center justify-center">
        <p className="text-lg sm:text-xl text-white">Loading...</p>
      </div>
    </>
  )
}
