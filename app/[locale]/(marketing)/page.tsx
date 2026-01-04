import PixelBlast from "@/components/PixelBlast";
import { Button } from "@/components/ui/button";
import { AuthRedirect } from "@/components/marketing/auth-redirect";
import { useTranslations } from "next-intl";
import {
  Blocks,
  Sparkles,
  Play,
  Share2,
  Palette,
  Crown,
  GraduationCap,
  Code2,
  Users,
  ChevronDown,
} from "lucide-react";

export default function LandingPage() {
  const t = useTranslations("Marketing");

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
              {t("hero.badge")}
            </span>
          </div>

          <h1
            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9]"
            dangerouslySetInnerHTML={{ __html: t.raw("hero.title") }}
          />

          <p className="text-xl text-neutral-400 max-w-xl mx-auto">
            {t("hero.subtitle")}
          </p>

          <div className="flex gap-4 justify-center pt-4">
            <Button
              size="lg"
              className="rounded-full px-8 py-6 text-lg font-bold bg-white text-black hover:bg-neutral-200 transition-colors"
            >
              {t("hero.getStarted")}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full px-8 py-6 text-lg font-bold bg-white/5 border-white/10 hover:bg-white/10 text-white transition-colors backdrop-blur-sm"
            >
              {t("hero.learnMore")}
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-6 py-24 relative z-10">
        <h2 className="text-3xl font-bold text-center mb-16">
          {t("howItWorks.title")}
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: t("howItWorks.steps.step1.title"),
              desc: t("howItWorks.steps.step1.desc"),
              icon: "💬",
            },
            {
              title: t("howItWorks.steps.step2.title"),
              desc: t("howItWorks.steps.step2.desc"),
              icon: "✨",
            },
            {
              title: t("howItWorks.steps.step3.title"),
              desc: t("howItWorks.steps.step3.desc"),
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

      {/* Why EgotGames */}
      <section className="relative z-10 py-24 bg-gradient-to-b from-transparent via-purple-950/20 to-transparent">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t("whyEgot.title")}
            </h2>
            <p className="text-neutral-400 max-w-2xl mx-auto text-lg">
              {t("whyEgot.subtitle")}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Blocks,
                title: t("whyEgot.features.twoModes.title"),
                desc: t("whyEgot.features.twoModes.desc"),
                color: "text-blue-400",
                bg: "bg-blue-500/10",
              },
              {
                icon: Sparkles,
                title: t("whyEgot.features.aiAssistant.title"),
                desc: t("whyEgot.features.aiAssistant.desc"),
                color: "text-purple-400",
                bg: "bg-purple-500/10",
              },
              {
                icon: Play,
                title: t("whyEgot.features.instantPreview.title"),
                desc: t("whyEgot.features.instantPreview.desc"),
                color: "text-green-400",
                bg: "bg-green-500/10",
              },
              {
                icon: Share2,
                title: t("whyEgot.features.publishShare.title"),
                desc: t("whyEgot.features.publishShare.desc"),
                color: "text-orange-400",
                bg: "bg-orange-500/10",
              },
              {
                icon: Palette,
                title: t("whyEgot.features.assets.title"),
                desc: t("whyEgot.features.assets.desc"),
                color: "text-pink-400",
                bg: "bg-pink-500/10",
              },
              {
                icon: Crown,
                title: t("whyEgot.features.premium.title"),
                desc: t("whyEgot.features.premium.desc"),
                color: "text-yellow-400",
                bg: "bg-yellow-500/10",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group p-6 rounded-2xl bg-neutral-900/50 border border-white/5 hover:border-white/20 transition-all duration-300"
              >
                <div
                  className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="container mx-auto px-6 py-24 relative z-10">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
          {t("useCases.title")}
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: GraduationCap,
              title: t("useCases.beginners.title"),
              desc: t("useCases.beginners.desc"),
              gradient: "from-blue-500/20 to-purple-500/20",
              border: "hover:border-blue-500/50",
            },
            {
              icon: Code2,
              title: t("useCases.creators.title"),
              desc: t("useCases.creators.desc"),
              gradient: "from-purple-500/20 to-pink-500/20",
              border: "hover:border-purple-500/50",
            },
            {
              icon: Users,
              title: t("useCases.teams.title"),
              desc: t("useCases.teams.desc"),
              gradient: "from-pink-500/20 to-orange-500/20",
              border: "hover:border-pink-500/50",
            },
          ].map((useCase, i) => (
            <div
              key={i}
              className={`relative group p-8 rounded-2xl bg-gradient-to-br ${useCase.gradient} border border-white/10 ${useCase.border} transition-all duration-300 overflow-hidden`}
            >
              <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm" />
              <div className="relative z-10">
                <useCase.icon className="w-10 h-10 mb-6 text-white/80 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="text-xl font-bold mb-3">{useCase.title}</h3>
                <p className="text-neutral-300 leading-relaxed">
                  {useCase.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="relative z-10 py-24 bg-gradient-to-b from-transparent via-neutral-900/50 to-transparent">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            {t("faq.title")}
          </h2>
          <div className="space-y-4">
            {[
              {
                q: t("faq.items.coding.q"),
                a: t("faq.items.coding.a"),
              },
              {
                q: t("faq.items.gameTypes.q"),
                a: t("faq.items.gameTypes.a"),
              },
              {
                q: t("faq.items.sharing.q"),
                a: t("faq.items.sharing.a"),
              },
              {
                q: t("faq.items.assets.q"),
                a: t("faq.items.assets.a"),
              },
              {
                q: t("faq.items.premium.q"),
                a: t("faq.items.premium.a"),
              },
            ].map((faq, i) => (
              <details
                key={i}
                className="group bg-neutral-900/50 border border-white/10 rounded-xl overflow-hidden"
              >
                <summary className="flex items-center justify-between cursor-pointer p-6 text-lg font-medium hover:bg-white/5 transition-colors">
                  <span>{faq.q}</span>
                  <ChevronDown className="w-5 h-5 text-neutral-400 group-open:rotate-180 transition-transform duration-200" />
                </summary>
                <div className="px-6 pb-6 text-neutral-400 leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-24 relative z-10 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t("hero.badge")}
          </h2>
          <p className="text-neutral-400 text-lg mb-8">
            {t("hero.subtitle")}
          </p>
          <Button
            size="lg"
            className="rounded-full px-10 py-6 text-lg font-bold bg-white text-black hover:bg-neutral-200 transition-colors"
          >
            {t("hero.getStarted")}
          </Button>
        </div>
      </section>

      {/* Auth Redirect */}
      <AuthRedirect />
    </div>
  );
}
