import { memo } from 'react'

const DailyComments = memo(function DailyComments() {
  return (
    <section className="daily-comments" id="dailyComments" aria-label="Comments">
      <article className="comment comment-level-1">
        <header className="comment-info-wrap">
          <span className="comment-info-item comment-info-user">usrname312</span>
          <time className="comment-info-item comment-info-date">2 Hours Ago</time>
          
          <div className="comment-info-item comment-info-reply button-flat">
            <i className="material-icons" aria-hidden="true">reply</i>
            
            <button
              className="comment-info-item comment-info-vote comment-info-vote-up button-flat"
              aria-label="Upvote comment"
            >
              <i className="material-icons" aria-hidden="true">thumb_up</i>
            </button>
            
            <button
              className="comment-info-item comment-info-vote comment-info-vote-down button-flat"
              aria-label="Downvote comment"
            >
              <i className="material-icons" aria-hidden="true">thumb_down</i>
            </button>
          </div>
          
          <button
            className="comment-info-item comment-info-collapse button-flat"
            aria-label="Collapse comment"
          >
            <i className="material-icons" aria-hidden="true">indeterminate_check_box</i>
          </button>
        </header>
        
        <p className="comment-content">
          Omnis quisquam nihil eveniet et. Et illo pariatur nemo aperiam enim temporibus ut culpa. 
          Eius modi sequi architecto repellat officia. Voluptatem odit autem odio quidem fugit qui reiciendis suscipit.
        </p>
      </article>
    </section>
  )
})

export default DailyComments
