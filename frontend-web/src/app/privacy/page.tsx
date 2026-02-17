import Link from 'next/link'

export const metadata = { title: 'Privacy Policy — Draped' }

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '60px 24px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#7d6e5d', textDecoration: 'none', marginBottom: 40 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back to home
        </Link>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: 400, marginBottom: 12 }}>Privacy Policy</h1>
        <p style={{ fontSize: 13, color: '#9a8c7c', marginBottom: 48 }}>Last updated: February 2026</p>

        {[
          {
            title: 'What we collect',
            body: `We collect your Google account information (name, email address, and profile picture) when you sign in. We also temporarily store the images you upload — your personal photo and the garment image — solely to generate your virtual try-on result. Usage analytics are collected in anonymized form.`,
          },
          {
            title: 'How we use your data',
            body: `Your uploaded images are used exclusively to generate try-on results. We do not use your images to train AI models. We do not share your images or personal information with third parties. Your email is used only for account management and important service communications.`,
          },
          {
            title: 'Image retention & deletion',
            body: `Uploaded photos (your personal image and garment images) are automatically deleted from our servers after 7 days. Generated try-on results are stored for 30 days and can be deleted by you at any time from the Gallery page. You can also request complete account deletion by contacting support.`,
          },
          {
            title: 'Security',
            body: `All images are encrypted at rest using AES-256 and in transit using TLS 1.3. Access is strictly controlled — only you can view your images and results. Our infrastructure runs on AWS with industry-standard security practices.`,
          },
          {
            title: 'Cookies & analytics',
            body: `We use essential cookies for authentication. We collect anonymized usage analytics to improve the service. We do not use tracking cookies or sell data to advertisers.`,
          },
          {
            title: 'Your rights',
            body: `You have the right to access, export, or delete all data associated with your account. To exercise these rights, use the in-app controls or email support@draped.app. We comply with GDPR (EU), CCPA (California), and applicable data protection laws.`,
          },
          {
            title: 'Contact',
            body: `For privacy questions, email us at privacy@draped.app. We respond to all inquiries within 48 hours.`,
          },
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
