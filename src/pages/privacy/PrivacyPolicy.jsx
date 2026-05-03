export default function PrivacyPolicy() {
  const isMobile = window.innerWidth <= 768

  return (
    <div style={{
      minHeight: '100vh',
      background: '#fff',
      color: '#000',
      fontFamily: 'Arial, sans-serif',
      lineHeight: '1.6',
      padding: isMobile ? '1.5rem 1rem' : '2rem'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <h1 style={{
          fontSize: isMobile ? '1.5rem' : '2rem',
          marginBottom: '0.5rem'
        }}>
          Privacybeleid
        </h1>
        <p style={{
          fontSize: isMobile ? '0.85rem' : '0.9rem',
          color: '#666',
          marginBottom: '2rem'
        }}>
          Laatst bijgewerkt: maart 2026
        </p>

        <p style={{ marginBottom: '1.5rem' }}>
          Kersten Scheffer respecteert jouw privacy. In dit privacybeleid leggen we uit welke gegevens we verzamelen, hoe we die gebruiken, en wat je rechten zijn.
        </p>

        <h2 style={{ fontSize: '1.25rem', marginTop: '2rem', marginBottom: '0.75rem' }}>
          1. Welke Gegevens We Verzamelen
        </h2>
        <p style={{ marginBottom: '0.5rem' }}>
          Wanneer je je aanmeldt voor een gratis intakegesprek via ons formulier, vragen we om:
        </p>
        <ul style={{ marginBottom: '1rem', paddingLeft: '1.5rem' }}>
          <li>Volledige naam</li>
          <li>Telefoonnummer</li>
        </ul>
        <p style={{ marginBottom: '1.5rem' }}>
          Deze gegevens worden alleen gebruikt om je intake in te plannen en je te contacteren.
        </p>

        <h2 style={{ fontSize: '1.25rem', marginTop: '2rem', marginBottom: '0.75rem' }}>
          2. Hoe We Je Gegevens Gebruiken
        </h2>
        <p style={{ marginBottom: '0.5rem' }}>
          We gebruiken je gegevens uitsluitend voor:
        </p>
        <ul style={{ marginBottom: '1rem', paddingLeft: '1.5rem' }}>
          <li>Je bereiken voor het intakegesprek (via WhatsApp)</li>
          <li>De intake in te plannen</li>
          <li>Je informatie te geven over ons programma</li>
        </ul>
        <p style={{ marginBottom: '1.5rem', fontStyle: 'italic' }}>
          We verkopen, delen of verhuren je gegevens nooit aan derden.
        </p>

        <h2 style={{ fontSize: '1.25rem', marginTop: '2rem', marginBottom: '0.75rem' }}>
          3. Hoe We Communiceren
        </h2>
        <p style={{ marginBottom: '0.5rem' }}>
          Na je aanmelding nemen we contact met je op via WhatsApp binnen 1 uur. Dit is de enige manier waarop we je bereiken, tenzij jij ons een ander contactkanaal geeft.
        </p>
        <p style={{ marginBottom: '1.5rem' }}>
          Je kunt dit contact te allen tijde weigeren of onderbreken — zeg het gewoon.
        </p>

        <h2 style={{ fontSize: '1.25rem', marginTop: '2rem', marginBottom: '0.75rem' }}>
          4. Beveiliging van Je Gegevens
        </h2>
        <p style={{ marginBottom: '1.5rem' }}>
          We slaan je gegevens op in beveiligde systemen en treffen redelijke voorzorgsmaatregelen om misbruik te voorkomen.
        </p>

        <h2 style={{ fontSize: '1.25rem', marginTop: '2rem', marginBottom: '0.75rem' }}>
          5. Hoe Lang We Je Gegevens Bewaren
        </h2>
        <p style={{ marginBottom: '1.5rem' }}>
          We bewaren je gegevens 1 jaar na je eerste contact. Na 1 jaar worden ze verwijderd, tenzij je klant bent geworden (dan bewaren we ze zolang je klant bent).
        </p>

        <h2 style={{ fontSize: '1.25rem', marginTop: '2rem', marginBottom: '0.75rem' }}>
          6. Je Rechten
        </h2>
        <p style={{ marginBottom: '0.5rem' }}>
          Je hebt het recht om:
        </p>
        <ul style={{ marginBottom: '1rem', paddingLeft: '1.5rem' }}>
          <li>Je gegevens in te zien — zeg het me, dan stuur ik je precies wat we hebben</li>
          <li>Je gegevens te verwijderen — je kunt ons op elk moment vragen je gegevens te wissen</li>
          <li>Geen marketing meer ontvangen — je kunt je afmelden voor onze berichten</li>
        </ul>
        <p style={{ marginBottom: '1.5rem' }}>
          Stuur een bericht naar Kersten via WhatsApp of DM om een van deze rechten uit te oefenen.
        </p>

        <h2 style={{ fontSize: '1.25rem', marginTop: '2rem', marginBottom: '0.75rem' }}>
          7. Contact
        </h2>
        <p style={{ marginBottom: '1rem' }}>
          Vragen over je privacy of dit beleid? Neem contact op:
        </p>
        <div style={{
          background: '#f5f5f5',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1.5rem'
        }}>
          <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Kersten Scheffer
          </p>
          <p style={{ margin: '0.25rem 0' }}>
            📞 WhatsApp: <a href="https://wa.me/31631388756" style={{ color: '#0066cc', textDecoration: 'none' }}>06 31388756</a>
          </p>
          <p style={{ margin: '0.25rem 0' }}>
            📧 Email: <a href="mailto:kerstenscheffer@gmail.com" style={{ color: '#0066cc', textDecoration: 'none' }}>kerstenscheffer@gmail.com</a>
          </p>
        </div>

        <h2 style={{ fontSize: '1.25rem', marginTop: '2rem', marginBottom: '0.75rem' }}>
          8. Wijzigingen in Dit Beleid
        </h2>
        <p>
          We kunnen dit privacybeleid van tijd tot tijd aanpassen. Als we belangrijke wijzigingen aanbrengen, zullen we je daarvan op de hoogte brengen.
        </p>

        <p style={{ marginTop: '2rem', marginBottom: '2rem', textAlign: 'center', fontWeight: 'bold' }}>
          Je privacy is belangrijk voor ons. Bedankt dat je ons vertrouwt.
        </p>
      </div>
    </div>
  )
}
