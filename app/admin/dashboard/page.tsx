import { supabaseAdmin } from '@/lib/supabaseAdmin'

export default async function Dashboard() {

  const { data, error } = await supabaseAdmin
    .from('registrations')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error(error)
  }

  const students = data?.filter(
    (item: any) => item.registration_type === 'Student'
  )

  const individuals = data?.filter(
    (item: any) => item.registration_type === 'Individual'
  )

  return (

    <div className="p-10">

      <h1 className="text-3xl font-bold mb-10">
        Energy & Logics Dashboard
      </h1>

      {/* STUDENTS */}

      <h2 className="text-xl font-semibold mb-4">
        Student Internship Applications
      </h2>

      <table className="w-full border mb-10">

        <thead className="bg-gray-100">
          <tr>
            <th className="p-2">Name</th>
            <th>School</th>
            <th>Program</th>
            <th>Level</th>
            <th>Phone</th>
          </tr>
        </thead>

        <tbody>

          {students?.map((s: any) => (
            <tr key={s.id} className="border-t">

              <td className="p-2">{s.full_name}</td>
              <td>{s.school}</td>
              <td>{s.program}</td>
              <td>{s.level}</td>
              <td>{s.phone}</td>

            </tr>
          ))}

        </tbody>

      </table>

      {/* INDIVIDUAL */}

      <h2 className="text-xl font-semibold mb-4">
        Individual Training Applications
      </h2>

      <table className="w-full border">

        <thead className="bg-gray-100">
          <tr>
            <th className="p-2">Name</th>
            <th>Profession</th>
            <th>Training</th>
            <th>Schedule</th>
            <th>Phone</th>
          </tr>
        </thead>

        <tbody>

          {individuals?.map((i: any) => (
            <tr key={i.id} className="border-t">

              <td className="p-2">{i.full_name}</td>
              <td>{i.profession}</td>
              <td>{i.training_program}</td>
              <td>{i.schedule}</td>
              <td>{i.phone}</td>

            </tr>
          ))}

        </tbody>

      </table>

    </div>

  )

}