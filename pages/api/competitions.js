import { competitions } from '../../lib/statsbomb';

export default async function handler(req, res) {
  try {
    const rows = await competitions();
    const clean = rows.map(c => ({
      competition_id: c.competition_id,
      season_id: c.season_id,
      competition_name: c.competition_name,
      season_name: c.season_name,
      country_name: c.country_name,
      competition_gender: c.competition_gender,
      label: `${c.competition_name} · ${c.season_name}`,
    })).sort((a, b) => a.competition_name.localeCompare(b.competition_name) || b.season_name.localeCompare(a.season_name));
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json({ ok: true, count: clean.length, competitions: clean });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}
