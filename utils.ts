
import { OrbitalElements, SpaceTarget, GeoPosition, GroundStation } from './types';

// Constants
const MU = 398600.4418; // Earth's gravitational parameter (km^3/s^2)
const EARTH_RADIUS_KM = 6371.0;
const SECONDS_PER_DAY = 86400;
const VISUAL_SCALE = 60 / EARTH_RADIUS_KM; // Scale km to visual units (Earth Radius = 60)

export const PhysicsEngine = {
  // Calculate period (seconds) from Mean Motion (revs/day)
  getPeriodFromMeanMotion: (mm: number): number => {
    return SECONDS_PER_DAY / mm;
  },

  // Calculate Semi-Major Axis (km) from Mean Motion (revs/day)
  getSMAFromMeanMotion: (mm: number): number => {
    const n = (mm * 2 * Math.PI) / SECONDS_PER_DAY; // rad/s
    return Math.cbrt(MU / (n * n));
  },

  // Calculate Mean Motion (revs/day) from SMA (km)
  getMeanMotionFromSMA: (sma: number): number => {
    const n = Math.sqrt(MU / Math.pow(sma, 3)); // rad/s
    return (n * SECONDS_PER_DAY) / (2 * Math.PI);
  },

  // Get Derived Orbital Parameters (Apogee, Perigee in km)
  getOrbitalDetails: (orbit: OrbitalElements) => {
    const a = orbit.semiMajorAxis;
    const e = orbit.eccentricity;
    const perigee = a * (1 - e) - EARTH_RADIUS_KM;
    const apogee = a * (1 + e) - EARTH_RADIUS_KM;
    const periodMin = (2 * Math.PI * Math.sqrt(Math.pow(a, 3) / MU)) / 60;
    return { perigee, apogee, periodMin };
  },

  // Get ECI (Earth-Centered Inertial) Position and Velocity
  getStateVector: (target: SpaceTarget, timestamp: number): { r: {x:number, y:number, z:number}, v: {x:number, y:number, z:number} } => {
    const { orbit } = target;
    const epochTime = orbit.epoch || 0; 
    const dt = (timestamp - epochTime) / 1000; // seconds since epoch

    // Mean Anomaly M(t)
    const n_rad_s = (orbit.meanMotion * 2 * Math.PI) / SECONDS_PER_DAY;
    const M = (orbit.meanAnomaly * (Math.PI / 180)) + n_rad_s * dt;

    // Kepler's Equation for Eccentric Anomaly E
    let E = M;
    const e = orbit.eccentricity;
    for (let i = 0; i < 10; i++) {
      E = M + e * Math.sin(E);
    }

    const cosE = Math.cos(E);
    const sinE = Math.sin(E);
    const a = orbit.semiMajorAxis;

    // Position in Perifocal
    const P = a * (cosE - e);
    const Q = a * Math.sqrt(1 - e * e) * sinE;
    
    // Velocity in Perifocal (approx)
    const r_dist = a * (1 - e * cosE);
    const v_factor = Math.sqrt(MU * a) / r_dist;
    const vP = -v_factor * sinE;
    const vQ = v_factor * Math.sqrt(1 - e*e) * cosE;

    // Rotate to ECI
    const w = orbit.argPe * (Math.PI / 180);
    const i = orbit.inclination * (Math.PI / 180);
    const O = orbit.raan * (Math.PI / 180);

    const cosO = Math.cos(O); const sinO = Math.sin(O);
    const cosw = Math.cos(w); const sinw = Math.sin(w);
    const cosi = Math.cos(i); const sini = Math.sin(i);

    // Position Rotation
    const x = P * (cosO * cosw - sinO * sinw * cosi) - Q * (cosO * sinw + sinO * cosw * cosi);
    const y = P * (sinO * cosw + cosO * sinw * cosi) - Q * (sinO * sinw - cosO * cosw * cosi);
    const z = P * (sinw * sini) + Q * (cosw * sini);

    // Velocity Rotation
    const vx = vP * (cosO * cosw - sinO * sinw * cosi) - vQ * (cosO * sinw + sinO * cosw * cosi);
    const vy = vP * (sinO * cosw + cosO * sinw * cosi) - vQ * (sinO * sinw - cosO * cosw * cosi);
    const vz = vP * (sinw * sini) + vQ * (cosw * sini);

    return { r: { x, y, z }, v: { x: vx, y: vy, z: vz } };
  },

  // Get Visual Position (Scaled and Swapped for Canvas)
  getPosition: (target: SpaceTarget, timestamp: number): { x: number, y: number, z: number } => {
    const state = PhysicsEngine.getStateVector(target, timestamp);
    // Scale km to visual units
    // Map ECI Z (North) to Canvas -Y (Up)
    // Map ECI X to Canvas X
    // Map ECI Y to Canvas Z (Depth)
    return { 
        x: state.r.x * VISUAL_SCALE, 
        y: -state.r.z * VISUAL_SCALE, // Invert Z for screen Y
        z: state.r.y * VISUAL_SCALE 
    };
  },

  // Calculate Greenwich Mean Sidereal Time (GMST) in Radians
  getGMST: (timestamp: number): number => {
    const now = new Date(timestamp);
    // J2000 epoch
    const J2000 = 946728000000; // 2000-01-01 12:00:00 UTC
    const d = (timestamp - J2000) / 86400000;
    const gmst = (18.697374558 + 24.06570982441908 * d) % 24;
    return (gmst / 24) * 2 * Math.PI;
  },

  // Get Geodetic Coordinates (Lat, Lon, Alt) from ECI
  getGeoPosition: (target: SpaceTarget, timestamp: number): GeoPosition => {
    const state = PhysicsEngine.getStateVector(target, timestamp);
    const { x, y, z } = state.r;
    
    // Calculate GMST
    const gmstRad = PhysicsEngine.getGMST(timestamp);

    // Rotate x,y by GMST to get ECEF
    const x_ecef = x * Math.cos(gmstRad) + y * Math.sin(gmstRad);
    const y_ecef = -x * Math.sin(gmstRad) + y * Math.cos(gmstRad);
    const z_ecef = z;

    // Cartesian to Geodetic
    const r = Math.sqrt(x_ecef*x_ecef + y_ecef*y_ecef);
    const lon = Math.atan2(y_ecef, x_ecef) * (180 / Math.PI);
    const lat = Math.atan2(z_ecef, r) * (180 / Math.PI);
    const alt = Math.sqrt(x*x + y*y + z*z) - EARTH_RADIUS_KM;
    const vel = Math.sqrt(state.v.x*state.v.x + state.v.y*state.v.y + state.v.z*state.v.z);

    return { lat, lon, alt, velocity: vel };
  },

  // Calculate Elevation Look Angle from Ground Station
  getLookAngle: (station: GroundStation, target: SpaceTarget, timestamp: number) => {
    // 1. Get Target Geodetic info
    const geo = PhysicsEngine.getGeoPosition(target, timestamp);
    const r_sat = geo.alt + EARTH_RADIUS_KM;
    
    // Convert Station Lat/Lon to Unit Vector (simplified spherical model)
    const latRad = station.lat * (Math.PI/180);
    const lonRad = station.lon * (Math.PI/180);
    
    // Central angle gamma between sub-satellite point and station
    const phi1 = latRad; 
    const phi2 = geo.lat * (Math.PI/180);
    const lam1 = lonRad;
    const lam2 = geo.lon * (Math.PI/180);

    // Great circle distance formula
    const centralAngle = Math.acos( Math.sin(phi1)*Math.sin(phi2) + Math.cos(phi1)*Math.cos(phi2)*Math.cos(lam2-lam1) );
    
    // Elevation calculation using law of cosines on triangle (Earth Center - Station - Satellite)
    // d^2 = R^2 + r^2 - 2Rr cos(gamma)
    const R = EARTH_RADIUS_KM;
    const r = r_sat;
    const dist = Math.sqrt(R*R + r*r - 2*R*r*Math.cos(centralAngle));

    // sin(El) = (r^2 - R^2 - d^2) / (2Rd)
    const sinEl = (r*r - R*R - dist*dist) / (2*R*dist);
    const el = Math.asin(sinEl) * (180/Math.PI);

    return el;
  },

  parseTLE: (line1: string, line2: string): OrbitalElements | null => {
    try {
      // Standard TLE Parsing
      const epochYearFull = parseInt(line1.substring(18, 20), 10);
      const epochYear = epochYearFull < 57 ? 2000 + epochYearFull : 1900 + epochYearFull;
      const epochDay = parseFloat(line1.substring(20, 32));
      
      const epochDate = new Date(Date.UTC(epochYear, 0, 0)); 
      epochDate.setTime(epochDate.getTime() + epochDay * 24 * 60 * 60 * 1000);
      const epoch = epochDate.getTime();

      const i = parseFloat(line2.substring(8, 16));
      const raan = parseFloat(line2.substring(17, 25));
      const eStr = line2.substring(26, 33);
      const e = parseFloat("0." + eStr);
      const argPe = parseFloat(line2.substring(34, 42));
      const M = parseFloat(line2.substring(43, 51));
      const mm = parseFloat(line2.substring(52, 63));

      const sma = PhysicsEngine.getSMAFromMeanMotion(mm);

      return {
        inclination: i,
        raan: raan,
        eccentricity: e,
        argPe: argPe,
        meanAnomaly: M,
        meanMotion: mm,
        semiMajorAxis: sma,
        color: '#ffffff', // Default
        epoch: epoch
      };
    } catch (err) {
      console.error("TLE Parse Error", err);
      return null;
    }
  },

  // Parse Bulk TLE text
  parseBulkTLE: (text: string): { name: string, l1: string, l2: string }[] => {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    const results = [];
    
    // Try to detect 3-line format vs 2-line format
    // 3-line: Name, Line 1, Line 2
    // 2-line: Line 1, Line 2 (Name usually missing or in previous block)
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('1 ') && lines[i+1]?.startsWith('2 ')) {
        // Check if previous line was a name
        const name = (i > 0 && !lines[i-1].startsWith('1 ') && !lines[i-1].startsWith('2 ')) 
                     ? lines[i-1] 
                     : `TLE_OBJ_${Math.floor(Math.random()*1000)}`;
        results.push({ name, l1: lines[i], l2: lines[i+1] });
        i++; // Skip next line
      }
    }
    return results;
  }
};
