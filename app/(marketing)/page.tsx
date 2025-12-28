import PixelBlast from "@/components/PixelBlast";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex flex-col gap-12 pb-12 bg-black text-white">
      {/* Hero Section */}
      <section className="relative h-screen min-h-[600px] flex flex-col items-center justify-center text-center px-4 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <PixelBlast
            variant="circle"
            pixelSize={6}
            color="#B19EEF"
            patternScale={3}
            patternDensity={1.2}
            pixelSizeJitter={0.5}
            enableRipples
            rippleSpeed={0.4}
            rippleThickness={0.12}
            rippleIntensityScale={1.5}
            speed={0.6}
            edgeFade={0.25}
            transparent
          />
        </div>

        {/* Content Overlay */}
        <div className="z-10 max-w-4xl space-y-8 relative pt-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-xs font-medium text-purple-200">
              Start Creating Today
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9]">
            It's dangerous to go <br />
            alone! Take this.
          </h1>

          <p className="text-xl text-neutral-400 max-w-xl mx-auto">
            Turn your stories into 8-bit worlds instantly with the power of
            Egot. A generative game engine for everyone.
          </p>

          <div className="flex gap-4 justify-center pt-4">
            <Button
              size="lg"
              className="rounded-full px-8 py-6 text-lg font-bold bg-white text-black hover:bg-neutral-200 transition-colors"
            >
              Get Started
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full px-8 py-6 text-lg font-bold bg-white/5 border-white/10 hover:bg-white/10 text-white transition-colors backdrop-blur-sm"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-6 py-24 relative z-10">
        <h2 className="text-3xl font-bold text-center mb-16">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: "1. Tell Egot",
              desc: "Share your story or idea in chat.",
              icon: "💬",
            },
            {
              title: "2. Watch it Build",
              desc: "See the map and sprites generate instantly.",
              icon: "✨",
            },
            {
              title: "3. Publish & Play",
              desc: "Share your game with the world.",
              icon: "🎮",
            },
          ].map((step, i) => (
            <div
              key={i}
              className="bg-neutral-900/50 border border-white/10 rounded-2xl p-8 text-center hover:border-purple-500/50 transition-colors group backdrop-blur-sm"
            >
              <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">
                {step.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{step.title}</h3>
              <p className="text-neutral-400">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
