-- Create registrations table
CREATE TABLE IF NOT EXISTS registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  school VARCHAR(255),
  program VARCHAR(255),
  level VARCHAR(50),
  duration VARCHAR(50),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS registrations_email_idx ON registrations(email);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS registrations_created_at_idx ON registrations(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Public can insert registrations
CREATE POLICY "public_insert_registrations" ON registrations
  FOR INSERT
  WITH CHECK (true);

-- Public can select their own registrations (if needed)
CREATE POLICY "public_select_registrations" ON registrations
  FOR SELECT
  USING (true);

<Card className="mt-8 border-border">

<CardHeader>
<CardTitle>Individual Training Registrations</CardTitle>
</CardHeader>

<CardContent>

<Table>

<TableHeader>
<TableRow>
<TableHead>Name</TableHead>
<TableHead>Email</TableHead>
<TableHead>Phone</TableHead>
<TableHead>Profession</TableHead>
<TableHead>Program</TableHead>
<TableHead>Schedule</TableHead>
<TableHead>Date</TableHead>
</TableRow>
</TableHeader>

<TableBody>

{individualRegistrations.map((reg:any)=>(
<TableRow key={reg.id}>

<TableCell>{reg.full_name}</TableCell>
<TableCell>{reg.email}</TableCell>
<TableCell>{reg.phone}</TableCell>
<TableCell>{reg.profession}</TableCell>
<TableCell>{reg.training_program}</TableCell>
<TableCell>{reg.schedule}</TableCell>
<TableCell>
{new Date(reg.created_at).toLocaleDateString()}
</TableCell>

</TableRow>
))}

</TableBody>

</Table>

</CardContent>

</Card>