# DESIGN SYSTEM — LIVO
> Web Style Guide · Based on Tailwind CSS v3.0  
> Source: [Figma — DESIGN_SYSTEM-LIVO](https://www.figma.com/design/K0waDrR4DsfiEzUwL4rGWa/DESIGN_SYSTEM-LIVO)  
> Company: Lentesplus SAS · livo.com

---

## 📌 Instructions for Claude

When working on a LIVO project or any project using this design system, apply **all** rules in this document as the source of truth for design. Always prioritize:
1. The color tokens defined here (do not invent new colors)
2. The official typefaces (Ballinger, Poppins, T29 Carbon)
3. Components with their exact variants and states
4. The base-4px spacing system
5. The defined responsive breakpoints

---

## 1. BRAND IDENTITY

| Principle | Description |
|-----------|-------------|
| **Clarity** | Interfaces free of visual noise with clear typographic hierarchy |
| **Consistency** | Uniform tokens and components across all products |
| **Scalability** | System extensible from mobile to desktop |

- **Base stack:** Tailwind CSS v3.0
- **Design viewport:** 1440px (desktop)
- **Year:** 2025

---

## 2. COLOR SYSTEM

### 2.1 Primary Palette

| Name | Hex | Tailwind Token | Primary use |
|------|-----|----------------|-------------|
| **Electric Blue** | `#0000E1` | `blue-600` | CTA · Links · Focus · Brand identity |
| **Lime** | `#DEFF00` | `lime-300` | Highlight · Energy · Contrast |
| **Pure Black** | `#000000` | `black` | Text · Dark backgrounds |
| **White** | `#FFFFFF` | `white` | Background · Inverted text |

### 2.2 Secondary Palette

| Name | Hex | Tailwind Token | Primary use |
|------|-----|----------------|-------------|
| **Vivid Orange** | `#FC4F00` | `orange-500` | Urgency · Alerts · Promotions |
| **Warm Sand** | `#AB8F68` | `stone-400` | Texture · Warm support |
| **Gray** | `#F0F0F0` | `gray-100` | Subtle backgrounds · Dividers |
| **Pink** | `#D92D8E` | `pink-600` | Campaigns · Discounts · Promos |

---

## 3. TONAL SCALES (Tailwind 50 → 900)

### 3.1 BLUE (Electric Blue base: #0000E1)

| Token | Hex |
|-------|-----|
| `blue-50` | `#F2F2FD` |
| `blue-100` | `#E5E5FC` |
| `blue-200` | `#CCCCF9` |
| `blue-300` | `#A6A6F4` |
| `blue-400` | `#6666ED` |
| `blue-500` | `#0000E1` ← **base** |
| `blue-600` | `#0000BF` |
| `blue-700` | `#00009D` |
| `blue-800` | `#000071` |
| `blue-900` | `#000044` |

### 3.2 LIME (base: #DEFF00)

| Token | Hex |
|-------|-----|
| `lime-50` | `#FDFFF2` |
| `lime-100` | `#FCFFE5` |
| `lime-200` | `#F8FFCC` |
| `lime-300` | `#F3FFA6` |
| `lime-400` | `#EBFF66` |
| `lime-500` | `#DEFF00` ← **base** |
| `lime-600` | `#BDD900` |
| `lime-700` | `#9BB200` |
| `lime-800` | `#6F8000` |
| `lime-900` | `#434D00` |

### 3.3 ORANGE (base: #FC4F00)

| Token | Hex |
|-------|-----|
| `orange-50` | `#FFF6F2` |
| `orange-100` | `#FFEDE5` |
| `orange-200` | `#FEDCCC` |
| `orange-300` | `#FEC1A6` |
| `orange-400` | `#FD9566` |
| `orange-500` | `#FC4F00` ← **base** |
| `orange-600` | `#D64300` |
| `orange-700` | `#B03700` |
| `orange-800` | `#7E2800` |
| `orange-900` | `#4C1800` |

### 3.4 PINK (base: #D92D8E)

| Token | Hex |
|-------|-----|
| `pink-50` | `#FDF4F9` |
| `pink-100` | `#FBEAF4` |
| `pink-200` | `#F7D5E8` |
| `pink-300` | `#F2B6D7` |
| `pink-400` | `#E881BB` |
| `pink-500` | `#D92D8E` ← **base** |
| `pink-600` | `#B82679` |
| `pink-700` | `#982063` |
| `pink-800` | `#6D1747` |
| `pink-900` | `#410E2B` |

---

## 4. COLOR HIERARCHY (Semantic Usage)

> Golden rule: **Electric Blue → action · Lime → highlight · Black/White → structure · Orange & Pink → urgency/promo · Gray → neutral support**

| Color | Semantic role | Concrete uses |
|-------|---------------|---------------|
| Electric Blue `#0000E1` | **PRIMARY · Action** | Logo, headings, CTA buttons, links, focus ring, icons |
| Lime `#DEFF00` | **PRIMARY · Energy** | Highlight badges, hover accent, alternative CTA, "NEW", "FEATURED" |
| Pure Black `#000000` | **PRIMARY · Structure** | Body text, dark backgrounds, maximum contrast |
| White `#FFFFFF` | **PRIMARY · Base** | Backgrounds, cards, inverted text on blue |
| Vivid Orange `#FC4F00` | **SECONDARY · Urgency** | Alerts, notifications, time-sensitive promos, "URGENT" badges |
| Pink `#D92D8E` | **SECONDARY · Promo** | Campaigns, sale badges, Black Friday, "50% OFF" discounts |
| Gray `#F0F0F0` | **SECONDARY · Neutral** | Subtle backgrounds, neutral cards, dividers, borders |
| Warm Sand `#AB8F68` | **SECONDARY · Warm** | Textures, warm support elements |

---

## 5. TYPOGRAPHY

### 5.1 Typefaces

| Family | Role | Tailwind Token | Available weights |
|--------|------|----------------|-------------------|
| **Ballinger** | Headings & Display | `font-display` | Bold · Extra Bold |
| **Poppins** | Body & UI | `font-body` | Regular · Medium · Bold |
| **T29 Carbon** | Numbers & Prices | `font-mono` | Regular · Bold |

### 5.2 Type Scale — Tailwind CSS

| Tailwind Token | Size | Use |
|----------------|------|-----|
| `text-xs` | 12px | Captions, labels, annotations |
| `text-sm` | 14px | Secondary text, buttons, inputs |
| `text-base` | 16px | Body (default) |
| `text-lg` | 18px | Lead text, intro |
| `text-xl` | 20px | Card titles |
| `text-2xl` | 24px | Section heading — H4 |
| `text-3xl` | 30px | Subheading — H3 |
| `text-4xl` | 36px | Heading — H2 |
| `text-5xl` | 48px | Title — H1 |
| `text-6xl` | 60px | Display / Hero |

### 5.3 Typography Rules

- Headings (`h1`–`h4`): always **Ballinger Bold/ExtraBold** + `font-display`
- Body copy, labels, UI text: **Poppins Regular/Medium/Bold** + `font-body`
- Prices, counters, numeric data: **T29 Carbon** + `font-mono`
- `tracking-[0.5px]` on buttons and highlighted labels
- Primary text color: `#111` or `black`
- Secondary text: `#666`
- Subtle/placeholder text: `#AAA` or `#CCC`

---

## 6. GRID & LAYOUT

### 6.1 Breakpoints

| Device | Viewport | Columns | Gutter | Margin |
|--------|----------|---------|--------|--------|
| 📱 Mobile | 375px | 4 cols | 16px | 16px |
| 📟 Tablet | 768px | 8 cols | 16px | 24px |
| 🖥 Desktop | 1440px | 12 cols | 24px | 80px |

### 6.2 Spacing Scale — Base 4px

| Tailwind Token | Value | Semantic use |
|----------------|-------|--------------|
| `p-1` | 4px | Micro gap |
| `p-2` | 8px | Inline spacing |
| `p-3` | 12px | — |
| `p-4` | 16px | Component padding |
| `p-5` | 20px | — |
| `p-6` | 24px | Card padding |
| `p-8` | 32px | Section gap |
| `p-10` | 40px | — |
| `p-12` | 48px | — |
| `p-14` | 56px | — |
| `p-16` | 64px | Layout gap |
| `p-20` | 80px | Page margin |
| `p-24` | 96px | Large section padding |

---

## 7. BUTTONS

### 7.1 Global Specs

```
border-radius:  rounded-full (9999px)
padding-x:      px-[18px]
padding-y:      py-3 (12px)
font-size:      text-sm (14px)
font-weight:    font-bold
letter-spacing: tracking-[0.5px]
height:         40–48px
```

### 7.2 Variants × States

#### Primary
```css
Default:  bg-[#0000E1] text-white
Hover:    bg-[#0000C0] text-white
Active:   bg-[#00009A] text-white
Focus:    bg-[#0000E1] shadow-[0px_0px_0px_3px_rgba(0,0,225,0.5)]
Disabled: bg-[#8888CC] text-white opacity-40
```

#### Secondary
```css
Default:  bg-[#DEFF00] text-black
Hover:    bg-[#C8E800] text-black
Active:   bg-[#B2CC00] text-black
Focus:    bg-[#DEFF00] shadow-[0px_0px_0px_3px_rgba(222,255,0,0.5)]
Disabled: bg-[#EEFFAA] text-black opacity-40
```

#### Outline
```css
Default:  bg-[#F5F5F5] border-[1.5px] border-[#0000E1] text-[#0000E1]
Hover:    bg-[#E8E8FF] border-[#0000E1] text-[#0000E1]
Active:   bg-[#D0D0FF] border-[#0000E1] text-[#0000E1]
Focus:    bg-[#F5F5F5] border-[#0000E1] shadow-[0px_0px_0px_3px_rgba(0,0,225,0.5)]
Disabled: bg-[#F5F5F5] border-[#CCC] text-[#CCC] opacity-40
```

#### Darker
```css
Default:  bg-black text-white
Hover:    bg-[#111] text-white
Active:   bg-[#222] text-white
Focus:    bg-black shadow-[0px_0px_0px_3px_rgba(0,0,225,0.5)]
Disabled: bg-[#888] text-white opacity-40
```

---

## 8. INPUTS & FORMS

### 8.1 Global Specs

```
height:      44px (input) / 96px+ (textarea)
padding:     px-3 py-2.5 (12×10px)
border:      border-[1.5px] border-solid
radius:      rounded-lg (8px)
font:        text-sm — Poppins Regular
focus-ring:  shadow-[0px_0px_0px_3px_rgba(0,0,225,0.2)] + border-[#0000E1]
```

### 8.2 States

```css
Default:  bg-white border-[#DDD]
Focus:    bg-white border-[#0000E1] shadow-[0px_0px_0px_3px_rgba(0,0,225,0.2)]
Filled:   bg-white border-[#AAA]
Error:    bg-[#FFF5F5] border-[#DC2626]
Disabled: bg-[#F5F5F5] border-[#E0E0E0] opacity-60
```

### 8.3 Input Types

| Type | HTML | Description |
|------|------|-------------|
| Text | `type="text"` | Free text, general fields |
| Email | `type="email"` | Email format validation |
| Password | `type="password"` | Automatic text masking |
| Textarea | `<textarea>` | Multi-line, vertical resize, h-72px+ |

---

## 9. BADGES & COMPONENTS

### 9.1 Badges

```
border-radius:  rounded-full
font-size:      text-xs (11px)
font-weight:    font-bold
padding:        px-[10px] py-[4px]
variants:       Outline + Solid
```

| Semantic | Outline | Solid |
|----------|---------|-------|
| **Info** | `bg-[#E8E8FF] border border-[#0000C0] text-[#0000C0]` | `bg-[#0000E1] text-white` |
| **Success** | `bg-[#DCFCE7] border border-[#15803D] text-[#15803D]` | `bg-[#16A34A] text-white` |
| **Warning** | `bg-[#FEF3C7] border border-[#B45309] text-[#B45309]` | `bg-[#D97706] text-white` |
| **Error** | `bg-[#FEE2E2] border border-[#B91C1C] text-[#B91C1C]` | `bg-[#DC2626] text-white` |
| **Promo** | `bg-[#FCE7F3] border border-[#BE185D] text-[#BE185D]` | `bg-[#D92D8E] text-white` |

### 9.2 Toggles

```
size:       w-11 h-6 (44×24px) · rounded-full
thumb:      w-5 h-5 bg-white rounded-full shadow-sm
Off:        bg-[#CCC]    → thumb left-[2px]
On:         bg-[#0000E1] → thumb left-[22px]
Focus:      shadow-[0px_0px_0px_3px_rgba(0,0,225,0.4)]
Disabled:   opacity-50
```

### 9.3 Checkboxes & Radios

```
size:           w-[18px] h-[18px]
checkbox:       rounded-[4px]
radio:          rounded-full

Unchecked:      bg-[#F5F5F5] border-[1.5px] border-[#AAA]
Checked:        bg-[#0000E1] (white checkmark inside)
Indeterminate:  bg-[#0000E1] (white horizontal dash)
Disabled:       bg-[#F5F5F5] border-[#CCC] opacity-50
```

### 9.4 Sliders

```
track:          h-[4px] bg-[#E0E0E0] rounded-[2px]
fill:           h-[4px] bg-[#0000E1] rounded-[2px]
thumb default:  w-4 h-4 bg-white border-2 border-[#0000E1] rounded-full
thumb hover:    w-5 h-5 shadow-[0px_0px_0px_4px_rgba(0,0,225,0.3)]
thumb disabled: border-[#AAA] opacity-50
```

### 9.5 Tooltips

```
background:  bg-[#111]
color:       text-white
font-size:   text-xs (11px)
radius:      rounded-[6px]
shadow:      shadow-[0px_4px_8px_-2px_rgba(0,0,0,0.14)]
padding:     px-[10px] py-[8px]
arrow:       8×8px rotated 45° in bg-[#111]
positions:   Top · Bottom · Left · Right
```

---

## 10. SHADOWS & FOCUS RING

### Focus Ring (universal for all interactive elements)

```css
/* Primary, Outline, Darker buttons & Inputs */
shadow-[0px_0px_0px_3px_rgba(0,0,225,0.5)]

/* Inputs (subtler) */
shadow-[0px_0px_0px_3px_rgba(0,0,225,0.2)]

/* Secondary button */
shadow-[0px_0px_0px_3px_rgba(222,255,0,0.5)]

/* Toggle focus */
shadow-[0px_0px_0px_3px_rgba(0,0,225,0.4)]

/* Slider thumb hover */
shadow-[0px_0px_0px_4px_rgba(0,0,225,0.3)]
```

### Component Shadows

```css
/* Tooltips */
shadow-[0px_4px_8px_-2px_rgba(0,0,0,0.14)]

/* Toggle thumb */
shadow-[0px_1px_3px_0px_rgba(0,0,0,0.15)]
```

---

## 11. TAILWIND CONFIG — theme extension

Add this to `tailwind.config.js` to use LIVO tokens natively:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        livo: {
          blue: {
            50:  '#F2F2FD',
            100: '#E5E5FC',
            200: '#CCCCF9',
            300: '#A6A6F4',
            400: '#6666ED',
            500: '#0000E1',  // Electric Blue — base
            600: '#0000BF',
            700: '#00009D',
            800: '#000071',
            900: '#000044',
          },
          lime: {
            50:  '#FDFFF2',
            100: '#FCFFE5',
            200: '#F8FFCC',
            300: '#F3FFA6',
            400: '#EBFF66',
            500: '#DEFF00',  // Lime — base
            600: '#BDD900',
            700: '#9BB200',
            800: '#6F8000',
            900: '#434D00',
          },
          orange: {
            50:  '#FFF6F2',
            100: '#FFEDE5',
            200: '#FEDCCC',
            300: '#FEC1A6',
            400: '#FD9566',
            500: '#FC4F00',  // Vivid Orange — base
            600: '#D64300',
            700: '#B03700',
            800: '#7E2800',
            900: '#4C1800',
          },
          pink: {
            50:  '#FDF4F9',
            100: '#FBEAF4',
            200: '#F7D5E8',
            300: '#F2B6D7',
            400: '#E881BB',
            500: '#D92D8E',  // Pink — base
            600: '#B82679',
            700: '#982063',
            800: '#6D1747',
            900: '#410E2B',
          },
          sand: '#AB8F68',
          gray: '#F0F0F0',
        },
      },
      fontFamily: {
        display: ['Ballinger', 'sans-serif'],   // Headings & Display
        body:    ['Poppins', 'sans-serif'],      // Body & UI
        mono:    ['Carbon', 'monospace'],        // Numbers & Prices (T29 Carbon)
      },
      borderRadius: {
        btn:       '9999px',  // Buttons
        input:     '8px',     // Inputs
        badge:     '9999px',  // Badges
        card:      '12px',    // Cards
        'card-lg': '16px',    // Large cards
      },
      boxShadow: {
        'focus-primary':   '0px 0px 0px 3px rgba(0, 0, 225, 0.5)',
        'focus-input':     '0px 0px 0px 3px rgba(0, 0, 225, 0.2)',
        'focus-secondary': '0px 0px 0px 3px rgba(222, 255, 0, 0.5)',
        'focus-toggle':    '0px 0px 0px 3px rgba(0, 0, 225, 0.4)',
        'slider-hover':    '0px 0px 0px 4px rgba(0, 0, 225, 0.3)',
        'tooltip':         '0px 4px 8px -2px rgba(0, 0, 0, 0.14)',
        'thumb':           '0px 1px 3px 0px rgba(0, 0, 0, 0.15)',
      },
      letterSpacing: {
        btn: '0.5px',
      },
    },
  },
};
```

---

## 12. COMPONENTS — READY-TO-USE HTML SNIPPETS

### Primary CTA Button
```html
<button class="bg-[#0000E1] text-white font-bold text-sm tracking-[0.5px] px-[18px] py-3 rounded-full hover:bg-[#0000C0] active:bg-[#00009A] focus:outline-none focus:shadow-[0px_0px_0px_3px_rgba(0,0,225,0.5)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
  Buy Now
</button>
```

### Secondary Button (Lime)
```html
<button class="bg-[#DEFF00] text-black font-bold text-sm tracking-[0.5px] px-[18px] py-3 rounded-full hover:bg-[#C8E800] active:bg-[#B2CC00] focus:outline-none focus:shadow-[0px_0px_0px_3px_rgba(222,255,0,0.5)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
  See Offer
</button>
```

### Outline Button
```html
<button class="bg-[#F5F5F5] border-[1.5px] border-[#0000E1] text-[#0000E1] font-bold text-sm tracking-[0.5px] px-[18px] py-3 rounded-full hover:bg-[#E8E8FF] active:bg-[#D0D0FF] focus:outline-none focus:shadow-[0px_0px_0px_3px_rgba(0,0,225,0.5)] disabled:opacity-40 disabled:border-[#CCC] disabled:text-[#CCC] disabled:cursor-not-allowed transition-colors">
  Learn More
</button>
```

### Darker Button (Black)
```html
<button class="bg-black text-white font-bold text-sm tracking-[0.5px] px-[18px] py-3 rounded-full hover:bg-[#111] active:bg-[#222] focus:outline-none focus:shadow-[0px_0px_0px_3px_rgba(0,0,225,0.5)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
  Continue
</button>
```

### Standard Input
```html
<input
  type="text"
  class="w-full h-[44px] px-3 py-[10px] bg-white border-[1.5px] border-[#DDD] rounded-lg text-sm text-[#111] placeholder-[#AAA] focus:outline-none focus:border-[#0000E1] focus:shadow-[0px_0px_0px_3px_rgba(0,0,225,0.2)] disabled:bg-[#F5F5F5] disabled:border-[#E0E0E0] disabled:opacity-60 transition-shadow"
  placeholder="Placeholder..."
/>
```

### Error Input
```html
<input
  type="text"
  class="w-full h-[44px] px-3 py-[10px] bg-[#FFF5F5] border-[1.5px] border-[#DC2626] rounded-lg text-sm text-[#111] focus:outline-none focus:border-[#DC2626] transition-shadow"
  value="Invalid email"
/>
```

### Info Badge (Outline)
```html
<span class="inline-flex items-center px-[10px] py-[4px] rounded-full text-[11px] font-bold bg-[#E8E8FF] border border-[#0000C0] text-[#0000C0]">Info</span>
```

### Success Badge (Solid)
```html
<span class="inline-flex items-center px-[10px] py-[4px] rounded-full text-[11px] font-bold bg-[#16A34A] text-white">Success</span>
```

### Toggle
```html
<!-- Toggle ON -->
<button class="relative w-11 h-6 bg-[#0000E1] rounded-full focus:outline-none focus:shadow-[0px_0px_0px_3px_rgba(0,0,225,0.4)] transition-colors">
  <span class="absolute right-[2px] top-[2px] w-5 h-5 bg-white rounded-full shadow-[0px_1px_3px_0px_rgba(0,0,0,0.15)] transition-transform"></span>
</button>

<!-- Toggle OFF -->
<button class="relative w-11 h-6 bg-[#CCC] rounded-full focus:outline-none transition-colors">
  <span class="absolute left-[2px] top-[2px] w-5 h-5 bg-white rounded-full shadow-[0px_1px_3px_0px_rgba(0,0,0,0.15)] transition-transform"></span>
</button>
```

### Tooltip
```html
<div class="relative inline-block">
  <!-- Trigger -->
  <span>Element</span>
  <!-- Tooltip Top -->
  <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#111] text-white text-[11px] rounded-[6px] px-[10px] py-2 shadow-[0px_4px_8px_-2px_rgba(0,0,0,0.14)] whitespace-nowrap">
    Tooltip Top
    <div class="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-[#111] rotate-45 -mt-1"></div>
  </div>
</div>
```

---

## 13. COLOR PALETTE — QUICK REFERENCE

```
PRIMARY
  Electric Blue  #0000E1   → Action, brand identity, CTA
  Lime           #DEFF00   → Energy, highlights, contrast
  Black          #000000   → Structure, body text
  White          #FFFFFF   → Base, cards, breathing room

SECONDARY
  Orange         #FC4F00   → Urgency, alerts, time-sensitive promos
  Pink           #D92D8E   → Promos, campaigns, sale
  Gray           #F0F0F0   → Neutral, dividers, backgrounds
  Sand           #AB8F68   → Warm textures, support elements

SEMANTIC (badges / UI states)
  Success        #16A34A
  Warning        #D97706
  Error          #DC2626
  Info           #0000E1
```

---

## 14. ACCESSIBILITY NOTES

- Focus must always have a visible `ring` — never remove `outline` without replacing it
- Electric Blue `#0000E1` on white: ✅ AAA (21:1)
- Lime `#DEFF00` on black: ✅ AAA (15.7:1)
- **Never use Lime on white** — insufficient contrast
- Text on Lime buttons must always be `text-black`, never `text-white`
- Disabled states always use `opacity-40` and `cursor-not-allowed`
- Use `aria-disabled="true"` for disabled buttons inside forms

---

*Automatically generated from Figma — DESIGN_SYSTEM-LIVO · v1.0 · May 2026*
