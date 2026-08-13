---
name: Industrial Intelligence Framework
colors:
  surface: '#fbf9fa'
  surface-dim: '#dbd9db'
  surface-bright: '#fbf9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f4'
  surface-container: '#efedef'
  surface-container-high: '#e9e7e9'
  surface-container-highest: '#e4e2e3'
  on-surface: '#1b1c1d'
  on-surface-variant: '#44474c'
  inverse-surface: '#303032'
  inverse-on-surface: '#f2f0f2'
  outline: '#74777d'
  outline-variant: '#c4c6cd'
  surface-tint: '#4f6073'
  primary: '#041627'
  on-primary: '#ffffff'
  primary-container: '#1a2b3c'
  on-primary-container: '#8192a7'
  inverse-primary: '#b7c8de'
  secondary: '#006a6a'
  on-secondary: '#ffffff'
  secondary-container: '#90efef'
  on-secondary-container: '#006e6e'
  tertiary: '#001435'
  on-tertiary: '#ffffff'
  tertiary-container: '#00285b'
  on-tertiary-container: '#4a8eff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d2e4fb'
  primary-fixed-dim: '#b7c8de'
  on-primary-fixed: '#0b1d2d'
  on-primary-fixed-variant: '#38485a'
  secondary-fixed: '#93f2f2'
  secondary-fixed-dim: '#76d6d5'
  on-secondary-fixed: '#002020'
  on-secondary-fixed-variant: '#004f4f'
  tertiary-fixed: '#d8e2ff'
  tertiary-fixed-dim: '#adc7ff'
  on-tertiary-fixed: '#001a41'
  on-tertiary-fixed-variant: '#004493'
  background: '#fbf9fa'
  on-background: '#1b1c1d'
  surface-variant: '#e4e2e3'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  data-numeral:
    fontFamily: JetBrains Mono
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 24px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  sidebar_width: 260px
  container_max_width: 1440px
  gutter: 1.5rem
  margin_desktop: 2rem
  stack_gap_sm: 0.5rem
  stack_gap_md: 1rem
  stack_gap_lg: 2rem
---

## Brand & Style

This design system is engineered for high-stakes industrial environments where data precision and operator focus are paramount. The aesthetic follows a **Corporate / Modern** approach with a heavy emphasis on **Functional Minimalism**. 

The UI prioritizes clarity over decoration, using a structured layout to reduce cognitive load during complex process monitoring. The atmosphere is professional, sophisticated, and authoritative, evoking a sense of "digital twin" accuracy. Key visual signatures include strict grid alignment, high-contrast status signaling, and a tiered information architecture that separates background environmental data from critical actionable insights.

## Colors

The palette is anchored by **Deep Navy (#1A2B3C)**, used for text and primary navigation to provide a grounded, industrial feel. **Teal (#008080)** serves as the primary action color, offering a distinct visual departure from standard corporate blues to signify specialized industrial software.

Status colors are calibrated for high legibility against white surfaces:
- **Normal:** Deep green for stability.
- **Caution:** Amber for high visibility without immediate alarm.
- **Anomaly:** Bold red for urgent intervention.

The background uses a cool **Light Grey (#F5F7FA)** to define the workspace, while **White (#FFFFFF)** cards isolate specific data clusters, creating a clear physical separation between different stages of the coke oven gas process.

## Typography

This system utilizes **Hanken Grotesk** for primary interface elements due to its sharp, contemporary geometry and exceptional readability in dense layouts. It provides a technical but approachable feel.

For technical data, sensor readings, and timestamps, **JetBrains Mono** is employed. The monospaced nature of this font ensures that numerical values align perfectly in tables and dashboards, allowing operators to scan for fluctuations in gas levels or temperature with zero character-width distraction.

- **Headlines:** Use Bold weights for primary KPIs.
- **Labels:** Use All-caps Monospaced for sensor IDs (e.g., COG-VLV-01).
- **Body:** Use Regular weight for descriptions and tooltips.

## Layout & Spacing

The design system uses a **Fixed Grid** model centered on a 1440px desktop experience. 

- **Sidebar:** A fixed 260px left-hand navigation contains the primary modules: Integrated Status, Process Data Analysis, and Reference System.
- **Main Canvas:** Content is housed in a flexible area to the right of the sidebar with a minimum 32px (2rem) outer margin.
- **Grid:** A 12-column system is used within the main canvas. Data cards typically span 3, 4, or 6 columns depending on the complexity of the visualization.
- **Rhythm:** An 8px base unit drives all spacing. Consistent gaps of 16px (gutter) between cards ensure the interface feels organized and breathable despite high data density.

## Elevation & Depth

To maintain a clean, industrial aesthetic, this system avoids heavy shadows. Instead, it uses **Tonal Layers** and **Low-Contrast Outlines**:

- **Level 0 (Background):** #F5F7FA (Base page).
- **Level 1 (Cards/Sidebar):** White #FFFFFF with a very subtle 1px border (#E2E8F0) and an elegant, highly-diffused shadow (Y: 2px, Blur: 8px, Opacity: 4% Black).
- **Level 2 (Modals/Popovers):** White #FFFFFF with a medium shadow (Y: 10px, Blur: 20px, Opacity: 8% Black) to indicate temporary overlay.

This subtle elevation ensures that cards feel "seated" on the page rather than floating, reinforcing a sense of stability and reliability.

## Shapes

The shape language is "Professional Soft." UI elements use a **0.5rem (8px)** base radius. This creates a modern look that is more approachable than sharp corners but maintains a technical edge.

- **Primary Cards:** 8px (rounded-md).
- **Outer Containers/Large Sections:** 12px (rounded-lg).
- **Status Badges & Buttons:** 4px or fully pill-shaped (for Synthetic Data indicators).
- **Inputs:** 6px for a precise, crisp appearance.

## Components

### Synthetic Data Badges
A recurring element to distinguish AI-generated or simulated data from raw sensor data.
- **Style:** Pill-shaped, semi-transparent Teal (#008080) background at 10% opacity with a 1px solid Teal border. 
- **Typography:** 11px JetBrains Mono, All-caps.

### Status Indicators
Combined icon and text labels for immediate state recognition.
- **Structure:** [Icon] + [Label Text]. 
- **Coloring:** The entire component (icon and text) inherits the status color (Success, Warning, or Danger).

### Data Cards
- **Header:** Contains the metric name (Hanken Grotesk, 14px, Bold) and a "More" icon.
- **Body:** Features the primary KPI in JetBrains Mono (24px+) with a secondary sparkline or trend percentage below it.

### Buttons
- **Primary Action:** Solid Teal (#008080) with White text. 8px corner radius.
- **Secondary/Ghost:** Deep Navy (#1A2B3C) outline with transparent center.

### Input Fields
- **State:** 1px border (#CBD5E1). On focus, the border shifts to Teal (#008080) with a 2px outer glow of the same color at 20% opacity.

### Navigation Sidebar
- **Active State:** A vertical Teal bar (4px width) on the left edge of the active menu item, with the menu text shifting to Deep Navy Bold.
- **Icons:** Outlined 20px stroke icons for a clean, non-distracting visual aid.