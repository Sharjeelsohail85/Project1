import { memo } from 'react'

const TagsPage = memo(function TagsPage() {
  return (
    <div className="tags-page-wrap" style={{ padding: '20px' }}>
      <h2 style={{ fontSize: '20px', marginBottom: '12px' }}>Video Tags & Categories</h2>
      <p style={{ color: '#666', fontSize: '14px' }}>Organize and categorize your video uploads and channels.</p>
    </div>
  )
})

export default TagsPage
