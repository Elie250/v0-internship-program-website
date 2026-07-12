'use client'

import { PublicCommentPanel } from '@/components/engineering/public-comment-panel'

export function ProfilePostsSection({
  posts,
  isSignedIn,
}: {
  posts: Array<{
    id: string
    title: string | null
    body: string
    createdAt: string
  }>
  isSignedIn: boolean
}) {
  if (posts.length === 0) return null

  function formatWhen(iso: string) {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return ''
    }
  }

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-900">Updates &amp; posts</h2>
      <div className="space-y-6">
        {posts.map((post) => (
          <article
            key={post.id}
            className="rounded-xl border border-slate-200 bg-white p-5 md:p-6 space-y-4"
          >
            <header className="space-y-1">
              {post.title ? (
                <h3 className="text-lg font-semibold text-slate-900">{post.title}</h3>
              ) : null}
              <time className="text-xs text-slate-500">{formatWhen(post.createdAt)}</time>
            </header>
            <p className="text-sm text-slate-700 whitespace-pre-line">{post.body}</p>
            <PublicCommentPanel
              fetchUrl={`/api/engineering/posts/${post.id}/comments`}
              postUrl={`/api/engineering/posts/${post.id}/comments`}
              title="Comments"
              emptyLabel="No comments on this post yet."
              isSignedIn={isSignedIn}
            />
          </article>
        ))}
      </div>
    </section>
  )
}
