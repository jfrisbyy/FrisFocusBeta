# FrisFocus - Design Guidelines

## Design Approach

**Selected Framework:** Design System Approach with Material Design principles adapted for dark mode productivity applications, inspired by Linear and Notion's clean data-dense interfaces.

**Core Philosophy:** Utility-first design prioritizing clarity, efficiency, and at-a-glance understanding of progress metrics. The interface should motivate users through clear visual feedback while maintaining distraction-free focus.

## Typography System

**Font Families:**
- Primary: Inter or similar (UI elements, data tables, numbers)
- Secondary: JetBrains Mono or similar (point values, dates, numerical data)

**Hierarchy:**
- Hero/Page Titles: 2xl to 3xl, font-semibold (e.g., "FrisFocus")
- Section Headers: xl, font-semibold
- Card Titles: lg, font-medium
- Body Text: base, font-normal
- Numerical Data: lg to xl, font-mono, font-semibold
- Labels/Meta: sm, font-medium, opacity-70

## Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, 16 for consistent rhythm
- Component padding: p-4 to p-6
- Section spacing: space-y-8 to space-y-12
- Card gaps: gap-4 to gap-6
- Page margins: px-4 to px-8

**Grid Structure:**
- Dashboard: 2-column layout on desktop (main metrics + weekly breakdown)
- Daily Page: Single column with grouped task sections
- Tasks Management: List view with inline editing capabilities

## Component Library

### Navigation
- Minimal top bar with app title and page links
- Active page indicator with subtle border or background treatment
- Fixed positioning for easy access across pages

### Dashboard Components

**Points Display Card:**
- Large numerical display (3xl to 4xl) showing current week total
- Color-coded background or border based on threshold:
  - Green treatment: >400 points
  - Yellow treatment: 250-400 points  
  - Red treatment: <250 points
- Subtle progress indicator or threshold markers
- Week date range displayed prominently

**Weekly Summary Table:**
- Compact 7-row table (one per day)
- Columns: Date, Daily Points, Status indicator
- Monospace font for numerical alignment
- Row hover states for interactivity
- Missing days shown with muted treatment

**Boosters Section:**
- Badge-style indicators for achieved boosters
- Icons or checkmarks for visual scanning
- Clear +10 point indicators
- Grouped display of all possible boosters with active/inactive states

### Daily Page Components

**Date Selector:**
- Prominent date picker at top
- Previous/Next day navigation buttons
- "Today" quick-action button

**Task Checklist:**
- Grouped by category with clear section dividers
- Each task shows: checkbox, name, point value
- Positive values in green accent, negative in red accent
- Real-time points calculator showing running total
- Category headers with collapse/expand functionality

**Daily Summary Panel:**
- Sticky/fixed position showing current daily total
- Point breakdown (positive sum, negative sum, net total)
- Notes input field for daily reflections

### Tasks Management Components

**Task List:**
- Table or card layout with columns: Name, Value, Category, Group, Booster flag
- Inline editing capabilities
- Quick actions: Edit, Delete icons
- Visual distinction for booster tasks (badge or icon)

**Add/Edit Task Form:**
- Modal or side panel overlay
- Input fields: Name, Value (number), Category (dropdown/input), Group, isBooster (toggle)
- Clear save/cancel actions
- Validation feedback for required fields

## Visual Treatments

**Cards/Containers:**
- Subtle border or elevated shadow (not both)
- Rounded corners (rounded-lg)
- Consistent padding (p-6)

**Data Tables:**
- Minimal borders (border-b on rows)
- Zebra striping optional for readability
- Aligned numerical columns (text-right)

**Interactive Elements:**
- Clear hover states with background/border changes
- Checkboxes: Large touch targets (at least h-5 w-5)
- Buttons: Solid fills for primary actions, outline for secondary

**Status Indicators:**
- Use small dots, badges, or icons
- Consistent positioning (typically right-aligned)
- Color-coded per point system

## User Experience Patterns

**Progressive Disclosure:**
- Dashboard shows overview, click for details
- Categories collapsed by default on Daily page, expand on interaction
- Boosters explained with tooltips or help icons

**Feedback Mechanisms:**
- Immediate point calculation on task toggle
- Success confirmations for task creation/updates
- Loading states for data fetches
- Empty states with helpful CTAs

**Navigation Flow:**
- Dashboard as home/default view
- Easy access to "Today's Tasks" from any page
- Breadcrumb or clear page title for orientation

## Responsive Behavior

**Desktop (lg+):**
- Multi-column layouts where appropriate (Dashboard)
- Side-by-side forms and previews

**Tablet (md):**
- Stack to single column
- Maintain table layouts with horizontal scroll if needed

**Mobile (base):**
- Full-width components
- Larger touch targets
- Simplified tables (card-style layouts)
- Sticky header with condensed navigation

## Key Implementation Notes

- All numerical displays use monospace fonts for alignment
- Point values always visible alongside tasks (not hidden in tooltips)
- Critical actions (task completion) require minimal clicks
- Weekly summary dynamically updates as daily logs change
- Booster achievements celebrated with subtle animations (badge pulse)
- Dark theme throughout with sufficient contrast for accessibility