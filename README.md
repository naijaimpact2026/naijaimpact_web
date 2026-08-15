# NaijaImpact - Community Technology Platform

A modern, advanced website for NaijaImpact featuring a professional design with full mobile responsiveness, smooth animations, and an engaging user interface.

## Features

### Design & UX
- **Modern UI Design**: Contemporary design system with gradient accents and smooth transitions
- **Fully Responsive**: Mobile-first approach with breakpoints for tablets and desktop
- **Smooth Animations**: CSS animations for fade-ins, slide-ups, and floating elements
- **Dark Mode Ready**: Built-in dark mode support with proper color contrast

### Components
- **Header/Navigation**: Sticky header with mobile hamburger menu
- **Hero Section**: Eye-catching landing section with animated background elements and CTA buttons
- **Features Grid**: Showcasing 6 key features with hover effects and gradient icons
- **About Section**: Company mission and core values
- **Testimonials**: Community member testimonials with 5-star ratings
- **Contact Form**: Fully functional contact form with validation
- **Footer**: Multi-column footer with navigation links and social media icons

### Technical Stack
- **Next.js 16**: Latest React framework with App Router
- **React 19**: Modern React with latest hooks and features
- **Tailwind CSS 4.2**: Utility-first CSS framework with custom configurations
- **TypeScript**: Full type safety across the project
- **Lucide Icons**: Beautiful, consistent icon set
- **Custom Fonts**: Poppins (display) and Inter (body) from Google Fonts

## Getting Started

### Installation

```bash
# Clone or download the project
cd naijaimpact-website

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

The site will be available at `http://localhost:3000`

### Build for Production

```bash
pnpm build
pnpm start
```

## Project Structure

```
/app
  ├── page.tsx           # Main landing page
  ├── layout.tsx         # Root layout with metadata
  └── globals.css        # Global styles and design tokens

/components
  ├── Header.tsx         # Navigation header with mobile menu
  ├── Hero.tsx           # Hero/landing section
  ├── Features.tsx       # Features showcase grid
  ├── About.tsx          # About section with core values
  ├── Testimonials.tsx   # Customer testimonials carousel
  ├── Contact.tsx        # Contact form and info
  └── Footer.tsx         # Footer with links and social icons

/public
  └── logo.jpg          # NaijaImpact logo

tailwind.config.ts      # Tailwind configuration with custom animations
package.json            # Dependencies and scripts
tsconfig.json           # TypeScript configuration
```

## Color Scheme

The design uses a carefully selected color palette:
- **Primary**: Teal/Cyan (#10B981) - Main brand color
- **Secondary**: Blue (#0EA5E9) - Complementary color
- **Accent**: Teal (#14B8A6) - Highlights and CTAs
- **Neutrals**: White and slate grays - Background and text
- **Dark Mode**: Slate 900-950 - Dark theme backgrounds

## Customization

### Changing Colors
Edit the color variables in `/app/globals.css`:

```css
:root {
  --primary: 166 76% 40%;      /* Teal */
  --secondary: 199 100% 43%;   /* Blue */
  --accent: 166 76% 40%;       /* Teal */
}
```

### Updating Content
- **Header Navigation**: Edit `navItems` array in `Header.tsx`
- **Features**: Modify the `features` array in `Features.tsx`
- **Testimonials**: Update the `testimonials` array in `Testimonials.tsx`
- **Footer Links**: Edit `footerSections` in `Footer.tsx`

### Adding New Sections
1. Create a new component in `/components`
2. Import it in `/app/page.tsx`
3. Add it to the main layout in the page file

## Animations

Custom animations are available through Tailwind utility classes:
- `animate-fade-in` - Fade in effect
- `animate-slide-up` - Slide up from bottom
- `animate-slide-down` - Slide down from top
- `animate-float` - Floating effect
- `animate-count-up` - Number counter animation
- `animate-pulse-glow` - Glowing pulse effect

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- Optimized images and lazy loading
- CSS-in-JS with Tailwind for minimal bundle size
- Component-based architecture for code splitting
- Responsive images with `next/image` optimization

## Accessibility

- Semantic HTML structure
- ARIA labels for interactive elements
- Proper color contrast ratios
- Keyboard navigation support
- Mobile-friendly touch targets (min 44x44px)

## Deployment

The site is ready to deploy on Vercel, Netlify, or any Node.js hosting:

### Vercel (Recommended)
```bash
vercel
```

### Other Platforms
Build the project:
```bash
pnpm build
```

This generates a `.next` folder ready for deployment.

## Contact & Support

For questions about NaijaImpact:
- Email: hello@naijaimpact.com
- Phone: +234 (0) 901 234 5678
- Location: Lagos, Nigeria

## License

© 2024 NaijaImpact. All rights reserved.

---

**Made with ❤️ for Nigerian Communities**
# naijaimpact
# naijaimpact_web
# naijaimpact_web
