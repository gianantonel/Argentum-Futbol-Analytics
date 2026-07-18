import { matches, teamNameFromMatchField } from '../../lib/statsbomb';

export default async function handler(req, res) {
  try {
    const { competition_id, season_id } = req.query;
    if (!competition_id || !season_id) return res.status(400).json({ ok: false, error: 'competition_id and season_id required' });
    const rows = await matches(competition_id, season_id);
    const clean = rows.map(m => {
      const home = teamNameFromMatchField(m.home_team);
      const away = teamNameFromMatchField(m.away_team);
      return {
        match_id: m.match_id,
        match_date: m.match_date,
        competition: m.competition?.competition_name || m.competition,
        season: m.season?.season_name || m.season,
        home_team: home,
        away_team: away,
        home_score: m.home_score,
        away_score: m.away_score,
        label: `${m.match_date || ''} · ${home} ${m.home_score ?? ''}-${m.away_score ?? ''} ${away}`,
      };
    }).sort((a, b) => (a.match_date || '').localeCompare(b.match_date || ''));
    const teams = [...new Set(clean.flatMap(m => [m.home_team, m.away_team]).filter(Boolean))].sort();
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json({ ok: true, count: clean.length, matches: clean, teams });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}
