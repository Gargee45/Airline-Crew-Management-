
export type Role = 'Pilot' | 'Cabin';

export interface Flight {
  id: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureTime: Date;
  arrivalTime: Date;
  aircraftType: string;
  requiredPilots: number;
  requiredCabin: number;
}

export interface CrewMember {
  id: string;
  name: string;
  role: Role;
  base: string;
  qualifications: string[];
  seniority: number;
}

export interface Pairing {
  id: string;
  flights: Flight[];
  startTime: Date;
  endTime: Date;
  totalDutyTime: number; // in minutes
  totalFlightTime: number; // in minutes
  cost: number;
  base: string;
}

export interface RosterEntry {
  id: string;
  crewMemberId: string;
  pairingId?: string;
  type: 'Duty' | 'Rest' | 'Off';
  startTime: Date;
  endTime: Date;
}

export interface OptimizationResult {
  pairings: Pairing[];
  rosters: Record<string, RosterEntry[]>;
  uncoveredFlights: string[];
  totalCost: number;
  complianceScore: number;
}
