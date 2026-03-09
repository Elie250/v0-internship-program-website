'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Search } from 'lucide-react';
import { exportToCSV } from '@/lib/csv-export';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Registration {
  id: string;
  name: string;
  email: string;
  phone: string;
  school: string;
  program: string;
  level: string;
  duration: string;
  message: string;
  created_at: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filteredData, setFilteredData] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProgram, setFilterProgram] = useState('all');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    // Try to fetch data - if user is not authenticated, they'll be redirected by middleware
    fetchRegistrations();
  }, [router]);

  const fetchRegistrations = async () => {
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRegistrations(data || []);
      setFilteredData(data || []);
    } catch (error) {
      console.error('Error fetching registrations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search and filter
  useEffect(() => {
    let filtered = registrations;

    if (searchTerm) {
      filtered = filtered.filter((reg) =>
        reg.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.phone.includes(searchTerm)
      );
    }

    if (filterProgram !== 'all') {
      filtered = filtered.filter((reg) => reg.program === filterProgram);
    }

    setFilteredData(filtered);
  }, [searchTerm, filterProgram, registrations]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportToCSV(filteredData);
    } catch (error) {
      console.error('Error exporting CSV:', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading registrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Registrations Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Manage and view all internship program registrations
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{registrations.length}</div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Filtered Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{filteredData.length}</div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Level 3</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {registrations.filter((r) => r.level === '3').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Export */}
        <Card className="mb-6 border-border">
          <CardHeader>
            <CardTitle>Filters & Export</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="text-sm font-medium">Search</label>
                  <Input
                    placeholder="Search by name, email, or phone"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Filter by Program</label>
                <Select value={filterProgram} onValueChange={setFilterProgram}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Programs</SelectItem>
                    <SelectItem value="ELT">ELT</SelectItem>
                    <SelectItem value="CSA">CSA</SelectItem>
                    <SelectItem value="NIT">NIT</SelectItem>
                    <SelectItem value="ETE">ETE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleExport}
                disabled={isExporting || filteredData.length === 0}
                className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Download className="h-4 w-4" />
                {isExporting ? 'Exporting...' : 'Export CSV'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Registrations Table */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Registrations ({filteredData.length})</CardTitle>
            <CardDescription>
              Showing {filteredData.length} of {registrations.length} registrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredData.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <p>No registrations found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>School</TableHead>
                      <TableHead>Program</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((registration) => (
                      <TableRow key={registration.id} className="border-border">
                        <TableCell className="font-medium">{registration.full_name}</TableCell>
                        <TableCell className="text-sm">{registration.email}</TableCell>
                        <TableCell className="text-sm">{registration.phone}</TableCell>
                        <TableCell className="text-sm">{registration.school}</TableCell>
                        <TableCell className="text-sm">
                          <span className="inline-block rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-medium text-primary">
                            {registration.program}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">{registration.level}</TableCell>
                        <TableCell className="text-sm">{registration.duration}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(registration.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
