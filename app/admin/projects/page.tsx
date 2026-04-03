'use client';

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Edit, Trash2, PlusCircle, LogOut } from 'lucide-react'

interface Project {
  id: string
  name: string
  description: string
  owner_id: string
  status: 'Pending' | 'Active' | 'Completed' | 'Archived'
  progress: number
  created_at: string
}

export default function AdminProjectsPage() {

  const router = useRouter()

  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  const [searchTerm, setSearchTerm] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    owner_id: '',
    status: 'Pending',
    progress: 0
  })

  useEffect(() => {

    const adminAuth = localStorage.getItem('admin_authenticated')

    if (!adminAuth) {
      router.push('/admin/login')
    }

    fetchProjects()

  }, [])

  const fetchProjects = async () => {

    try {

      const res = await fetch('/api/admin-dashboard/projects')
      const data = await res.json()

      if (data.success) {
        setProjects(data.data)
        setFilteredProjects(data.data)
      }

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {

    let temp = projects

    if (searchTerm) {

      temp = temp.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      )

    }

    setFilteredProjects(temp)

  }, [searchTerm, projects])

  const handleDelete = async (id: string) => {

    if (!confirm('Delete this project?')) return

    const res = await fetch('/api/admin-dashboard/projects', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })

    const data = await res.json()

    if (data.success) {
      setProjects(projects.filter(p => p.id !== id))
    }

  }

  const handleEdit = (project: Project) => {

    setSelectedProject(project)

    setFormData({
      name: project.name,
      description: project.description,
      owner_id: project.owner_id,
      status: project.status,
      progress: project.progress
    })

    setShowModal(true)

  }

  const handleSubmit = async () => {

    const method = selectedProject ? 'PATCH' : 'POST'

    const body = selectedProject
      ? { ...formData, id: selectedProject.id }
      : formData

    const res = await fetch('/api/admin-dashboard/projects', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    const data = await res.json()

    if (data.success) {

      if (selectedProject) {

        setProjects(projects.map(p =>
          p.id === data.data.id ? data.data : p
        ))

      } else {

        setProjects([...projects, data.data])

      }

    }

    setShowModal(false)
    setSelectedProject(null)

  }

  const handleLogout = () => {

    localStorage.removeItem('admin_authenticated')
    router.push('/admin/login')

  }

  const statusColor = (status: Project['status']) => {

    switch (status) {

      case 'Active':
        return 'bg-green-100 text-green-800'

      case 'Completed':
        return 'bg-blue-100 text-blue-800'

      case 'Pending':
        return 'bg-yellow-100 text-yellow-800'

      case 'Archived':
        return 'bg-gray-100 text-gray-800'

      default:
        return 'bg-slate-100 text-slate-800'
    }

  }

  if (loading) {
    return <p className="text-center py-10">Loading projects...</p>
  }

  return (

    <main className="min-h-screen bg-slate-50 p-8">

      <div className="flex justify-between mb-6">

        <h1 className="text-4xl font-bold">Projects Management</h1>

        <div className="flex gap-2">

          <Button
            variant="outline"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>

          <Button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            New Project
          </Button>

        </div>

      </div>

      <Input
        placeholder="Search project..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4"
      />

      <Card className="shadow-lg overflow-x-auto">

        <table className="w-full">

          <thead className="bg-slate-100">

            <tr>

              <th className="px-4 py-2 text-left">Project</th>
              <th>Description</th>
              <th>Status</th>
              <th>Progress</th>
              <th>Actions</th>

            </tr>

          </thead>

          <tbody>

            {filteredProjects.map(project => (

              <tr key={project.id} className="border-b hover:bg-slate-50">

                <td className="px-4 py-2">{project.name}</td>

                <td>{project.description}</td>

                <td>

                  <Badge className={`${statusColor(project.status)} px-2 py-1`}>

                    {project.status}

                  </Badge>

                </td>

                <td>{project.progress}%</td>

                <td className="flex gap-2">

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(project)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(project.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </Card>

      {showModal && (

        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

          <Card className="w-[450px]">

            <CardHeader>

              <CardTitle>

                {selectedProject ? 'Edit Project' : 'Create Project'}

              </CardTitle>

            </CardHeader>

            <CardContent className="space-y-4">

              <Input
                placeholder="Project name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />

              <Input
                placeholder="Description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />

              <Input
                type="number"
                placeholder="Progress %"
                value={formData.progress}
                onChange={(e) =>
                  setFormData({ ...formData, progress: Number(e.target.value) })
                }
              />

              <select
                className="w-full border rounded p-2"
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as Project['status']
                  })
                }
              >

                <option value="Pending">Pending</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Archived">Archived</option>

              </select>

              <div className="flex gap-2">

                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>

                <Button
                  className="flex-1"
                  onClick={handleSubmit}
                >
                  Save
                </Button>

              </div>

            </CardContent>

          </Card>

        </div>

      )}

    </main>

  )

}