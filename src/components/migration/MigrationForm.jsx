import { memo } from 'react'

const MigrationForm = memo(function MigrationForm({
  selectedProvider,
  onSelectProvider,
  onSubmit,
  loading,
  error
}) {
  return (
    <div className="migration-form" style={{ padding: '20px 0' }}>
      <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>Migrate Video Content</h3>
      <p style={{ color: '#666', marginBottom: '16px' }}>Select cloud storage source to import videos into your Octopussol channel.</p>
    </div>
  )
})

export default MigrationForm
