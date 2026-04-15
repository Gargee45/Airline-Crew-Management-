
import { Flight, CrewMember, Pairing, RosterEntry, OptimizationResult } from '../types';
import { addMinutes, differenceInMinutes, isBefore, isAfter, startOfDay, endOfDay } from 'date-fns';

const MAX_DUTY_TIME = 12 * 60; // 12 hours
const MIN_REST_TIME = 10 * 60; // 10 hours
const MIN_TURN_TIME = 45; // 45 minutes

export function optimizeCrew(flights: Flight[], crew: CrewMember[]): OptimizationResult {
  const pairings: Pairing[] = [];
  const uncoveredFlights = new Set(flights.map(f => f.id));
  
  // 1. Generate Pairings (Simplified Greedy)
  const bases = Array.from(new Set(crew.map(c => c.base)));
  
  for (const base of bases) {
    let baseFlights = flights.filter(f => f.origin === base && uncoveredFlights.has(f.id));
    
    for (const startFlight of baseFlights) {
      if (!uncoveredFlights.has(startFlight.id)) continue;
      
      const currentPairingFlights: Flight[] = [startFlight];
      uncoveredFlights.delete(startFlight.id);
      
      let currentLoc = startFlight.destination;
      let currentTime = startFlight.arrivalTime;
      let dutyStart = startFlight.departureTime;
      
      // Try to add more flights to this duty
      while (true) {
        const nextFlight = flights.find(f => 
          f.origin === currentLoc && 
          uncoveredFlights.has(f.id) &&
          differenceInMinutes(f.departureTime, currentTime) >= MIN_TURN_TIME &&
          differenceInMinutes(f.arrivalTime, dutyStart) <= MAX_DUTY_TIME
        );
        
        if (nextFlight) {
          currentPairingFlights.push(nextFlight);
          uncoveredFlights.delete(nextFlight.id);
          currentLoc = nextFlight.destination;
          currentTime = nextFlight.arrivalTime;
        } else {
          break;
        }
      }
      
      // If we didn't end at base, we might need a deadhead or it's an overnight
      // For this demo, we'll just create the pairing
      pairings.push({
        id: `PA${3000 + pairings.length}`,
        flights: [...currentPairingFlights],
        startTime: currentPairingFlights[0].departureTime,
        endTime: currentPairingFlights[currentPairingFlights.length - 1].arrivalTime,
        totalDutyTime: differenceInMinutes(
          currentPairingFlights[currentPairingFlights.length - 1].arrivalTime,
          currentPairingFlights[0].departureTime
        ),
        totalFlightTime: currentPairingFlights.reduce((acc, f) => acc + differenceInMinutes(f.arrivalTime, f.departureTime), 0),
        cost: 500 + currentPairingFlights.length * 100 + (currentLoc !== base ? 300 : 0), // Penalty for not ending at base
        base,
      });
    }
  }

  // 2. Assign Pairings to Crew (Rostering)
  const rosters: Record<string, RosterEntry[]> = {};
  crew.forEach(c => rosters[c.id] = []);
  
  const sortedPairings = [...pairings].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  
  for (const pairing of sortedPairings) {
    // Find eligible crew members
    const eligibleCrew = crew.filter(c => {
      if (c.base !== pairing.base) return false;
      
      // Check if qualified for all flights in pairing
      const isQualified = pairing.flights.every(f => c.qualifications.includes(f.aircraftType));
      if (!isQualified) return false;
      
      // Check rest period from last duty
      const lastDuty = rosters[c.id][rosters[c.id].length - 1];
      if (lastDuty && differenceInMinutes(pairing.startTime, lastDuty.endTime) < MIN_REST_TIME) {
        return false;
      }
      
      return true;
    });
    
    // Assign to the one with fewest duties so far (simple load balancing)
    if (eligibleCrew.length > 0) {
      const selectedCrew = eligibleCrew.sort((a, b) => rosters[a.id].length - rosters[b.id].length)[0];
      rosters[selectedCrew.id].push({
        id: `RE${4000 + Math.random()}`,
        crewMemberId: selectedCrew.id,
        pairingId: pairing.id,
        type: 'Duty',
        startTime: pairing.startTime,
        endTime: pairing.endTime,
      });
    }
  }

  // Calculate metrics
  const totalCost = pairings.reduce((acc, p) => acc + p.cost, 0);
  const coverage = 1 - (uncoveredFlights.size / flights.length);
  
  return {
    pairings,
    rosters,
    uncoveredFlights: Array.from(uncoveredFlights),
    totalCost,
    complianceScore: coverage * 100,
  };
}
