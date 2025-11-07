# Jumuiya Ya Waisilamu UK

A community support platform for Tanzanian Muslims in the United Kingdom.

## Tech Stack

### Front-End
- **Framework**: Next.js 16 with React 19
- **Styling**: TailwindCSS v4
- **UI Components**: shadcn/ui

### Back-End
- **Runtime**: Node.js (Next.js API Routes)
- **Authentication**: Supabase Auth (JWT-based)
- **Database**: PostgreSQL (via Supabase)

### Security Features
- Row Level Security (RLS) policies on all tables
- JWT authentication via Supabase
- Encrypted passwords (handled by Supabase Auth)
- HTTPS/SSL encryption (via Vercel deployment)
- Protected admin routes with role-based access control

### Database Schema
- **profiles**: Extended user information with role-based access
- **dependents**: Family member information
- **referees**: Member referees and witnesses
- **contributions**: Payment and contribution tracking
- **funeral_support**: Funeral assistance case management
- **announcements**: Community updates and notifications

### Payment Integration
- Support for multiple payment methods:
  - Bank transfers
  - Stripe (ready for integration)
  - PayPal (ready for integration)
  - Cash payments

### Admin Dashboard
- Member management
- Contribution tracking
- Funeral support case management
- Real-time statistics and analytics
- Role-based access control (admin, super_admin)

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (Supabase credentials)
4. Run database migrations in the `scripts` folder
5. Start development server: `npm run dev`

## Deployment

The application is designed to be deployed on:
- Vercel (recommended)
- DigitalOcean
- AWS Lightsail
- Hostinger

## Features

- Public landing page with organization information
- Member registration with comprehensive form
- Protected member area with benefits and services
- Admin dashboard for community management
- Contribution tracking and payment management
- Funeral support case management
- Dark/Light theme support
- Fully responsive design
- Multi-language support (English/Swahili)

## License

Private - Jumuiya Ya Waisilamu UK
