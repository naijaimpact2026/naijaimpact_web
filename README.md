# Hubnovo - Community Technology Platform

A modern, advanced website for Hubnovo featuring a professional design with full mobile responsiveness, smooth animations, and an engaging user interface.

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
cd hubnovo-website

# Install dependencies
npm install

# Start the development server
npm run dev
```

The site will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
npm run start
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
  └── logo.jpg          # Hubnovo logo

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

## ModusHive Media Architecture & Setup

ModusHive uses an optimized multi-provider architecture:
- **Cloudflare R2**: Master storage for raw original videos (zero egress fees, vendor independence).
- **Mux**: Video transcoding, adaptive bitrate HLS delivery (capped at 720p basic tier for cost control), and signed playback tokens.
- **Cloudflare Stream**: Direct in-browser webcam & microphone live streaming (WebRTC WHIP / HLS).

### 1. Cloudflare R2 Bucket CORS Setup

In **Cloudflare Dashboard** > **R2 Object Storage** > select your bucket (`modushive-originals`) > **Settings** > **CORS Policy**:
- **Allowed Origins**:
  ```text
  http://localhost:3000
  https://staging.hubnovo.com
  https://<your-production-domain>.com
  ```
  *(Make sure there are no trailing commas).*
- **Allowed Methods**: `PUT`, `GET`, `HEAD`
- **Allowed Headers**: `Content-Type`, `*`

> Without this CORS configuration, browser direct uploads to R2 will be rejected by CORS preflight checks.

### 2. Vercel Environment Variables (Staging & Production)

Ensure these variables are added in your Vercel Project Settings for both **Preview (Staging)** and **Production**:

| Variable | Description |
| :--- | :--- |
| `R2_ACCOUNT_ID` | Cloudflare Account ID |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 API Access Key |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 Secret Access Key |
| `R2_BUCKET` | R2 bucket name (e.g. `modushive-originals`) |
| `CLOUDFLARE_STREAM_TOKEN` | Cloudflare Stream API token for in-browser live streaming |
| `MUX_TOKEN_ID` | Mux API Access Token ID |
| `MUX_TOKEN_SECRET` | Mux API Access Token Secret |
| `MUX_SIGNING_KEY` | Mux Signing Key ID (for playback authorization) |
| `MUX_PRIVATE_KEY` | Mux Base64-encoded private key |
| `MUX_WEBHOOK_SECRET` | Webhook signing secret from Mux Dashboard |
| `CRON_SECRET` | Secret token to authorize Vercel daily cleanup cron (`/api/cron/cleanup-uploads`) |

### 3. Mux Webhook Configuration

In your **Mux Dashboard** > **Settings** > **Webhooks**:
1. Click **Create Webhook**.
2. Set the URL:
   - For Staging: `https://staging.hubnovo.com/api/mux/webhook`
   - For Production: `https://<your-production-domain>/api/mux/webhook`
3. Copy the generated Webhook Signing Secret into `MUX_WEBHOOK_SECRET` in your Vercel environment variables.

---

## Deployment

The site is deployed on Vercel using `npm`:

```bash
# Build locally
npm run build

# Start production server locally
npm run start
```

## Contact & Support

For questions about Hubnovo:
- Email: hello@hubnovo.com
- Location: Lagos, Nigeria

## License

© 2026 Hubnovo. All rights reserved.

