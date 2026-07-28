'use client';

import { useMemo } from 'react';
import { useWebBuilder } from '@/app/providers/WebBuilderProvider';
import {
  pageSurfaceToneFromBackground,
  sectionBorderClass,
  sectionGlassClass,
  sectionHairlineClass,
  sectionSurfaceClass,
  sectionTextCssVar,
  sectionTextPrimaryClass,
  sectionTextSecondaryClass,
  type SectionSurfaceTone,
} from '@/app/lib/utils';

export interface ThemeColors {
  // Text colors
  mainText: string;
  secondaryText: string;
  darkPrimaryText: string;
  darkSecondaryText: string;
  lightPrimaryText: string;
  lightSecondaryText: string;
  // Background colors
  pageBackground: string;
  sectionBackground: string;
  sectionBackgroundLight: string;
  sectionBackgroundDark: string;
  cardBackground: string;
  cardBackgroundLight: string;
  cardBackgroundDark: string;
  // Button/UI colors
  primaryButton: string;
  primaryButtonLight: string;
  primaryButtonDark: string;
  hoverActive: string;
  hoverActiveLight: string;
  hoverActiveDark: string;
  inactive: string;
  inactiveLight: string;
  inactiveDark: string;

}

export interface ThemeFonts {
  heading?: string;
  body?: string;
}

export function useThemeColors(): ThemeColors {
  const { site } = useWebBuilder();
  const theme = site?.theme;

  return {
    // These now refer to the CSS variables that are injected by ThemeFontWrapper
    mainText: 'var(--wb-text-main)',
    secondaryText: 'var(--wb-text-secondary)',
    darkPrimaryText: 'var(--wb-text-on-dark)',
    darkSecondaryText: 'var(--wb-text-on-dark-secondary)',
    lightPrimaryText: 'var(--wb-text-main)',
    lightSecondaryText: 'var(--wb-text-secondary)',
    pageBackground: 'var(--wb-page-bg)',
    sectionBackground: 'var(--wb-section-bg-light)',
    sectionBackgroundLight: 'var(--wb-section-bg-light)',
    sectionBackgroundDark: 'var(--wb-section-bg-dark)',
    cardBackground: 'var(--wb-card-bg-light)',
    cardBackgroundLight: 'var(--wb-card-bg-light)',
    cardBackgroundDark: 'var(--wb-card-bg-dark)',
    primaryButton: 'var(--wb-primary)',
    primaryButtonLight: 'var(--wb-primary)',
    primaryButtonDark: 'var(--wb-primary)',
    hoverActive: 'var(--wb-primary-hover)',
    hoverActiveLight: 'var(--wb-primary-hover)',
    hoverActiveDark: 'var(--wb-primary-hover)',
    inactive: 'var(--color-gray-400)',
    inactiveLight: 'var(--color-gray-300)',
    inactiveDark: 'var(--color-gray-600)',
  };
}

export function useThemeFonts(): ThemeFonts {
  return {
    heading: 'var(--wb-heading-font, Georgia, serif)',
    body: 'var(--wb-body-font, inherit)',
  };
}

/** Light vs dark text/surface tokens based on site builder `pageBackgroundColor`. */
export function usePageSurfaceTone(): SectionSurfaceTone {
  const { site } = useWebBuilder();
  return useMemo(
    () => pageSurfaceToneFromBackground(site?.theme?.pageBackgroundColor),
    [site?.theme?.pageBackgroundColor]
  );
}

/** Section surface + contrasting text (light copy on dark sections, dark copy on light sections). */
export function useSectionContrast(surfaceTone: SectionSurfaceTone) {
  return useMemo(
    () => ({
      surfaceTone,
      surface: sectionSurfaceClass(surfaceTone),
      hairline: sectionHairlineClass(surfaceTone),
      textPrimary: sectionTextPrimaryClass(surfaceTone),
      textSecondary: sectionTextSecondaryClass(surfaceTone),
      border: sectionBorderClass(surfaceTone),
      textVar: sectionTextCssVar(surfaceTone),
      glass: (strong = false) => sectionGlassClass(surfaceTone, strong),
    }),
    [surfaceTone]
  );
}
