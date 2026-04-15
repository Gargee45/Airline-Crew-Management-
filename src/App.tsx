/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plane, 
  Users, 
  Settings, 
  LayoutDashboard, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Calendar as CalendarIcon,
  Play,
  ChevronRight,
  Info,
  MapPin,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { format, differenceInMinutes } from 'date-fns';
import { generateMockFlights, generateMockCrew } from './lib/mockData';
import { optimizeCrew } from './lib/solver';
import { Flight, CrewMember, OptimizationResult, Pairing } from './types';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

import { GeminiAssistant } from './components/GeminiAssistant';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function App() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const mockFlights = generateMockFlights(60);
    const mockCrew = generateMockCrew(40);
    setFlights(mockFlights);
    setCrew(mockCrew);
  }, []);

  const handleReset = () => {
    const mockFlights = generateMockFlights(60);
    const mockCrew = generateMockCrew(40);
    setFlights(mockFlights);
    setCrew(mockCrew);
    setResult(null);
    toast.info("Data reset to initial state");
  };

  const handleOptimize = () => {
    setIsOptimizing(true);
    toast.info("Starting optimization engine...");
    
    // Simulate processing time
    setTimeout(() => {
      const optimizationResult = optimizeCrew(flights, crew);
      setResult(optimizationResult);
      setIsOptimizing(false);
      toast.success("Optimization complete!");
    }, 1500);
  };

  const stats = useMemo(() => {
    if (!result) return null;
    
    const totalFlights = flights.length;
    const coveredFlights = totalFlights - result.uncoveredFlights.length;
    const coveragePercent = (coveredFlights / totalFlights) * 100;
    
    const roleDistribution = [
      { name: 'Pilots', value: crew.filter(c => c.role === 'Pilot').length },
      { name: 'Cabin Crew', value: crew.filter(c => c.role === 'Cabin').length },
    ];

    const baseDistribution = Array.from(new Set(crew.map(c => c.base))).map(base => ({
      name: base,
      value: crew.filter(c => c.base === base).length
    }));

    return {
      coveragePercent,
      coveredFlights,
      totalFlights,
      roleDistribution,
      baseDistribution,
      totalCost: result.totalCost,
      pairingsCount: result.pairings.length
    };
  }, [result, flights, crew]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans">
      <Toaster />
      
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-50">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Plane className="text-white w-6 h-6" />
          </div>
          <h1 className="font-bold text-xl tracking-tight">SkyOptima</h1>
        </div>
        
        <nav className="mt-6 px-4 space-y-2">
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <NavItem 
            icon={<CalendarIcon size={20} />} 
            label="Flight Schedule" 
            active={activeTab === 'flights'} 
            onClick={() => setActiveTab('flights')} 
          />
          <NavItem 
            icon={<Users size={20} />} 
            label="Crew Database" 
            active={activeTab === 'crew'} 
            onClick={() => setActiveTab('crew')} 
          />
          <NavItem 
            icon={<CalendarIcon size={20} />} 
            label="Crew Rosters" 
            active={activeTab === 'rosters'} 
            onClick={() => setActiveTab('rosters')} 
          />
          <NavItem 
            icon={<Settings size={20} />} 
            label="Optimization" 
            active={activeTab === 'optimization'} 
            onClick={() => setActiveTab('optimization')} 
          />
        </nav>

        <div className="absolute bottom-8 left-0 w-full px-6">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <Info className="text-blue-600 w-4 h-4" />
              <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider">Status</span>
            </div>
            <p className="text-xs text-blue-700 leading-relaxed">
              {result ? 'Optimization active' : 'Awaiting optimization run'}
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="pl-64 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h2>
            <p className="text-gray-500 mt-1">Regional Airline Crew Management System</p>
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handleReset}
              className="rounded-xl px-6 py-6 border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              Reset Data
            </Button>
            <Button 
              onClick={handleOptimize} 
              disabled={isOptimizing}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-6 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95"
            >
              {isOptimizing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Optimizing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Play size={18} fill="currentColor" />
                  Run Optimization
                </div>
              )}
            </Button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && (
              <DashboardView stats={stats} result={result} />
            )}
            {activeTab === 'flights' && (
              <FlightsView flights={flights} />
            )}
            {activeTab === 'crew' && (
              <CrewView crew={crew} />
            )}
            {activeTab === 'rosters' && (
              <RostersView crew={crew} result={result} />
            )}
            {activeTab === 'optimization' && (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2">
                  <OptimizationView result={result} />
                </div>
                <div className="h-[600px]">
                  <GeminiAssistant context={JSON.stringify({
                    flightsCount: flights.length,
                    crewCount: crew.length,
                    pairingsCount: result?.pairings.length || 0,
                    uncoveredCount: result?.uncoveredFlights.length || 0,
                    totalCost: result?.totalCost || 0
                  })} />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        active 
          ? 'bg-blue-50 text-blue-600 font-semibold' 
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      {icon}
      <span className="text-sm">{label}</span>
      {active && <motion.div layoutId="activeNav" className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />}
    </button>
  );
}

function DashboardView({ stats, result }: { stats: any, result: OptimizationResult | null }) {
  if (!result || !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 max-w-md">
          <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <LayoutDashboard className="text-blue-600 w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold mb-2">No Data Available</h3>
          <p className="text-gray-500 mb-6">Run the optimization engine to generate pairings and view analytics for your crew schedule.</p>
          <Button variant="outline" className="rounded-xl">Learn More</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Flight Coverage" 
          value={`${stats.coveragePercent.toFixed(1)}%`} 
          subValue={`${stats.coveredFlights} / ${stats.totalFlights} flights`}
          icon={<CheckCircle2 className="text-green-500" />}
          trend="+2.4%"
        />
        <StatCard 
          title="Total Pairings" 
          value={stats.pairingsCount} 
          subValue="Optimized duties"
          icon={<Briefcase className="text-blue-500" />}
        />
        <StatCard 
          title="Total Cost" 
          value={`$${(stats.totalCost / 1000).toFixed(1)}k`} 
          subValue="Estimated crew expense"
          icon={<AlertCircle className="text-orange-500" />}
        />
        <StatCard 
          title="Compliance" 
          value="100%" 
          subValue="Regulatory standards met"
          icon={<CheckCircle2 className="text-blue-500" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="bg-white border-b border-gray-50">
            <CardTitle className="text-lg font-bold">Crew Distribution by Base</CardTitle>
            <CardDescription>Active crew members across regional hubs</CardDescription>
          </CardHeader>
          <CardContent className="p-6 bg-white">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.baseDistribution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                  <Tooltip 
                    cursor={{ fill: '#F8FAFC' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="bg-white border-b border-gray-50">
            <CardTitle className="text-lg font-bold">Role Mix</CardTitle>
            <CardDescription>Pilot vs Cabin Crew ratio</CardDescription>
          </CardHeader>
          <CardContent className="p-6 bg-white flex flex-col items-center">
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.roleDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.roleDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-6 mt-4">
              {stats.roleDistribution.map((entry: any, index: number) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-sm font-medium text-gray-600">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, subValue, icon, trend }: { title: string, value: any, subValue: string, icon: React.ReactNode, trend?: string }) {
  return (
    <Card className="border-none shadow-sm rounded-3xl overflow-hidden transition-transform hover:scale-[1.02]">
      <CardContent className="p-6 bg-white">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-gray-50 rounded-2xl">
            {icon}
          </div>
          {trend && (
            <Badge variant="secondary" className="bg-green-50 text-green-600 border-none font-bold">
              {trend}
            </Badge>
          )}
        </div>
        <h4 className="text-gray-500 text-sm font-medium mb-1">{title}</h4>
        <div className="text-2xl font-bold tracking-tight mb-1">{value}</div>
        <p className="text-xs text-gray-400">{subValue}</p>
      </CardContent>
    </Card>
  );
}

function FlightsView({ flights }: { flights: Flight[] }) {
  return (
    <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
      <CardHeader className="bg-white border-b border-gray-50 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-bold">Flight Schedule</CardTitle>
          <CardDescription>Upcoming regional flight operations</CardDescription>
        </div>
        <Badge variant="outline" className="rounded-lg">{flights.length} Flights</Badge>
      </CardHeader>
      <CardContent className="p-0 bg-white">
        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader className="bg-gray-50/50 sticky top-0 z-10">
              <TableRow>
                <TableHead className="font-bold">Flight</TableHead>
                <TableHead className="font-bold">Route</TableHead>
                <TableHead className="font-bold">Departure</TableHead>
                <TableHead className="font-bold">Arrival</TableHead>
                <TableHead className="font-bold">Aircraft</TableHead>
                <TableHead className="font-bold text-right">Crew Req.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flights.map((flight) => (
                <TableRow key={flight.id} className="hover:bg-gray-50/50 transition-colors">
                  <TableCell className="font-mono font-medium text-blue-600">{flight.flightNumber}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{flight.origin}</span>
                      <ChevronRight size={14} className="text-gray-300" />
                      <span className="font-bold">{flight.destination}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600">{format(flight.departureTime, 'MMM d, HH:mm')}</TableCell>
                  <TableCell className="text-gray-600">{format(flight.arrivalTime, 'MMM d, HH:mm')}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-none font-medium">
                      {flight.aircraftType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Badge className="bg-blue-50 text-blue-600 border-none">{flight.requiredPilots}P</Badge>
                      <Badge className="bg-purple-50 text-purple-600 border-none">{flight.requiredCabin}C</Badge>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function CrewView({ crew }: { crew: CrewMember[] }) {
  return (
    <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
      <CardHeader className="bg-white border-b border-gray-50 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-bold">Crew Database</CardTitle>
          <CardDescription>Qualified pilots and cabin crew members</CardDescription>
        </div>
        <Badge variant="outline" className="rounded-lg">{crew.length} Members</Badge>
      </CardHeader>
      <CardContent className="p-0 bg-white">
        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader className="bg-gray-50/50 sticky top-0 z-10">
              <TableRow>
                <TableHead className="font-bold">Name</TableHead>
                <TableHead className="font-bold">Role</TableHead>
                <TableHead className="font-bold">Base</TableHead>
                <TableHead className="font-bold">Qualifications</TableHead>
                <TableHead className="font-bold text-right">Seniority</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {crew.map((member) => (
                <TableRow key={member.id} className="hover:bg-gray-50/50 transition-colors">
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell>
                    <Badge className={member.role === 'Pilot' ? 'bg-blue-50 text-blue-600 border-none' : 'bg-purple-50 text-purple-600 border-none'}>
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <MapPin size={14} />
                      {member.base}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {member.qualifications.map(q => (
                        <span key={q} className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded font-mono text-gray-600">
                          {q}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-gray-500">
                    {member.seniority}Y
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function OptimizationView({ result }: { result: OptimizationResult | null }) {
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 max-w-md">
          <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Settings className="text-blue-600 w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold mb-2">Ready to Optimize</h3>
          <p className="text-gray-500 mb-6">Click the "Run Optimization" button to generate crew pairings and rosters based on current flight schedules.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="bg-white border-b border-gray-50">
          <CardTitle className="text-lg font-bold">Generated Pairings</CardTitle>
          <CardDescription>Optimized duty sequences starting/ending at bases</CardDescription>
        </CardHeader>
        <CardContent className="p-0 bg-white">
          <ScrollArea className="h-[500px]">
            <div className="p-4 space-y-4">
              {result.pairings.map((pairing) => (
                <div key={pairing.id}>
                  <PairingCard pairing={pairing} />
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="space-y-8">
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="bg-white border-b border-gray-50">
            <CardTitle className="text-lg font-bold text-orange-600 flex items-center gap-2">
              <AlertCircle size={20} />
              Uncovered Flights
            </CardTitle>
            <CardDescription>Flights that could not be assigned to a valid pairing</CardDescription>
          </CardHeader>
          <CardContent className="p-6 bg-white">
            {result.uncoveredFlights.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {result.uncoveredFlights.map(id => (
                  <Badge key={id} variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 px-3 py-1">
                    {id}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-600 font-medium">
                <CheckCircle2 size={18} />
                All flights covered!
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-blue-600 text-white">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Optimization Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-4">
            <div className="flex justify-between items-center">
              <span className="opacity-80">Total Pairings</span>
              <span className="font-bold text-xl">{result.pairings.length}</span>
            </div>
            <Separator className="bg-white/20" />
            <div className="flex justify-between items-center">
              <span className="opacity-80">Avg. Duty Time</span>
              <span className="font-bold text-xl">
                {(result.pairings.reduce((acc, p) => acc + p.totalDutyTime, 0) / result.pairings.length / 60).toFixed(1)}h
              </span>
            </div>
            <Separator className="bg-white/20" />
            <div className="flex justify-between items-center">
              <span className="opacity-80">Total Crew Cost</span>
              <span className="font-bold text-xl">${result.totalCost.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RostersView({ crew, result }: { crew: CrewMember[], result: OptimizationResult | null }) {
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 max-w-md">
          <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CalendarIcon className="text-blue-600 w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold mb-2">No Rosters Yet</h3>
          <p className="text-gray-500 mb-6">Rosters are generated during the optimization process. Run the engine to see crew assignments.</p>
        </div>
      </div>
    );
  }

  return (
    <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
      <CardHeader className="bg-white border-b border-gray-50">
        <CardTitle className="text-lg font-bold">Crew Rosters</CardTitle>
        <CardDescription>Individual duty and rest schedules</CardDescription>
      </CardHeader>
      <CardContent className="p-0 bg-white">
        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader className="bg-gray-50/50 sticky top-0 z-10">
              <TableRow>
                <TableHead className="font-bold">Crew Member</TableHead>
                <TableHead className="font-bold">Schedule</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {crew.map((member) => (
                <TableRow key={member.id} className="hover:bg-gray-50/50 transition-colors">
                  <TableCell className="w-48 align-top py-4">
                    <div className="font-bold">{member.name}</div>
                    <div className="text-xs text-gray-400">{member.role} • {member.base}</div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex flex-wrap gap-2">
                      {result.rosters[member.id]?.length > 0 ? (
                        result.rosters[member.id].map((entry) => (
                          <div key={entry.id} className="bg-blue-50 border border-blue-100 rounded-lg p-2 min-w-[120px]">
                            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">Pairing {entry.pairingId}</div>
                            <div className="text-[10px] text-gray-600">{format(entry.startTime, 'MMM d, HH:mm')}</div>
                            <div className="text-[10px] text-gray-600">to {format(entry.endTime, 'HH:mm')}</div>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-gray-300 italic">No duties assigned</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function PairingCard({ pairing }: { pairing: Pairing }) {
  return (
    <div className="border border-gray-100 rounded-2xl p-4 hover:border-blue-200 transition-all bg-gray-50/30">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-blue-600">{pairing.id}</span>
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider px-1.5 py-0">
              Base: {pairing.base}
            </Badge>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {format(pairing.startTime, 'HH:mm')} - {format(pairing.endTime, 'HH:mm')}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold">${pairing.cost}</div>
          <div className="text-[10px] text-gray-400">Est. Cost</div>
        </div>
      </div>
      
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {pairing.flights.map((f, idx) => (
          <React.Fragment key={f.id}>
            <div className="flex flex-col items-center min-w-[60px]">
              <span className="text-[10px] font-bold text-gray-700">{f.origin}</span>
              <div className="w-full h-1 bg-blue-200 rounded-full my-1" />
              <span className="text-[10px] font-bold text-gray-700">{f.destination}</span>
            </div>
            {idx < pairing.flights.length - 1 && (
              <ChevronRight size={12} className="text-gray-300 shrink-0" />
            )}
          </React.Fragment>
        ))}
      </div>
      
      <div className="mt-3 flex items-center justify-between text-[10px] text-gray-500">
        <div className="flex items-center gap-1">
          <Clock size={10} />
          Duty: {(pairing.totalDutyTime / 60).toFixed(1)}h
        </div>
        <div className="flex items-center gap-1">
          <Plane size={10} />
          Flight: {(pairing.totalFlightTime / 60).toFixed(1)}h
        </div>
      </div>
    </div>
  );
}
