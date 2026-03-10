import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function Dashboard() {

  const { data: students } = await supabase
    .from('registrations')
    .select('*')
    .eq('registration_type', 'Student')
    .order('created_at', { ascending: false })

  const { data: individuals } = await supabase
    .from('registrations')
    .select('*')
    .eq('registration_type', 'Individual')
    .order('created_at', { ascending: false })

  return (

    <div className="p-10">

      <h1 className="text-3xl font-bold mb-10">
        Energy & Logics Dashboard
      </h1>

      {/* Students */}

      <h2 className="text-2xl font-semibold mb-4">
        Student Internship Applications
      </h2>

      <table className="w-full border mb-12">

        <thead className="bg-gray-100">
          <tr>
            <th>Name</th>
            <th>School</th>
            <th>Program</th>
            <th>Level</th>
            <th>Phone</th>
          </tr>
        </thead>

        <tbody>

          {students?.map((s: any) => (
            <tr key={s.id} className="border-t">

              <td>{s.full_name}</td>
              <td>{s.school}</td>
              <td>{s.program}</td>
              <td>{s.level}</td>
              <td>{s.phone}</td>

            </tr>
          ))}

        </tbody>

      </table>

      {/* Individuals */}

      <h2 className="text-2xl font-semibold mb-4">
        Individual Training Applications
      </h2>

      <table className="w-full border">

        <thead className="bg-gray-100">
          <tr>
            <th>Name</th>
            <th>Profession</th>
            <th>Training</th>
            <th>Schedule</th>
            <th>Phone</th>
          </tr>
        </thead>

        <tbody>

          {individuals?.map((i: any) => (
            <tr key={i.id} className="border-t">

              <td>{i.full_name}</td>
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