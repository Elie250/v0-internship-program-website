'use client'

import { Calendar, User, ArrowRight } from 'lucide-react'

export default function BlogPage() {
  const posts = [
    {
      id: 1,
      title: 'Getting Started with Arduino IoT',
      excerpt: 'A beginner\'s guide to building IoT projects with Arduino boards and cloud services.',
      date: '2025-03-10',
      author: 'Dr. Ahmed Hassan',
      category: 'Tutorial',
      readTime: '8 min read',
    },
    {
      id: 2,
      title: 'PLC Programming Best Practices',
      excerpt: 'Explore industry standards and best practices for developing robust PLC applications.',
      date: '2025-03-05',
      author: 'Eng. Mohamed Sayed',
      category: 'Best Practices',
      readTime: '10 min read',
    },
    {
      id: 3,
      title: 'Future of Industrial Automation',
      excerpt: 'How AI and machine learning are revolutionizing the industrial automation sector.',
      date: '2025-02-28',
      author: 'Eng. Fatima Ali',
      category: 'Industry Insights',
      readTime: '12 min read',
    },
    {
      id: 4,
      title: 'MQTT Security Considerations',
      excerpt: 'Implementing secure MQTT protocols for IoT applications in production environments.',
      date: '2025-02-20',
      author: 'Dr. Ahmed Hassan',
      category: 'Security',
      readTime: '9 min read',
    },
  ]

  return (
    <main className="min-h-screen">
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl lg:text-5xl font-bold mb-4">Blog & News</h1>
          <p className="text-xl text-blue-100">Latest articles and insights from our team</p>
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {posts.map((post) => (
              <article key={post.id} className="p-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-lg transition flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm rounded font-semibold">
                    {post.category}
                  </span>
                  <span className="text-sm text-slate-500">{post.readTime}</span>
                </div>

                <h3 className="text-xl font-bold mb-2">{post.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4 flex-grow">{post.excerpt}</p>

                <div className="flex items-center gap-6 text-sm text-slate-500 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(post.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{post.author}</span>
                  </div>
                  <a href="#" className="ml-auto text-blue-600 dark:text-blue-400 font-semibold hover:gap-1 flex items-center transition">
                    Read <ArrowRight className="w-4 h-4 ml-1" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
