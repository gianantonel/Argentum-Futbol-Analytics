import { events, playerName, teamName } from '../../lib/statsbomb';

function xy(loc) {
  return Array.isArray(loc) ? { x: Number(loc[0]), y: Number(loc[1]) } : { x: null, y: null };
}

function passOutcome(e) {
  return e.pass?.outcome?.name || e.pass_outcome || null;
}

export default async function handler(req, res) {
  try {
    const { match_id, team = '', chart = 'pass-map', player = '' } = req.query;
    if (!match_id) return res.status(400).json({ ok: false, error: 'match_id required' });
    const rows = await events(match_id);
    const wantedTeam = String(team || '');
    const filteredTeam = wantedTeam ? rows.filter(e => teamName(e) === wantedTeam) : rows;

    const passesRaw = filteredTeam.filter(e => (e.type?.name || e.type) === 'Pass');
    const shotsRaw = filteredTeam.filter(e => (e.type?.name || e.type) === 'Shot');
    const carriesRaw = filteredTeam.filter(e => (e.type?.name || e.type) === 'Carry');
    const players = [...new Set(filteredTeam.map(playerName).filter(Boolean))].sort();

    let passes = passesRaw.map(e => {
      const start = xy(e.location);
      const end = xy(e.pass?.end_location || e.pass_end_location);
      const outcome = passOutcome(e);
      return {
        id: e.id,
        minute: e.minute,
        second: e.second,
        team: teamName(e),
        player: playerName(e),
        x: start.x, y: start.y,
        endX: end.x, endY: end.y,
        outcome,
        complete: outcome == null,
        finalThird: end.x >= 80 && start.x < 80,
      };
    }).filter(p => p.x != null && p.y != null && p.endX != null && p.endY != null);

    let shots = shotsRaw.map(e => {
      const start = xy(e.location);
      return {
        id: e.id,
        minute: e.minute,
        second: e.second,
        team: teamName(e),
        player: playerName(e),
        x: start.x, y: start.y,
        outcome: e.shot?.outcome?.name || e.shot_outcome || '',
        xg: Number(e.shot?.statsbomb_xg ?? e.shot_statsbomb_xg ?? 0),
      };
    }).filter(s => s.x != null && s.y != null);

    let carries = carriesRaw.map(e => {
      const start = xy(e.location);
      const end = xy(e.carry?.end_location || e.carry_end_location);
      return {
        id: e.id,
        minute: e.minute,
        second: e.second,
        team: teamName(e),
        player: playerName(e),
        x: start.x, y: start.y,
        endX: end.x, endY: end.y,
        progressive: end.x - start.x >= 10,
      };
    }).filter(c => c.x != null && c.y != null && c.endX != null && c.endY != null);

    if (player) {
      passes = passes.filter(p => p.player === player);
      shots = shots.filter(s => s.player === player);
      carries = carries.filter(c => c.player === player);
    }

    const passByPlayer = Object.values(passes.reduce((acc, p) => {
      acc[p.player] ||= { player: p.player, total: 0, completed: 0, incomplete: 0, finalThird: 0, completionPct: 0 };
      acc[p.player].total += 1;
      if (p.complete) acc[p.player].completed += 1; else acc[p.player].incomplete += 1;
      if (p.finalThird) acc[p.player].finalThird += 1;
      return acc;
    }, {})).map(r => ({ ...r, completionPct: r.total ? +(r.completed / r.total * 100).toFixed(1) : 0 })).sort((a, b) => b.total - a.total);

    const summary = {
      events: filteredTeam.length,
      passes: passes.length,
      completedPasses: passes.filter(p => p.complete).length,
      finalThirdPasses: passes.filter(p => p.finalThird).length,
      shots: shots.length,
      xg: +shots.reduce((s, p) => s + p.xg, 0).toFixed(2),
      carries: carries.length,
      progressiveCarries: carries.filter(c => c.progressive).length,
    };

    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=3600');
    res.status(200).json({ ok: true, match_id, team: wantedTeam, chart, player, players, summary, passes, shots, carries, passByPlayer });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}
