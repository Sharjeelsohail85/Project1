import { memo } from 'react'
import ContentItem from './ContentItem'

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
  return (
    <div id="browser" className="browser">
      <div id="browserContent" className="browser-content">
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
      </div>
    </div>
  )
})

export default Browser
