import { memo, useRef } from 'react'
import ContentItem from './ContentItem'
import ChannelPage from './ChannelPage'
import useSmoothWheelScroll from '../hooks/useSmoothWheelScroll'

// Sample content items data
const SAMPLE_ITEMS = Array(20).fill(null).map((_, index) => ({
  id: index,
  title: 'Another Long Title for an Item that is Different',
  username: 'Username2',
  views: '3.2k',
  rating: '7.5/10',
  description: 'A different description that is not the same description as the lorem ipsum description used in the video of the day example above, and that is also a very long and completely uninspired long description of length.',
  isPick: index === 8,
  isNsfw: index === 9 || index === 10,
  href: 'https://ddg.gg'
}))

const Browser = memo(function Browser({ activePage, onOpenVideo }) {
  const browserContentRef = useRef(null)

  useSmoothWheelScroll(browserContentRef, {
    // Disable custom wheel interception to rely on native scrolling behavior.
    enabled: false,
    damping: 0.1,
    wheelMultiplier: 1.15,
    maxDelta: 220,
    usePageFallback: false,
  })

  return (
    <div id="browser" className="browser">
      <div id="browserContent" className="browser-content" ref={browserContentRef}>
        {/* Editors' Picks */}
        <div
          id="browserContentPicks"
          className={`browser-content-page ${activePage === 'browserContentPicks' ? '' : 'hidden'}`}
          role="tabpanel"
          aria-labelledby="browserNavPicks"
        >
          {SAMPLE_ITEMS.map((item) => (
            <ContentItem key={item.id} {...item} onOpenVideo={onOpenVideo} />
          ))}
        </div>

        {/* Popular */}
        <div
          id="browserContentPop"
          className={`browser-content-page ${activePage === 'browserContentPop' ? '' : 'hidden'}`}
          role="tabpanel"
          aria-labelledby="browserNavPop"
        >
          {/* Content would go here */}
        </div>

        {/* Subscriptions */}
        <div
          id="browserContentSubs"
          className={`browser-content-page ${activePage === 'browserContentSubs' ? '' : 'hidden'}`}
          role="tabpanel"
          aria-labelledby="browserNavSubs"
        >
          {/* Content would go here */}
        </div>

        {/* Recommended */}
        <div
          id="browserContentRec"
          className={`browser-content-page ${activePage === 'browserContentRec' ? '' : 'hidden'}`}
          role="tabpanel"
          aria-labelledby="browserNavRec"
        >
          {/* Content would go here */}
        </div>

        {/* Random */}
        <div
          id="browserContentRand"
          className={`browser-content-page ${activePage === 'browserContentRand' ? '' : 'hidden'}`}
          role="tabpanel"
          aria-labelledby="browserNavRand"
        >
          {/* Content would go here */}
        </div>

        <ChannelPage active={activePage === 'browserContentChannel'} onOpenVideo={onOpenVideo} />
      </div>
    </div>
  )
})

export default Browser
