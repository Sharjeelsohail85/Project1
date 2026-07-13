import { memo, useCallback, useState } from 'react'
import Upload from './Upload'

const MIN_POST_STEP = 1
const MAX_POST_STEP = 3

const PostPage = memo(function PostPage({ onClose, onVideoReady }) {
  const [postStep, setPostStep] = useState(MIN_POST_STEP)

  const handleNextPostStep = useCallback(() => {
    setPostStep((previousStep) => Math.min(previousStep + 1, MAX_POST_STEP))
  }, [])

  const handlePrevPostStep = useCallback(() => {
    setPostStep((previousStep) => Math.max(previousStep - 1, MIN_POST_STEP))
  }, [])

  const handleClosePost = useCallback(() => {
    setPostStep(MIN_POST_STEP)
    onClose?.()
  }, [onClose])

  return (
    <section className="post-page-shell" aria-label="Post page">
      <Upload
        active={true}
        step={postStep}
        minStep={MIN_POST_STEP}
        maxStep={MAX_POST_STEP}
        onHideUpload={handleClosePost}
        onNextUpload={handleNextPostStep}
        onPrevUpload={handlePrevPostStep}
        onVideoReady={onVideoReady}
      />
    </section>
  )
})

export default PostPage
