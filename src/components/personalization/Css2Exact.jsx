import { memo } from 'react'

const Css2Exact = memo(function Css2Exact() {
  return (
    <div className="personalization-preview-box">
      <p style={{ margin: 0, padding: '12px', fontSize: '13px', color: '#666' }}>
        CSS2 Styling effect preview.
      </p>
    </div>
  )
})

export default Css2Exact
