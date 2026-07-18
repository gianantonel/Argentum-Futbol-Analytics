const BASE = 'https://raw.githubusercontent.com/statsbomb/open-data/master/data';

const cache = new Map();
const TTL = 1000 * 60 * 20;

async function getJson(url) {
  const now = Date.now();
  const hit = cache.get(url);
  if (hit && now - hit.time < TTL) return hit.data;
  const res = await fetch(url, {
    headers: { 'user-agent': 'argentum-futbol-analytics/0.1' },
  });
  if (!res.ok) throw new Error(`StatsBomb fetch failed ${res.status} for ${url}`);
  const data = await res.json();
  cache.set(url, { time: now, data });
  return data;
}

export async function competitions() {
  return getJson(`${BASE}/competitions.json`);
}

export async function matches(competitionId, seasonId) {
  return getJson(`${BASE}/matches/${competitionId}/${seasonId}.json`);
}

export async function events(matchId) {
  return getJson(`${BASE}/events/${matchId}.json`);
}

export function uniqueTeams(matchesList) {
  return [...new Set(matchesList.flatMap(m => [m.home_team?.home_team_name || m.home_team, m.away_team?.away_team_name || m.away_team]).filter(Boolean))].sort();
}

export function teamNameFromMatchField(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.name || value.team_name || value.home_team_name || value.away_team_name || '';
}

export function playerName(event) {
  const p = event.player;
  if (!p) return 'Sin jugador';
  return typeof p === 'string' ? p : (p.name || p.player_name || 'Sin jugador');
}

export function teamName(event) {
  const t = event.team;
  if (!t) return '';
  return typeof t === 'string' ? t : (t.name || t.team_name || '');
}
