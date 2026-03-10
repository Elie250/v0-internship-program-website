import { supabaseAdmin } from '@/lib/supabaseAdmin'
import DashboardTable from './table'
import { acceptRegistration, declineRegistration } from './actions'
export default async function Dashboard() {

  const { data } = await supabaseAdmin
    .from('registrations')
    .select('*')
    .order('created_at', { ascending: false })

  return (

    <div className="p-10">

      <h1 className="text-3xl font-bold mb-6">
        Energy & Logics Admin Dashboard
      </h1>

      <div className="grid grid-cols-3 gap-6 mb-10">

        <div className="p-6 border rounded-xl">
          <h3 className="text-lg font-semibold">Total Applications</h3>
          <p className="text-3xl font-bold">{data?.length}</p>
        </div>

        <div className="p-6 border rounded-xl">
          <h3 className="text-lg font-semibold">Students</h3>
          <p className="text-3xl font-bold">
            {data?.filter((d: any) => d.registration_type === 'Student').length}
          </p>
        </div>

        <div className="p-6 border rounded-xl">
          <h3 className="text-lg font-semibold">Individuals</h3>
          <p className="text-3xl font-bold">
            {data?.filter((d: any) => d.registration_type === 'Individual').length}
          </p>
        </div>

      </div>

      <DashboardTable registrations={data || []} />

    </div>

  )

}