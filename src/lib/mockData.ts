
import { Flight, CrewMember, Role } from '../types';
import { addMinutes, startOfDay, addDays, setHours, setMinutes } from 'date-fns';

const AIRPORTS = ['SEA', 'PDX', 'SFO', 'LAX', 'DEN', 'SLC', 'PHX', 'LAS'];
const AIRCRAFT_TYPES = ['E175', 'CRJ900', 'Q400'];

export function generateMockFlights(count: number = 60): Flight[] {
  const flights: Flight[] = [];
  const startDate = startOfDay(new Date());

  for (let i = 0; i < count; i++) {
    const origin = AIRPORTS[Math.floor(Math.random() * AIRPORTS.length)];
    let destination = AIRPORTS[Math.floor(Math.random() * AIRPORTS.length)];
    while (destination === origin) {
      destination = AIRPORTS[Math.floor(Math.random() * AIRPORTS.length)];
    }

    const dayOffset = Math.floor(i / 15); // Spread across a few days
    const hour = 6 + (i % 14); // Flights between 6 AM and 8 PM
    const departureTime = setMinutes(setHours(addDays(startDate, dayOffset), hour), Math.floor(Math.random() * 60));
    const duration = 60 + Math.floor(Math.random() * 120);
    const arrivalTime = addMinutes(departureTime, duration);

    const aircraftType = AIRCRAFT_TYPES[Math.floor(Math.random() * AIRCRAFT_TYPES.length)];

    flights.push({
      id: `FL${1000 + i}`,
      flightNumber: `SK${500 + i}`,
      origin,
      destination,
      departureTime,
      arrivalTime,
      aircraftType,
      requiredPilots: 2,
      requiredCabin: aircraftType === 'Q400' ? 1 : 2,
    });
  }

  return flights.sort((a, b) => a.departureTime.getTime() - b.departureTime.getTime());
}

export function generateMockCrew(count: number = 40): CrewMember[] {
  const crew: CrewMember[] = [];
  const names = [
    'James Smith', 'Maria Garcia', 'Robert Johnson', 'Patricia Miller',
    'Michael Davis', 'Linda Rodriguez', 'William Martinez', 'Elizabeth Hernandez',
    'David Lopez', 'Barbara Gonzalez', 'Richard Wilson', 'Susan Anderson',
    'Joseph Thomas', 'Jessica Taylor', 'Thomas Moore', 'Sarah Jackson',
    'Charles Martin', 'Karen Lee', 'Christopher Perez', 'Nancy Thompson'
  ];

  for (let i = 0; i < count; i++) {
    const role: Role = i < count * 0.4 ? 'Pilot' : 'Cabin';
    crew.push({
      id: `CR${2000 + i}`,
      name: names[i % names.length] + (i >= names.length ? ` ${Math.floor(i / names.length)}` : ''),
      role,
      base: AIRPORTS[Math.floor(Math.random() * 3)], // Bases are SEA, PDX, SFO
      qualifications: AIRCRAFT_TYPES.slice(0, Math.floor(Math.random() * 3) + 1),
      seniority: Math.floor(Math.random() * 20),
    });
  }

  return crew;
}
