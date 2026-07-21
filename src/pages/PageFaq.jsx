import { memo } from 'react'

const PageFaq = memo(function PageFaq() {
  return (
    <div className="faq-page" style={{ padding: '30px 20px', maxWidth: '800px', margin: '0 auto', color: '#333' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '20px', color: '#111' }}>Frequently Asked Questions</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>What is Octopussol?</h3>
        <p style={{ color: '#555', lineHeight: '1.6' }}>
          Octopussol is a video platform designed for creators to upload, migrate, organize, and stream their videos seamlessly.
        </p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>How do I migrate my videos from external services?</h3>
        <p style={{ color: '#555', lineHeight: '1.6' }}>
          You can connect Google Drive or Dropbox from your Post / Studio Migrate page to automatically import your videos into Octopussol.
        </p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>How do background time-sensitive filters work?</h3>
        <p style={{ color: '#555', lineHeight: '1.6' }}>
          The promo overlay automatically calculates the time of day (Dawn, Daytime, Sunset, Night) to adjust image color filters, or you can manually toggle Night or select any preset mode.
        </p>
      </div>
    </div>
  )
})

export default PageFaq
