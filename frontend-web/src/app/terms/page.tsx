import Link from 'next/link'

export const metadata = { title: 'Terms of Service — Draped' }

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '60px 24px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#7d6e5d', textDecoration: 'none', marginBottom: 40 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back to home
        </Link>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: 400, marginBottom: 12 }}>Terms of Service</h1>
        <p style={{ fontSize: 13, color: '#9a8c7c', marginBottom: 48 }}>Last updated: February 2026</p>

        {[
          { title: 'Acceptance', body: 'By creating an account or using Draped, you agree to these Terms of Service and our Privacy Policy. If you do not agree, please do not use the service.' },
          { title: 'Acceptable use', body: 'You may use Draped for personal use, e-commerce visualization, and fashion exploration. You must not upload images of minors (under 18), create deepfakes or impersonations, upload explicit or illegal content, use the service for harassment, or attempt to circumvent usage limits.' },
          { title: 'Your content', body: 'You retain full ownership of images you upload. By uploading, you grant Draped a limited, temporary license to process those images to generate your try-on result. We do not claim ownership of your content and do not use it for model training without explicit consent.' },
          { title: 'Generated results', body: 'AI-generated try-on images are provided for personal and commercial use. Results are "as-is" — we make no guarantee of photographic accuracy. Draped is not responsible for decisions made based on AI-generated images (e.g., purchase decisions).' },
          { title: 'Free tier & limits', body: 'Free accounts receive 5 try-ons per month. Unused credits do not roll over. We reserve the right to modify free tier limits with 30 days\' notice. Pro subscriptions are subject to separate pricing terms.' },
          { title: 'Service availability', body: 'Draped is provided "as-is" without warranties of uninterrupted availability. We may perform maintenance, updates, or experience downtime. We are not liable for losses arising from service unavailability.' },
          { title: 'Termination', body: 'We may suspend or terminate accounts that violate these Terms, engage in abuse, or attempt to harm other users or the service. You may delete your account at any time from settings.' },
          { title: 'Limitation of liability', body: 'Draped\'s liability is limited to the amount you paid in the 12 months preceding a claim. We are not liable for indirect, incidental, or consequential damages.' },
          { title: 'Changes', body: 'We may update these Terms. Significant changes will be communicated via email. Continued use after changes constitutes acceptance.' },
          { title: 'Contact', body: 'For legal inquiries, contact legal@draped.app.' },
        ].map((section) => (
          <div key={section.title} style={{ marginBottom: 36 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 500, marginBottom: 12, color: '#231d19' }}>
              {section.title}
            </h2>
            <p style={{ fontSize: 15, color: '#574337', lineHeight: 1.75 }}>{section.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
