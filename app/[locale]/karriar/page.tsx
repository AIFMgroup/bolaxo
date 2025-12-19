'use client'

import { useState } from 'react'
import Image from 'next/image'
import { MapPin, Briefcase, Clock, Users, Heart, Target, Zap, Award, ArrowRight } from 'lucide-react'

interface JobPosition {
  id: string
  title: string
  department: string
  location: string
  type: 'full-time' | 'part-time' | 'internship'
  level: 'junior' | 'mid' | 'senior' | 'lead'
  description: string
  requirements: string[]
  benefits: string[]
  posted: Date
}

const openPositions: JobPosition[] = [
  {
    id: '1',
    title: 'Senior Fullstack Developer',
    department: 'Tech',
    location: 'Stockholm (Hybrid)',
    type: 'full-time',
    level: 'senior',
    description: 'Vi söker en erfaren fullstack-utvecklare som vill vara med och bygga framtidens marknadsplats för företagsöverlåtelser.',
    requirements: [
      '5+ års erfarenhet av webbutveckling',
      'Expert på React, Next.js och TypeScript',
      'Erfarenhet av Node.js och databaser',
      'Passion för ren kod och bra arkitektur'
    ],
    benefits: [
      'Konkurrensskraftig lön & optionsprogram',
      'Flexibelt arbete - kontor eller remote',
      '6 veckors semester',
      'Friskvårdsbidrag & träning på arbetstid'
    ],
    posted: new Date('2024-03-10')
  },
  {
    id: '2',
    title: 'Head of Sales',
    department: 'Sales',
    location: 'Stockholm',
    type: 'full-time',
    level: 'lead',
    description: 'Leda och bygga vårt säljteam från grunden. Du kommer vara nyckelpersonen för vår tillväxt.',
    requirements: [
      '7+ års erfarenhet av B2B-försäljning',
      'Bevisad erfarenhet av att bygga säljteam',
      'Erfarenhet från SaaS eller marknadsplatser',
      'Stark drivkraft och entreprenörsanda'
    ],
    benefits: [
      'Marknadsledande lön + provision',
      'Betydande optionsprogram',
      'Bygga och leda eget team',
      'Direkt påverkan på företagets tillväxt'
    ],
    posted: new Date('2024-03-05')
  },
  {
    id: '3',
    title: 'Customer Success Manager',
    department: 'Customer Success',
    location: 'Stockholm (Hybrid)',
    type: 'full-time',
    level: 'mid',
    description: 'Hjälp våra kunder lyckas med sina företagsaffärer. Du blir deras främsta kontakt och rådgivare.',
    requirements: [
      '3+ års erfarenhet av kundrelationer',
      'Utmärkta kommunikationsfärdigheter',
      'Intresse för företagande och affärer',
      'Proaktiv och lösningsorienterad'
    ],
    benefits: [
      'Fast lön + bonusprogram',
      'Utvecklingsmöjligheter',
      'Flexibla arbetstider',
      'Inspirerande arbetsmiljö'
    ],
    posted: new Date('2024-03-15')
  },
  {
    id: '4',
    title: 'UX/UI Designer',
    department: 'Design',
    location: 'Remote',
    type: 'full-time',
    level: 'mid',
    description: 'Skapa intuitiva och vackra upplevelser för våra användare. Du får stor frihet att forma produkten.',
    requirements: [
      '3+ års erfarenhet av digital design',
      'Portfölj med starka case',
      'Behärskar Figma och designsystem',
      'Förståelse för användarbeteende'
    ],
    benefits: [
      'Helt remote - arbeta var du vill',
      'Egen budget för utrustning',
      'Kreativ frihet',
      'Regelbundna teamträffar IRL'
    ],
    posted: new Date('2024-03-12')
  }
]

const benefits = [
  {
    icon: Heart,
    title: 'Hälsa & välmående',
    description: 'Generöst friskvårdsbidrag, träning på arbetstid och privat sjukvårdsförsäkring.'
  },
  {
    icon: Users,
    title: 'Fantastiskt team',
    description: 'Jobba med passionerade kollegor som brinner för att göra skillnad.'
  },
  {
    icon: Target,
    title: 'Tydlig mission',
    description: 'Vi förenklar företagsöverlåtelser och skapar värde för entreprenörer.'
  },
  {
    icon: Zap,
    title: 'Snabb tillväxt',
    description: 'Var med från början och väx med oss. Stora utvecklingsmöjligheter.'
  },
  {
    icon: Award,
    title: 'Ägarskap',
    description: 'Alla anställda erbjuds optioner. Vi bygger detta tillsammans.'
  },
  {
    icon: MapPin,
    title: 'Flexibilitet',
    description: 'Välj själv om du vill jobba från kontoret, hemma eller en mix.'
  }
]

export default function CareerPage() {
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [expandedPosition, setExpandedPosition] = useState<string | null>(null)

  const departments = [
    { id: 'all', label: 'Alla avdelningar' },
    { id: 'tech', label: 'Tech' },
    { id: 'sales', label: 'Sales' },
    { id: 'customer-success', label: 'Customer Success' },
    { id: 'design', label: 'Design' },
  ]

  const filteredPositions = openPositions.filter(
    position => selectedDepartment === 'all' || 
    position.department.toLowerCase().replace(' ', '-') === selectedDepartment
  )

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section med bakgrundsbild */}
      <section className="relative min-h-[60vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/polaroid/premium_photo-1713980018323-255e2eb4cfef.jpg"
            alt="Karriär på Afterfounder"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-navy/95 via-navy/80 to-navy/60" />
        </div>
        
        <div className="relative z-10 max-w-6xl mx-auto px-4 text-center py-20">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white">
            Bygg framtiden med oss
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/80 max-w-2xl mx-auto">
            Vi revolutionerar hur företag köps och säljs. Bli en del av vår resa och 
            hjälp tusentals entreprenörer att ta nästa steg.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-lg text-white/70">
            <div className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              <span>15+ medarbetare</span>
            </div>
            <div className="flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              <span>Stockholm & Remote</span>
            </div>
            <div className="flex items-center">
              <Zap className="w-5 h-5 mr-2" />
              <span>Snabbväxande startup</span>
            </div>
          </div>
        </div>
      </section>

      {/* Company Values */}
      <section className="py-6 sm:py-8 md:py-12">
        <div className="max-w-6xl mx-auto px-3 sm:px-4">
          <div className="text-center mb-12">
            <h2 className="heading-2 mb-4">Varför jobba hos oss?</h2>
            <p className="text-lg text-text-gray">
              Vi erbjuder mer än bara ett jobb - bli del av något större
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <div key={index} className="bg-white p-6 rounded-2xl shadow-card">
                  <div className="w-12 h-12 bg-light-blue rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary-blue" />
                  </div>
                  <h3 className="font-semibold text-text-dark mb-2">{benefit.title}</h3>
                  <p className="text-sm text-text-gray">{benefit.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-6 sm:py-8 md:py-12 bg-white">
        <div className="max-w-6xl mx-auto px-3 sm:px-4">
          <div className="text-center mb-12">
            <h2 className="heading-2 mb-4">Lediga tjänster</h2>
            <p className="text-lg text-text-gray mb-8">
              Hitta din nästa roll och väx med oss
            </p>

            {/* Department Filter */}
            <div className="flex flex-wrap justify-center gap-2">
              {departments.map(dept => (
                <button
                  key={dept.id}
                  onClick={() => setSelectedDepartment(dept.id)}
                  className={`px-3 sm:px-3 sm:px-4 py-2 min-h-10 sm:min-h-auto rounded-xl font-medium transition-all ${
                    selectedDepartment === dept.id
                      ? 'bg-primary-blue text-white'
                      : 'bg-gray-100 text-text-gray hover:bg-gray-200'
                  }`}
                >
                  {dept.label}
                </button>
              ))}
            </div>
          </div>

          {/* Job Listings */}
          <div className="space-y-4">
            {filteredPositions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-text-gray">
                  Inga lediga tjänster just nu i denna kategori. 
                  Skicka gärna en spontanansökan!
                </p>
              </div>
            ) : (
              filteredPositions.map(position => (
                <div
                  key={position.id}
                  className="bg-background-off-white rounded-2xl overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setExpandedPosition(
                      expandedPosition === position.id ? null : position.id
                    )}
                    className="w-full p-6 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between">
                      <div className="mb-4 md:mb-0">
                        <h3 className="font-semibold text-text-dark text-lg mb-2">
                          {position.title}
                        </h3>
                        <div className="flex flex-wrap gap-4 text-sm text-text-gray">
                          <span className="flex items-center">
                            <Briefcase className="w-4 h-4 mr-1" />
                            {position.department}
                          </span>
                          <span className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {position.location}
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {position.type === 'full-time' ? 'Heltid' : 
                             position.type === 'part-time' ? 'Deltid' : 'Praktik'}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className={`w-4 h-4 sm:w-5 sm:h-5 text-primary-blue transition-transform ${
                        expandedPosition === position.id ? 'rotate-90' : ''
                      }`} />
                    </div>
                  </button>

                  <div className={`transition-all duration-300 ${
                    expandedPosition === position.id ? 'max-h-[600px]' : 'max-h-0'
                  } overflow-hidden`}>
                    <div className="px-6 pb-6">
                      <p className="text-text-gray mb-6">
                        {position.description}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-6">
                        <div>
                          <h4 className="font-semibold text-text-dark mb-3">Krav</h4>
                          <ul className="space-y-2">
                            {position.requirements.map((req, i) => (
                              <li key={i} className="flex items-start text-sm text-text-gray">
                                <span className="text-primary-blue mr-2">•</span>
                                {req}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-semibold text-text-dark mb-3">Vi erbjuder</h4>
                          <ul className="space-y-2">
                            {position.benefits.map((benefit, i) => (
                              <li key={i} className="flex items-start text-sm text-text-gray">
                                <span className="text-primary-blue mr-2">•</span>
                                {benefit}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4">
                        <a
                          href={`mailto:karriar@afterfounder.se?subject=Ansökan: ${position.title}`}
                          className="btn-primary text-center"
                        >
                          Skicka ansökan
                        </a>
                        <button className="btn-secondary">
                          Dela tjänsten
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Spontaneous Application */}
      <section className="py-6 sm:py-8 md:py-12">
        <div className="max-w-4xl mx-auto px-3 sm:px-4">
          <div className="bg-primary-blue text-white p-8 md:p-12 rounded-2xl text-center">
            <h2 className="heading-2 text-white mb-4">
              Inte rätt roll just nu?
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Vi växer snabbt och letar alltid efter talanger. 
              Skicka en spontanansökan och berätta hur du kan bidra!
            </p>
            <a
              href="mailto:karriar@afterfounder.se?subject=Spontanansökan"
              className="btn-secondary bg-white text-primary-blue hover:bg-gray-100 inline-flex items-center"
            >
              Skicka spontanansökan
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
            </a>
          </div>
        </div>
      </section>

      {/* Culture Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">Vår kultur</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Vi tror på transparens, tillit och att ha kul på jobbet. 
              Här är några bilder från vardagen.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <div className="polaroid-image floating aspect-square rounded-2xl overflow-hidden">
              <Image
                src="/polaroid/premium_photo-1712933121311-dcdc41d9fb17.jpg"
                alt="Vår kultur"
                fill
                className="object-cover"
              />
            </div>
            <div className="polaroid-image floating aspect-square rounded-2xl overflow-hidden" style={{ animationDelay: '1s' }}>
              <Image
                src="/polaroid/premium_photo-1713041546655-8a12addf9ab8.jpg"
                alt="Teamet"
                fill
                className="object-cover"
              />
            </div>
            <div className="polaroid-image floating aspect-square rounded-2xl overflow-hidden" style={{ animationDelay: '2s' }}>
              <Image
                src="/polaroid/premium_photo-1713183390322-807e6bcd84c6.jpg"
                alt="Kontoret"
                fill
                className="object-cover"
              />
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">Följ vår resa</p>
            <div className="flex justify-center gap-4">
              <a href="#" className="text-navy hover:underline">LinkedIn</a>
              <span className="text-gray-400">•</span>
              <a href="#" className="text-navy hover:underline">Instagram</a>
              <span className="text-gray-400">•</span>
              <a href="#" className="text-navy hover:underline">Blog</a>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
