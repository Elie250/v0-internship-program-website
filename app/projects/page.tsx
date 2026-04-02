'use client'

export default function ProjectsPage() {
  const projects = [
    {
      id: 1,
      title: 'Smart Home Automation System',
      description: 'IoT-based home automation using Arduino and cloud integration',
      technologies: ['Arduino', 'MQTT', 'Node.js', 'React'],
      status: 'Completed',
    },
    {
      id: 2,
      title: 'Industrial PLC Control System',
      description: 'Manufacturing plant automation with real-time monitoring',
      technologies: ['PLC', 'SCADA', 'HMI', 'Python'],
      status: 'Active',
    },
    {
      id: 3,
      title: 'Renewable Energy Monitoring',
      description: 'Solar farm management and energy analytics platform',
      technologies: ['IoT', 'Data Analytics', 'Web Dashboard', 'Mobile App'],
      status: 'Completed',
    },
    {
      id: 4,
      title: 'Autonomous Robot Development',
      description: 'Robotics research project with machine learning integration',
      technologies: ['ROS', 'Python', 'TensorFlow', 'Arduino'],
      status: 'Active',
    },
  ]

  return (
    <main className="min-h-screen">
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl lg:text-5xl font-bold mb-4">Our Projects</h1>
          <p className="text-xl text-blue-100">Showcasing real-world engineering solutions</p>
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {projects.map((project) => (
              <div key={project.id} className="p-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-lg transition">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold flex-grow">{project.title}</h3>
                  <span className={`px-3 py-1 rounded text-sm font-semibold ${
                    project.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {project.status}
                  </span>
                </div>
                
                <p className="text-slate-600 dark:text-slate-400 mb-4">{project.description}</p>
                
                <div className="flex flex-wrap gap-2">
                  {project.technologies.map((tech, i) => (
                    <span key={i} className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-sm rounded">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
