export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
        
        <div className="space-y-2 mb-8 text-gray-400">
          <p><strong>Effective Date:</strong> October 2, 2025</p>
          <p><strong>Last Updated:</strong> October 2, 2025</p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8">
          <p className="text-gray-300 text-lg leading-relaxed">
            This Privacy Policy explains how <strong>Maqro</strong> ("we," "our," "us") collects, uses, and safeguards information as part of our AI-powered sales communication platform ("Services").
          </p>
          
          <p className="text-gray-300 text-lg leading-relaxed">
            We&apos;re committed to transparency, data security, and protecting the privacy of both dealerships and customers.
          </p>

          <hr className="border-gray-700" />

          <section>
            <h2 className="text-2xl font-bold mb-4">1. Information We Collect</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              We collect only the information required to provide and improve our Services:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li><strong>Customer Information:</strong> Name, phone number, and message content when a customer contacts a dealership.</li>
              <li><strong>Dealership Information:</strong> Business contact details, team member information, inventory data, and lead status updates.</li>
              <li><strong>Conversation Data:</strong> SMS, email, or chat exchanges between customers and dealerships, used to deliver and maintain contextual conversations.</li>
              <li><strong>Usage Data:</strong> Log and diagnostic data to monitor service reliability and prevent fraud or abuse.</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-4">
              We do not collect payment card information or sensitive identifiers (e.g., SSNs).
            </p>
          </section>

          <hr className="border-gray-700" />

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Dealership Phone Numbers</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Each dealership using Maqro is assigned its <strong>own dedicated phone number</strong> for customer communications.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>This phone number is provisioned through our SMS provider (e.g., <strong>Telnyx</strong>) and is <strong>registered under that specific dealership&apos;s account</strong>.</li>
              <li>All customer messages sent to or from that number are <strong>securely stored</strong> and associated only with that dealership&apos;s data environment.</li>
              <li>Message data and contact information <strong>are not shared between dealerships</strong> under any circumstances.</li>
              <li>If a dealership leaves the platform, their number and conversation data are <strong>deactivated and removed</strong> after a short retention period.</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-4">
              This design ensures full data isolation and traceability, enabling dealerships to maintain ownership and compliance over their communications.
            </p>
          </section>

          <hr className="border-gray-700" />

          <section>
            <h2 className="text-2xl font-bold mb-4">3. How We Use Information</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              We use collected data to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>Facilitate communication between dealerships and potential buyers.</li>
              <li>Provide real-time conversation context for dealership staff.</li>
              <li>Improve AI conversation quality and response accuracy.</li>
              <li>Generate dealership-level insights (e.g., lead follow-ups, test-drive activity).</li>
              <li>Monitor service health and detect misuse.</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-4">
              We do <strong>not</strong> sell, rent, or share user data for advertising.
            </p>
          </section>

          <hr className="border-gray-700" />

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Security and Compliance</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Maqro includes a built-in <strong>security and compliance layer</strong> to protect dealership and customer data.
            </p>
            <p className="text-gray-300 leading-relaxed mb-4">We use:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li><strong>TLS</strong> encryption in transit and <strong>AES-256</strong> encryption at rest.</li>
              <li>Access controls and audit logs for all dealership accounts.</li>
              <li>Regular internal security reviews.</li>
              <li>Isolation of data per dealership and role-based access for employees.</li>
              <li>Compliance alignment with <strong>GDPR</strong>, <strong>CCPA</strong>, and industry best practices.</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-4">
              Third-party providers (e.g., Telnyx, hosting, or AI infrastructure) are contractually bound to equivalent standards.
            </p>
          </section>

          <hr className="border-gray-700" />

          <section>
            <h2 className="text-2xl font-bold mb-4">5. How We Share Information</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              We may share limited data only with:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li><strong>Dealerships:</strong> so they can respond to customer inquiries and manage leads.</li>
              <li><strong>Service Providers:</strong> who power communication or hosting infrastructure, bound by confidentiality and security terms.</li>
              <li><strong>Legal Authorities:</strong> when required by law or to protect our users&apos; rights or safety.</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-4">
              We do not share customer data between dealerships or unrelated entities.
            </p>
          </section>

          <hr className="border-gray-700" />

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Data Retention</h2>
            <p className="text-gray-300 leading-relaxed">
              Data is retained only as long as needed to operate the platform or meet legal requirements. When no longer needed, data is securely deleted or anonymized.
            </p>
          </section>

          <hr className="border-gray-700" />

          <section>
            <h2 className="text-2xl font-bold mb-4">7. Your Rights</h2>
            <p className="text-gray-300 leading-relaxed">
              You may request access, correction, or deletion of your personal information by contacting <strong>maqrosolutions@gmail.com</strong>. We comply with such requests in accordance with applicable privacy laws.
            </p>
          </section>

          <hr className="border-gray-700" />

          <section>
            <h2 className="text-2xl font-bold mb-4">8. Updates to This Policy</h2>
            <p className="text-gray-300 leading-relaxed">
              We may update this policy periodically. The effective date above reflects the latest version.
            </p>
          </section>

          <hr className="border-gray-700" />

          <section>
            <h2 className="text-2xl font-bold mb-4">9. Contact Us</h2>
            <div className="text-gray-300 leading-relaxed space-y-2">
              <p><strong>Maqro</strong></p>
              <p>Email: <strong>maqrosolutions@gmail.com</strong></p>
              <p>Location: Los Angeles, California, USA</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
  