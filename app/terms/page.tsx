'use client'
import Nav from '@/components/Nav'

export default function TermsPage() {
  return (
    <>
      <Nav backHref="/" />
      <div style={{ maxWidth: '780px', margin: '0 auto', padding: '60px 24px 100px' }}>
        <p style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '.1em', color: 'var(--text-muted)', marginBottom: '12px' }}>LEGAL</p>
        <h1 className="font-display" style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: 900, letterSpacing: '-.04em', marginBottom: '8px' }}>Terms of Service</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '48px' }}>Last updated: April 9, 2026 · Effective immediately</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

          <Section title="1. Acceptance of Terms">
            <p>These Terms of Service ("Terms") govern your access to and use of Vocalis, operated by Vocalis ("we," "our," or "us"), including the website vocalis-zeta.vercel.app and all related services (the "Service").</p>
            <p>By creating an account, clicking "I agree," or using the Service, you agree to be bound by these Terms and our Privacy Policy, which is incorporated by reference. If you do not agree to these Terms, do not use the Service.</p>
            <p>If you are under 18 years of age, you represent that your parent or legal guardian has reviewed and agreed to these Terms on your behalf.</p>
          </Section>

          <Section title="2. Eligibility">
            <ul>
              <li>You must be at least 13 years of age to use the Service.</li>
              <li>Users between the ages of 13 and 17 must have parental or guardian consent.</li>
              <li>By using the Service, you represent and warrant that you meet these age requirements and that all information you provide is accurate and complete.</li>
              <li>We reserve the right to verify eligibility and to terminate accounts that do not meet these requirements.</li>
            </ul>
          </Section>

          <Section title="3. Account Registration & Security">
            <ul>
              <li>You must provide a valid email address and a display name that complies with our Content Standards (Section 6).</li>
              <li>You are responsible for maintaining the confidentiality of your password and for all activity that occurs under your account.</li>
              <li>You must notify us immediately at aieditinglab@gmail.com if you suspect unauthorized access to your account.</li>
              <li>You may not create accounts for others, share your account credentials, or use automated tools to create accounts.</li>
              <li>We reserve the right to refuse registration or terminate accounts at our sole discretion.</li>
            </ul>
          </Section>

          <Section title="4. Description of Service">
            <p>Vocalis is an AI-powered communication coaching platform that allows users to:</p>
            <ul>
              <li>Record and analyze voice sessions to measure speaking pace, clarity, and filler word usage.</li>
              <li>Receive AI-generated coaching feedback powered by third-party AI APIs.</li>
              <li>Track progress over time via a personal dashboard and leaderboard.</li>
              <li>Participate in training games designed to improve communication skills.</li>
              <li>Customize a personal avatar within the platform.</li>
            </ul>
            <p>The Service is provided for educational and personal development purposes only. Vocalis coaching feedback is AI-generated and is not a substitute for professional speech therapy, counseling, or formal coaching services.</p>
          </Section>

          <Section title="5. License to Use the Service">
            <p>Subject to your compliance with these Terms, Vocalis grants you a limited, non-exclusive, non-transferable, revocable license to access and use the Service for your personal, non-commercial use.</p>
            <p>You may not:</p>
            <ul>
              <li>Copy, modify, distribute, sell, or lease any part of the Service or its underlying software.</li>
              <li>Reverse engineer, decompile, or attempt to extract source code from the Service.</li>
              <li>Use the Service to build a competing product or service.</li>
              <li>Scrape, crawl, or otherwise extract data from the Service in bulk through automated means.</li>
              <li>Access or attempt to access any account other than your own.</li>
            </ul>
          </Section>

          <Section title="6. Content Standards & Acceptable Use">
            <p>You agree not to use the Service to submit, post, or transmit any content that:</p>
            <ul>
              <li>Contains profanity, hate speech, slurs, sexually explicit language, or content that targets individuals based on race, ethnicity, gender, religion, sexual orientation, disability, or national origin.</li>
              <li>Promotes, glorifies, or facilitates violence, self-harm, eating disorders, illegal activity, or terrorism.</li>
              <li>Harasses, bullies, or threatens any person.</li>
              <li>Impersonates any person, organization, or entity.</li>
              <li>Violates any applicable law or regulation.</li>
              <li>Infringes the intellectual property rights of any third party.</li>
              <li>Contains malware, viruses, or any harmful code.</li>
            </ul>
            <p>Display names (usernames) are subject to the same standards. We actively moderate display names and reserve the right to change or remove any name that violates these standards without notice.</p>
            <p>Violations may result in immediate account suspension or permanent termination.</p>
          </Section>

          <Section title="7. User-Generated Content">
            <p>You retain ownership of any content you submit to the Service, including voice recordings and custom prompts ("User Content").</p>
            <p>By submitting User Content, you grant Vocalis a worldwide, royalty-free, non-exclusive license to use, process, store, and transmit that content solely for the purpose of operating and providing the Service. We do not use your voice recordings or session data to train AI models, and we do not sell your User Content to third parties.</p>
            <p>You represent and warrant that you have all rights necessary to grant this license, and that your User Content does not violate these Terms or any applicable law.</p>
          </Section>

          <Section title="8. Token System & Virtual Items">
            <p>Vocalis may offer a virtual token system used to unlock avatar items and other in-platform features. Tokens have no real-world monetary value and cannot be exchanged for cash or transferred between accounts.</p>
            <p>We reserve the right to modify, suspend, or discontinue the token system, avatar shop, or any virtual items at any time with or without notice. You acknowledge that you have no property rights in any virtual items or token balances.</p>
          </Section>

          <Section title="9. Third-Party Services">
            <p>The Service integrates third-party services including Anthropic, OpenAI, ElevenLabs, Supabase, Vercel, and Resend. Your use of these integrations is subject to those providers&apos; respective terms and policies. We are not responsible for the actions or omissions of third-party providers.</p>
          </Section>

          <Section title="10. Disclaimers">
            <p>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.</p>
            <p>We do not warrant that: (a) the Service will be uninterrupted, error-free, or secure; (b) any AI-generated coaching feedback is accurate, complete, or suitable for any particular purpose; (c) any defects will be corrected.</p>
            <p>AI coaching feedback is generated by automated systems and may contain errors, inaccuracies, or inappropriate content. Use it as one tool among many — not as definitive professional advice.</p>
          </Section>

          <Section title="11. Limitation of Liability">
            <p>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, VOCALIS AND ITS OFFICERS, EMPLOYEES, AGENTS, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF DATA, LOSS OF PROFITS, LOSS OF GOODWILL, OR EMOTIONAL DISTRESS, ARISING OUT OF OR RELATED TO YOUR USE OF OR INABILITY TO USE THE SERVICE.</p>
            <p>IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING FROM OR RELATED TO THESE TERMS OR THE SERVICE EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM, OR (B) $50 USD.</p>
            <p>Some jurisdictions do not allow limitations on implied warranties or exclusion of certain damages, so the above limitations may not apply to you.</p>
          </Section>

          <Section title="12. Indemnification">
            <p>You agree to indemnify, defend, and hold harmless Vocalis and its officers, employees, agents, and affiliates from and against any claims, damages, losses, liabilities, costs, and expenses (including reasonable legal fees) arising out of or related to: (a) your use of the Service; (b) your User Content; (c) your violation of these Terms; or (d) your violation of any third-party rights.</p>
          </Section>

          <Section title="13. Termination">
            <p>We may suspend or terminate your account and access to the Service at any time, with or without notice, for any reason including violation of these Terms.</p>
            <p>You may terminate your account at any time by emailing aieditinglab@gmail.com or by deleting your data via Settings and ceasing use of the Service.</p>
            <p>Upon termination, your license to use the Service ends immediately. Sections 7, 10, 11, 12, and 15 survive termination.</p>
          </Section>

          <Section title="14. Changes to These Terms">
            <p>We reserve the right to modify these Terms at any time. When we do, we will update the "Last updated" date and notify you via email or in-app notification for material changes. Your continued use of the Service after any modification constitutes acceptance of the updated Terms.</p>
            <p>If you disagree with updated Terms, your only remedy is to stop using the Service and delete your account.</p>
          </Section>

          <Section title="15. Governing Law & Dispute Resolution">
            <p>These Terms shall be governed by and construed in accordance with the laws of the State of Texas, United States, without regard to its conflict of law provisions.</p>
            <p>Any dispute arising from or related to these Terms or the Service shall first be attempted to be resolved through good-faith negotiation. If unresolved within 30 days, disputes shall be subject to binding arbitration administered by the American Arbitration Association under its Consumer Arbitration Rules, with proceedings conducted in Texas.</p>
            <p>You waive any right to participate in a class action lawsuit or class-wide arbitration against Vocalis.</p>
          </Section>

          <Section title="16. Contact">
            <p>For any questions about these Terms, contact:</p>
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