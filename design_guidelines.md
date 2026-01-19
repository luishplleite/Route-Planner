# RotaCerta Design Guidelines

## Design Approach
**System:** Hybrid of Material Design + Modern SaaS (Linear-inspired)
**Rationale:** Professional delivery management demands clarity, data density, and reliable patterns. Drawing from Linear's clean typography and Material Design's robust component system for map-heavy interfaces.

## Core Design Elements

### Typography
- **Primary Font:** Inter (400, 500, 600, 700)
- **Monospace:** JetBrains Mono (for route codes, coordinates)
- **Scale:** Text-sm for labels, text-base for body, text-lg for section headers, text-2xl-4xl for page titles
- **Hierarchy:** Bold weights (600-700) for route names/stops, medium (500) for metrics, regular for descriptions

### Layout System
**Spacing Primitives:** Tailwind units 2, 4, 6, 8, 12, 16
- Component padding: p-4 to p-6
- Section spacing: gap-8 to gap-12
- Card margins: m-4, spacing-6 between items
- Dense data tables: p-2 to p-4

### Component Library

**Dashboard Layout:**
- Sidebar navigation (240px width) with route list, financial summary, settings
- Main content area with embedded map view (60% width) + delivery stops panel (40% width, scrollable)
- Top bar: breadcrumbs, user profile, theme toggle, notification bell

**Map Interface:**
- Full-height map container with overlaid controls (top-right: zoom, layers; bottom-left: legend)
- Route polylines with numbered markers (1, 2, 3...) for delivery sequence
- Active stop highlighted with pulsing animation
- Floating route summary card (top-left) showing: total distance, ETA, stops completed/total

**Delivery Stops Panel:**
- Card-based list with clear stop numbers
- Each card shows: address (bold), customer name, time window, package details, status badge
- Drag handles for manual reordering
- Expandable sections for stop notes/special instructions
- Color-coded status: Pending (neutral), In Progress (blue accent), Completed (green), Failed (red)

**Route Optimization Interface:**
- "Optimize Route" prominent button with loading state during TSP calculation
- Before/after comparison view showing distance/time savings
- Manual override controls for locked stops (e.g., "Visit first")

**Financial Tracking:**
- Metric cards grid (2x2): Total Revenue, Fuel Costs, Profit Margin, Deliveries Completed
- Line chart for daily/weekly financial trends
- Detailed transaction table with sortable columns
- Export functionality clearly visible

**Forms & Inputs:**
- Floating labels for text inputs
- Clear validation states with inline error messages
- Autocomplete for address entry (Google Places integration)
- Date/time pickers for delivery windows
- Toggle switches for preferences (dark/light theme)

**Navigation:**
- Icon + label sidebar menu items
- Active state: subtle left border accent + background tint
- Collapsible sidebar for focused map view
- Breadcrumb trail in header

**Data Displays:**
- Compact tables with zebra striping (theme-aware)
- Sticky headers for long scrolling lists
- Quick action buttons (edit, delete, duplicate) on row hover
- Badge components for status indicators

## Images

**Hero Section:** (1400x600px)
Professional delivery van on urban street at golden hour, driver visible checking tablet/phone. Conveys reliability and modern logistics. Placed above main dashboard content on landing/marketing page.

**Empty States:**
- Map with no routes: Illustration of planning/optimization concept
- No financial data: Simple chart/graph icon with friendly messaging

**Dashboard:** No hero image; immediately show functional interface with map + delivery panel.

## Animations
Minimal, functional only:
- Smooth map panning/zooming (300ms ease)
- Route polyline drawing animation on load (800ms)
- Status badge transitions (200ms)
- Loading spinners during optimization

## Theme Implementation
- Maintain identical component structure across themes
- Dark: Deep grays (#1a1a1a backgrounds, #2d2d2d cards)
- Light: Crisp whites (#ffffff backgrounds, #f5f5f5 cards)
- Accent color remains consistent across both themes
- Text contrast ratios meet WCAG AA standards

## Buttons on Images
Hero CTA buttons: backdrop-blur-md with semi-transparent background, white text with subtle shadow for readability against any image brightness.