'use client'

import { useState, useRef, useEffect } from 'react'
import Script from 'next/script'

declare global {
  interface Window {
    BookingWidgetStandalone: {
      initBookingWidget: (container: HTMLElement, config: any) => void
    }
  }
}

const BOOKLA_CONFIG = {
  apiKey: 'fxMmD5P8OZHTXpLnIkQXXRLvdQAYNUxJlK16',
  region: 'EU',
  companyId: '71233c2d-2dd5-4df3-9cea-d47bf6d713ef',
  paymentRequired: false,
  serviceId: '',
  transitionType: 'slide',
  hideResourcePicker: true,
  showServiceSelector: false,
  guestEnabled: true,
  termsEnabled: false,
  codeEnabled: false,
  customFormFields: [
    {
      type: 'phone',
      labelText: 'Numéro de téléphone',
      required: true,
      errorText: 'Merci de renseigner un numéro valide',
      inputWidth: 'auto/span 1',
    },
    {
      type: 'email',
      labelText: 'Email',
      required: true,
      errorText: 'Merci de renseigner votre email',
      inputWidth: 'auto/span 1',
    },
    {
      type: 'select',
      labelText: 'Couleur (si disponible)',
      required: false,
      errorText: '',
      inputWidth: 'auto/span 1',
      options:
        ' Black - 1B, Dark Brown - 2, Chocolate Brown - 8, Ginger - Numéro 30, Oburn - 350, Honey Blond - 27, Blond cendré - 12, Blond - 613',
    },
  ],
  theme: {
    colors: {
      background: '#292525',
      text: '#F9F1D5',
      secondaryText: '#F9F1D5',
      error: '#cf2a2a',
      item: {
        normal: { background: '#F9F1D5', text: '#292525', secondaryText: '#292525', border: 'none' },
        selected: { background: '#44998A', text: '#292525', secondaryText: '#292525', border: 'none' },
        hover: { background: '#F9F1D5', text: '#292525', border: 'none' },
        disabled: { background: '#ededed', border: 'none' },
      },
      button: {
        normal: { background: '#44998A', text: '#F9F1D5' },
        hover: { background: '#2f6a5f', text: '#F9F1D5' },
        disabled: { background: '#333', text: '#F9F1D5' },
      },
      secondaryButton: {
        normal: { background: '#F9F1D5', text: '#292525' },
        hover: { background: '#F9F1D5', text: '#292525' },
        disabled: { background: '#b9ac7e', text: '#292525' },
      },
      iconButton: {
        normal: { background: '#F9F1D5', text: '#292525' },
        hover: { background: '#F9F1D5', text: '#292525' },
        disabled: { background: '#fffcf0', text: '#292525' },
      },
      list: {
        normal: { text: '#292525', border: 'none' },
        selected: { text: '#292525', border: 'none' },
      },
      summary: { background: '#292525', text: '#F9F1D5', border: 'none' },
      form: {
        normal: { background: '#363535', text: '#F9F1D5', border: 'none' },
        error: { background: '#F9F1D5', text: '#292525' },
      },
    },
    spacing: { padding: '23px 24px 24px 24px' },
  },
  localization: {
    locale: 'fr-EU',
    tickets: { continueButton: 'Continuer' },
    times: {
      selectTimeTitle: "Choisir l'heure",
      noAvailableTimes: 'Pas de créneaux pour ce jour',
      continueButton: 'Je continue',
      loadingText: 'Chargement des horaires...',
    },
    guestForm: {
      firstNameFieldLabel: 'Prénom',
      firstNameFieldError: 'Rentrez votre prénom',
      lastNameFieldLabel: 'Nom',
      lastNameFieldError: 'Rentrez votre nom',
      emailFieldLabel: 'E-mail',
      emailFieldError: 'Rentrez votre adresse mail',
      emailFieldInvalidError: 'Veuillez fournir une adresse mail valide',
    },
    form: { selectOption: '' },
    successScreen: {
      title: 'Réservation enregistrée !',
      description: 'Un email avec le lien de paiement vous a été envoyé.',
      bookAgain: 'Nouvelle réservation',
    },
    pendingScreen: {
      title: 'Réservation en attente',
      description: 'Un email avec le lien de paiement vous a été envoyé.',
      bookAgain: 'Nouvelle réservation',
    },
    terms: { urls: [{ text: 'terms and conditions', url: '/terms' }] },
    bookButton: 'Réserver',
    backButton: 'Retour',
    loadingText: 'Chargement..',
  },
  servicesConfig: { services: [] },
}

export default function TestReservationPage() {
  const [serviceId, setServiceId] = useState('')
  const [widgetActive, setWidgetActive] = useState(false)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  function initWidget() {
    if (!serviceId.trim() || !scriptLoaded || !containerRef.current) return
    containerRef.current.innerHTML = ''
    const config = { ...BOOKLA_CONFIG, serviceId: serviceId.trim() }
    window.BookingWidgetStandalone.initBookingWidget(containerRef.current, config)
    setWidgetActive(true)
  }

  useEffect(() => {
    if (widgetActive && scriptLoaded && containerRef.current) {
      initWidget()
    }
  }, [scriptLoaded])

  return (
    <div className="min-h-screen bg-[#292525] text-[#F9F1D5] p-6">
      <Script
        src="https://bookla.pages.dev/booking-widget-standalone-v1.1.1.global.js"
        onLoad={() => setScriptLoaded(true)}
      />

      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Test Reservation</h1>
        <p className="text-sm text-[#F9F1D5]/60 mb-6">
          Page de test pour le widget Bookla. Entre l&apos;ID du service et lance le widget.
        </p>

        <div className="flex gap-3 mb-8">
          <input
            type="text"
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            placeholder="ID du service Bookla"
            className="flex-1 px-4 py-2 bg-[#363535] border border-[#F9F1D5]/20 rounded-lg text-[#F9F1D5] placeholder-[#F9F1D5]/40 focus:outline-none focus:border-[#44998A]"
          />
          <button
            onClick={initWidget}
            disabled={!serviceId.trim() || !scriptLoaded}
            className="px-6 py-2 bg-[#44998A] text-[#F9F1D5] rounded-lg font-medium hover:bg-[#2f6a5f] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Lancer
          </button>
        </div>

        <div
          ref={containerRef}
          className="bookla-widget"
        />

        {!widgetActive && (
          <div className="text-center py-20 text-[#F9F1D5]/40">
            {scriptLoaded
              ? 'Entre un ID de service et clique sur "Lancer"'
              : 'Chargement du widget Bookla...'}
          </div>
        )}
      </div>
    </div>
  )
}
