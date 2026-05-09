'use client'
import type { ComponentProps, ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { InstagramIcon, LinkedinIcon } from 'lucide-react'
import Image from 'next/image'
import { useTranslations, useLocale } from 'next-intl'

export function Footer() {
  const t      = useTranslations('Footer')
  const locale = useLocale()

  const sections = [
    {
      label: t('sections.navigation.label'),
      links: [
        { title: t('sections.navigation.links.inicio'),       href: `/${locale}/#inicio` },
        { title: t('sections.navigation.links.comoFunciona'), href: `/${locale}/#como-funciona` },
        { title: t('sections.navigation.links.plataforma'),   href: `/${locale}/#plataforma` },
        { title: t('sections.navigation.links.casosReales'),  href: `/${locale}/#casos-reales` },
      ],
    },
    {
      label: t('sections.legal.label'),
      links: [
        { title: t('sections.legal.links.privacidad'), href: `/${locale}/privacidad` },
        { title: t('sections.legal.links.terminos'),   href: `/${locale}/terminos` },
      ],
    },
    {
      label: t('sections.start.label'),
      links: [
        { title: t('sections.start.links.agendar'), href: `/${locale}/agendar` },
        { title: t('sections.start.links.empezar'), href: 'https://buy.stripe.com/7sY7sK4ZBcuE61487P5EY0t' },
      ],
    },
    {
      label: t('sections.social.label'),
      links: [
        { title: 'Instagram', href: '#', Icon: InstagramIcon },
        { title: 'LinkedIn',  href: '#', Icon: LinkedinIcon },
      ],
    },
  ]

  return (
    <footer className="relative w-full border-t border-white/[0.05] bg-[#060607] px-6 py-12 lg:py-16">
      {/* Glow line */}
      <div className="absolute inset-x-0 top-0 mx-auto h-px w-1/3 -translate-y-1/2 rounded-full bg-white/[0.08] blur-sm" />

      <div className="mx-auto grid w-full max-w-6xl gap-8 xl:grid-cols-3 xl:gap-8">
        {/* Brand */}
        <AnimatedContainer className="space-y-4">
          <Image src="/logo-white.svg" alt="Bralto" width={100} height={30} className="h-7 w-auto object-contain opacity-80" />
          <p className="mt-4 text-sm leading-relaxed text-white/28 md:mt-0 max-w-xs">
            {t('tagline')}
          </p>
          <p className="text-xs text-white/18">
            © {new Date().getFullYear()} Bralto. {t('copyright')}
          </p>
        </AnimatedContainer>

        {/* Links grid */}
        <div className="mt-10 grid grid-cols-2 gap-8 md:grid-cols-4 xl:col-span-2 xl:mt-0">
          {sections.map((section, index) => (
            <AnimatedContainer key={section.label} delay={0.1 + index * 0.08}>
              <div>
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/25">
                  {section.label}
                </h3>
                <ul className="mt-4 space-y-2.5 text-sm">
                  {section.links.map((link) => (
                    <li key={link.title}>
                      <a
                        href={link.href}
                        className="inline-flex items-center gap-1.5 text-white/35 transition-colors duration-200 hover:text-white/65"
                      >
                        {'Icon' in link && link.Icon && <link.Icon className="h-3.5 w-3.5" />}
                        {link.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </AnimatedContainer>
          ))}
        </div>
      </div>
    </footer>
  )
}

type ViewAnimationProps = {
  delay?: number
  className?: ComponentProps<typeof motion.div>['className']
  children: ReactNode
}

function AnimatedContainer({ className, delay = 0.1, children }: ViewAnimationProps) {
  const shouldReduceMotion = useReducedMotion()
  if (shouldReduceMotion) return <>{children}</>
  return (
    <motion.div
      initial={{ filter: 'blur(4px)', translateY: -8, opacity: 0 }}
      whileInView={{ filter: 'blur(0px)', translateY: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.8 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
