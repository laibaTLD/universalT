'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { X } from 'lucide-react';
import gsap from 'gsap';
import { useWebBuilder } from '@/app/providers/WebBuilderProvider';
import { hasLegalBody } from '@/app/lib/legal';

interface ContactSideFormProps {
  isOpen: boolean;
  onClose: () => void;
}

function UnderlineField({
  label,
  children,
  mutedColor,
}: {
  label: string;
  children: React.ReactNode;
  mutedColor: string;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-xs" style={{ color: mutedColor }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export const ContactSideForm: React.FC<ContactSideFormProps> = ({ isOpen, onClose }) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const { site } = useWebBuilder();
  const theme = site?.theme;
  const primary =
    theme?.primaryButtonColorLight ||
    theme?.primaryButtonColorDark ||
    theme?.hoverActiveColorLight ||
    '#C5A028';
  const text =
    theme?.lightPrimaryColor ||
    theme?.mainTextColor ||
    theme?.darkPrimaryColor ||
    '#1a3c34';
  const muted =
    theme?.lightSecondaryColor ||
    theme?.secondaryTextColor ||
    theme?.darkSecondaryColor ||
    '#5a6b66';
  const surface = theme?.pageBackgroundColor || '#ffffff';
  const textOnDark = theme?.textOnDarkColor || '#ffffff';
  const primaryHover = theme?.hoverActiveColorLight || primary;
  const headingFont = theme?.headingFont || 'Georgia, serif';
  const bodyFont = theme?.bodyFont || 'inherit';
  const hasPrivacyPolicy = hasLegalBody(site?.legal?.privacyPolicy);
  const [mounted, setMounted] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    time: '',
    source: '',
    acceptedTerms: false,
  });

  const underlineClass =
    'w-full border-0 border-b bg-transparent py-1.5 text-sm outline-none transition-colors placeholder:opacity-40';

  const onFocusLine = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderBottomColor = primary;
  };
  const onBlurLine = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderBottomColor = `color-mix(in srgb, ${primary} 35%, transparent)`;
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const tl = gsap.timeline();
      tl.to(overlayRef.current, {
        opacity: 1,
        visibility: 'visible',
        duration: 0.5,
        ease: 'power2.out',
      }).to(
        formRef.current,
        { x: 0, duration: 0.8, ease: 'expo.out' },
        '-=0.3'
      );
    } else {
      const tl = gsap.timeline({
        onComplete: () => {
          document.body.style.overflow = '';
        },
      });
      tl.to(formRef.current, { x: '100%', duration: 0.6, ease: 'expo.in' }).to(
        overlayRef.current,
        { opacity: 0, visibility: 'hidden', duration: 0.4 },
        '-=0.2'
      );
    }
  }, [isOpen, mounted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          siteId: site?._id,
          subject: `Request for Information - ${formData.name}`,
          message: `Phone: ${formData.phone}\nCallback Time: ${formData.time}\nSource: ${formData.source}`,
        }),
      });

      if (response.ok) {
        setSubmitMessage('Sent successfully');
        setTimeout(() => {
          onClose();
          setSubmitMessage('');
          setFormData({
            name: '',
            email: '',
            phone: '',
            time: '',
            source: '',
            acceptedTerms: false,
          });
        }, 2000);
      } else {
        setSubmitMessage('Failed to send');
      }
    } catch {
      setSubmitMessage('Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  const themeVars = {
    ['--wb-primary' as string]: primary,
    ['--wb-primary-hover' as string]: primaryHover,
    ['--wb-text-main' as string]: text,
    ['--wb-text-secondary' as string]: muted,
    ['--wb-page-bg' as string]: surface,
    ['--wb-text-on-dark' as string]: textOnDark,
    ['--wb-heading-font' as string]: headingFont,
    ['--wb-body-font' as string]: bodyFont,
  } as React.CSSProperties;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] overflow-hidden pointer-events-none"
      style={themeVars}
    >
      <div
        ref={overlayRef}
        onClick={onClose}
        className="absolute inset-0 opacity-0 invisible pointer-events-auto cursor-pointer"
        style={{ backgroundColor: `color-mix(in srgb, ${text} 30%, transparent)` }}
        aria-hidden
      />

      <div
        ref={formRef}
        className="pointer-events-auto absolute inset-y-0 right-0 flex h-[100dvh] w-full max-w-[440px] translate-x-full flex-col overflow-hidden border-l"
        style={{
          top: 0,
          backgroundColor: surface,
          borderColor: `color-mix(in srgb, ${primary} 12%, transparent)`,
          boxShadow: `-12px 0 40px color-mix(in srgb, ${text} 8%, transparent)`,
          color: text,
          fontFamily: bodyFont,
        }}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="mx-auto flex w-full max-w-[360px] flex-col px-6 pb-8 pt-6 md:px-8 md:pt-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <header className="min-w-0 flex-1 space-y-2">
                <h2
                  className="pt-1 text-[1.45rem] font-semibold leading-[1.2] md:text-[1.6rem]"
                  style={{ fontFamily: headingFont, color: text }}
                >
                  Would you like
                  <br />
                  more information?
                </h2>
                <p className="text-xs leading-snug" style={{ color: muted }}>
                  If you have any questions, tell us when it is better for us to call you.
                </p>
              </header>

              <button
                type="button"
                onClick={onClose}
                className="shrink-0 p-1 transition-opacity hover:opacity-80"
                style={{ color: primary }}
                aria-label="Close form"
              >
                <X size={20} strokeWidth={1.25} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <UnderlineField label="Name and surname" mutedColor={muted}>
                <input
                  type="text"
                  required
                  className={underlineClass}
                  style={{
                    color: text,
                    borderBottomColor: `color-mix(in srgb, ${primary} 35%, transparent)`,
                  }}
                  onFocus={onFocusLine}
                  onBlur={onBlurLine}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </UnderlineField>

              <UnderlineField label="Mail" mutedColor={muted}>
                <input
                  type="email"
                  required
                  className={underlineClass}
                  style={{
                    color: text,
                    borderBottomColor: `color-mix(in srgb, ${primary} 35%, transparent)`,
                  }}
                  onFocus={onFocusLine}
                  onBlur={onBlurLine}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </UnderlineField>

              <div className="grid grid-cols-2 gap-4">
                <UnderlineField label="Telephone" mutedColor={muted}>
                  <input
                    type="tel"
                    className={underlineClass}
                    style={{
                      color: text,
                      borderBottomColor: `color-mix(in srgb, ${primary} 35%, transparent)`,
                    }}
                    onFocus={onFocusLine}
                    onBlur={onBlurLine}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </UnderlineField>

                <UnderlineField label="Preferable time" mutedColor={muted}>
                  <input
                    type="text"
                    className={underlineClass}
                    style={{
                      color: text,
                      borderBottomColor: `color-mix(in srgb, ${primary} 35%, transparent)`,
                    }}
                    onFocus={onFocusLine}
                    onBlur={onBlurLine}
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </UnderlineField>
              </div>

              <UnderlineField label="Where did you find us" mutedColor={muted}>
                <input
                  type="text"
                  className={underlineClass}
                  style={{
                    color: text,
                    borderBottomColor: `color-mix(in srgb, ${primary} 35%, transparent)`,
                  }}
                  onFocus={onFocusLine}
                  onBlur={onBlurLine}
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                />
              </UnderlineField>

              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 shrink-0 rounded border"
                  style={{
                    accentColor: primary,
                    borderColor: `color-mix(in srgb, ${primary} 40%, transparent)`,
                  }}
                  required
                  checked={formData.acceptedTerms}
                  onChange={(e) =>
                    setFormData({ ...formData, acceptedTerms: e.target.checked })
                  }
                />
                <span
                  className="text-[10px] font-medium uppercase leading-snug tracking-[0.06em]"
                  style={{ color: muted }}
                >
                  I accept the{' '}
                  {hasPrivacyPolicy ? (
                    <Link
                      href="/privacy-policy"
                      className="underline underline-offset-2 transition-opacity hover:opacity-80"
                      style={{ color: primary }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      privacy policy
                    </Link>
                  ) : (
                    'privacy policy'
                  )}
                </span>
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center py-3.5 text-xs font-bold uppercase tracking-[0.35em] transition-all duration-300 hover:opacity-95 active:scale-[0.995] disabled:opacity-55"
                style={{
                  backgroundColor: primary,
                  color: textOnDark,
                }}
              >
                {isSubmitting ? 'Sending…' : submitMessage || 'Send'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ContactSideForm;
