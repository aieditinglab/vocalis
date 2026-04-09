'use client'
import Nav from '@/components/Nav'

export default function PrivacyPage() {
  return (
    <>
      <Nav backHref="/" />
      <div style={{ maxWidth: '780px', margin: '0 auto', padding: '60px 24px 100px' }}>
        <p style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '.1em', color: 'var(--text-muted)', marginBottom: '12px' }}>LEGAL</p>
        <h1 className="font-display" style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: 900, letterSpacing: '-.04em', marginBottom: '8px' }}>Privacy Policy</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '48px' }}>Last updated: April 9, 2026 · Effective immediately</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

          <Section title="1. Introduction">
            <p>Vocalis ("Vocalis," "we," "our," or "us") is an AI-powered communication coaching platform operated by Vocalis (aieditinglab@gmail.com). This Privacy Policy explains how we collect, use, store, share, and protect your personal information when you use vocalis-zeta.vercel.app and any related services (collectively, the "Service").</p>
            <p>By creating an account or using the Service, you agree to this Privacy Policy. If you do not agree, do not use the Service.</p>
            <p>If you are under 18 years of age, you represent that your parent or legal guardian has reviewed and agreed to this Privacy Policy on your behalf.</p>
          </Section>

          <Section title="2. Information We Collect">
            <SubHeading>A. Information You Provide</SubHeading>
            <ul>
              <li><strong>Account Information:</strong> First name and email address collected at registration.</li>
              <li><strong>Password:</strong> Stored as a salted, hashed credential via Supabase Auth. We never store plaintext passwords.</li>
              <li><strong>Profile Settings:</strong> Display name, target speaking pace (WPM), default practice category, notification preferences, and selected theme.</li>
              <li><strong>Voice Recordings:</strong> Audio recordings you submit during practice sessions. These recordings are processed to generate transcripts and coaching feedback.</li>
              <li><strong>Custom Prompts:</strong> Any custom speaking prompts you create under "My Own Prompt."</li>
            </ul>

            <SubHeading>B. Information Generated Automatically</SubHeading>
            <ul>
              <li><strong>Session Data:</strong> Per-session metrics including words per minute (WPM), filler word count, clarity score, self-rating, and session category.</li>
              <li><strong>Usage Data:</strong> Pages visited, features used, game scores, streak data, token balances, and avatar items owned.</li>
              <li><strong>Device & Technical Data:</strong> Browser type, operating system, IP address, and general geographic region (country/state level only), collected automatically by our hosting provider Vercel.</li>
              <li><strong>Log Data:</strong> Server-side logs may capture request timestamps, error events, and response codes.</li>
            </ul>

            <SubHeading>C. Information We Do Not Collect</SubHeading>
            <ul>
              <li>We do not collect payment card information. Payment processing (if any) is handled entirely by Stripe and subject to Stripe&apos;s own privacy policy.</li>
              <li>We do not collect Social Security numbers, government IDs, or biometric identifiers beyond voice audio.</li>
              <li>We do not knowingly collect information from children under 13. See Section 9 for details.</li>
            </ul>
          </Section>

          <Section title="3. How We Use Your Information">
            <p>We use the information we collect for the following purposes:</p>
            <ul>
              <li><strong>To provide and operate the Service</strong> — authenticating your account, storing your session history, calculating your progress metrics, and delivering AI coaching feedback.</li>
              <li><strong>To process your voice recordings</strong> — audio is sent to OpenAI Whisper for transcription and to Anthropic&apos;s Claude API for analysis and coaching feedback. See Section 5 for third-party details.</li>
              <li><strong>To personalize your experience</strong> — using your session history to recommend relevant games, drills, and improvement areas.</li>
              <li><strong>To operate the leaderboard</strong> — your display name and public score metrics may appear on the leaderboard visible to other users.</li>
              <li><strong>To communicate with you</strong> — sending session summaries, streak reminders, and important account or policy updates (only if notifications are enabled, or for required account communications).</li>
              <li><strong>To enforce our policies</strong> — monitoring for violations of our Terms of Service, including inappropriate content and username moderation.</li>
              <li><strong>To improve the Service</strong> — analyzing aggregated, de-identified usage patterns to improve features and fix bugs. We do not sell individual-level data.</li>
              <li><strong>To comply with legal obligations</strong> — retaining or disclosing information as required by applicable law.</li>
            </ul>
          </Section>

          <Section title="4. Legal Basis for Processing (GDPR)">
            <p>If you are located in the European Economic Area (EEA) or United Kingdom, we process your data under the following legal bases:</p>
            <ul>
              <li><strong>Contract performance</strong> — processing necessary to deliver the Service you signed up for.</li>
              <li><strong>Legitimate interests</strong> — fraud prevention, security, service improvement, and leaderboard operation.</li>
              <li><strong>Consent</strong> — for optional communications (reminders, session emails). You may withdraw consent at any time in Settings.</li>
              <li><strong>Legal obligation</strong> — compliance with applicable laws.</li>
            </ul>
          </Section>

          <Section title="5. Third-Party Services & Data Sharing">
            <p>We share your data with the following third-party service providers solely to operate the Service. We do not sell your personal data to any third party.</p>

            <table>
              <thead>
                <tr><th>Provider</th><th>Purpose</th><th>Data Shared</th><th>Privacy Policy</th></tr>
              </thead>
              <tbody>
                <tr><td>Supabase</td><td>Database, authentication, file storage</td><td>Account data, session data, audio files</td><td>supabase.com/privacy</td></tr>
                <tr><td>Vercel</td><td>Web hosting & edge delivery</td><td>IP address, request logs</td><td>vercel.com/legal/privacy-policy</td></tr>
                <tr><td>Anthropic (Claude API)</td><td>AI coaching feedback generation</td><td>Session transcripts, speaking metrics</td><td>anthropic.com/privacy</td></tr>
                <tr><td>OpenAI (Whisper)</td><td>Voice-to-text transcription</td><td>Audio recordings</td><td>openai.com/policies/privacy-policy</td></tr>
                <tr><td>ElevenLabs</td><td>Text-to-speech audio generation</td><td>Coaching script text</td><td>elevenlabs.io/privacy</td></tr>
                <tr><td>Resend</td><td>Transactional email delivery</td><td>Email address, email content</td><td>resend.com/privacy</td></tr>
                <tr><td>Stripe</td><td>Payment processing (if applicable)</td><td>Payment data only — we never see card numbers</td><td>stripe.com/privacy</td></tr>
              </tbody>
            </table>

            <p style={{ marginTop: '16px' }}>We may also disclose your information: (a) to comply with a legal obligation or court order; (b) to protect the rights, property, or safety of Vocalis, our users, or the public; (c) in connection with a merger, acquisition, or sale of assets, in which case we will notify you before your data is transferred and becomes subject to a different privacy policy.</p>
          </Section>

          <Section title="6. Voice Recordings & Audio Data">
            <p>Voice recordings are among the most sensitive data we process. Here is exactly how we handle them:</p>
            <ul>
              <li>Recordings are uploaded to Supabase Storage in a private bucket accessible only to your account and our backend.</li>
              <li>Audio is transmitted to OpenAI Whisper over an encrypted (TLS) connection for transcription. OpenAI&apos;s data usage policies apply to API inputs; as of this writing, OpenAI does not use API inputs to train its models.</li>
              <li>Transcripts (not audio) are sent to Anthropic&apos;s Claude API for coaching analysis.</li>
              <li>You may delete all your session data at any time from Settings → Danger Zone → Delete All Data.</li>
              <li>Upon account deletion, all associated audio files are permanently deleted from Supabase Storage.</li>
            </ul>
          </Section>

          <Section title="7. Data Retention">
            <ul>
              <li><strong>Account data</strong> is retained for as long as your account is active.</li>
              <li><strong>Session data and recordings</strong> are retained until you delete them or delete your account.</li>
              <li><strong>Server logs</strong> are retained for up to 90 days by Vercel for security and debugging purposes.</li>
              <li><strong>Backups</strong> may persist for up to 30 days after deletion before being fully purged from backup systems.</li>
              <li>If your account is terminated for Terms of Service violations, we may retain minimal records (email, violation reason) for up to 2 years to prevent re-registration.</li>
            </ul>
          </Section>

          <Section title="8. Data Security">
            <p>We implement the following security measures:</p>
            <ul>
              <li>All data in transit is encrypted via TLS 1.2 or higher.</li>
              <li>Passwords are hashed using bcrypt via Supabase Auth — never stored in plaintext.</li>
              <li>Database access is protected by Supabase Row Level Security (RLS) policies, ensuring users can only access their own data.</li>
              <li>API keys and secrets are stored as server-side environment variables and never exposed to the client.</li>
              <li>Audio storage buckets are configured as private — files are not publicly accessible via URL without a signed token.</li>
            </ul>
            <p>No system is 100% secure. In the event of a data breach that affects your personal information, we will notify you within 72 hours of becoming aware of the breach, as required by applicable law.</p>
          </Section>

          <Section title="9. Children's Privacy (COPPA)">
            <p>Vocalis is designed for users aged 13 and older. We do not knowingly collect personal information from children under 13 years of age.</p>
            <p>If you are under 13, you may not create an account or use the Service. If you are between 13 and 17 years of age, you represent that your parent or legal guardian has reviewed and agreed to this Privacy Policy.</p>
            <p>If we learn that we have inadvertently collected personal information from a child under 13, we will delete that information immediately. Parents or guardians who believe we may have collected information from a child under 13 should contact us at aieditinglab@gmail.com.</p>
          </Section>

          <Section title="10. Your Rights">
            <p>Depending on your location, you may have the following rights regarding your personal data:</p>
            <ul>
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong>Correction:</strong> Update or correct inaccurate data via Settings.</li>
              <li><strong>Deletion:</strong> Delete your session data at any time via Settings → Danger Zone. To delete your full account, email aieditinglab@gmail.com.</li>
              <li><strong>Portability:</strong> Request your session data in a machine-readable format.</li>
              <li><strong>Opt-out of communications:</strong> Disable all notifications in Settings at any time.</li>
              <li><strong>California residents (CCPA):</strong> You have the right to know what personal information we collect, to opt out of the "sale" of personal information (we do not sell personal information), and to non-discrimination for exercising your rights.</li>
              <li><strong>EEA/UK residents (GDPR):</strong> You have the right to object to processing, restrict processing, and lodge a complaint with your local data protection authority.</li>
            </ul>
            <p>To exercise any of these rights, email aieditinglab@gmail.com. We will respond within 30 days.</p>
          </Section>

          <Section title="11. Cookies & Local Storage">
            <p>Vocalis uses browser localStorage and session cookies strictly for the following purposes:</p>
            <ul>
              <li><strong>Authentication:</strong> Supabase session tokens to keep you logged in.</li>
              <li><strong>Preferences:</strong> Theme (dark/light) and UI state stored locally on your device.</li>
              <li><strong>Game data:</strong> High scores stored locally in your browser.</li>
            </ul>
            <p>We do not use third-party advertising cookies, tracking pixels, or cross-site trackers of any kind.</p>
          </Section>

          <Section title="12. Changes to This Policy">
            <p>We may update this Privacy Policy from time to time. When we do, we will update the "Last updated" date at the top and, for material changes, notify you via email or an in-app notification. Your continued use of the Service after any update constitutes acceptance of the new policy.</p>
          </Section>

          <Section title="13. Contact Us">
            <p>For any questions, concerns, or data requests related to this Privacy Policy, contact:</p>
            <p><strong>Vocalis</strong><br />Email: aieditinglab@gmail.com<br />Website: vocalis-zeta.vercel.app</p>
          </Section>

        </div>
      </div>
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-.02em', marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>{title}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '15px', lineHeight: 1.75, color: 'var(--text-muted)' }}>
        {children}
      </div>
    </div>
  )
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '8px', marginBottom: '4px' }}>{children}</p>
}