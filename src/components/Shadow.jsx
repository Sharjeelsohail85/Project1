import { memo } from 'react'

const Shadow = memo(function Shadow({ visible, onClick }) {
  return (
    <div
      id="shadow"
      className={`shadow ${visible ? '' : 'hidden'}`}
      onClick={() => onClick?.()}
      role="presentation"
      aria-hidden="true"
    />
  )
})

export default Shadow
