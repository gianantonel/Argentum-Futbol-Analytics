import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';

const DEFAULT_COMPETITION = { competition_id: 43, season_id: 106 };
const CHARTS = [
  ['pass-map', 'Mapa de pases'],
  ['final-third', 'Pases al último tercio'],
  ['shots', 'Mapa de tiros'],
  ['carries', 'Carries progresivos'],
];

function pctX(x) { return (x / 120) * 100; }
function pctY(y) { return (y / 80) * 100; }

function Pitch({ data, chart }) {
  const passes = chart === 'final-third' ? data.passes.filter(p => p.finalThird) : data.passes;
  const carries = chart === 'carries' ? data.carries : [];
  const shots = chart === 'shots' ? data.shots : [];
  return <div className="pitch-wrap">
    <svg viewBox="0 0 120 80" className="pitch" role="img" aria-label="Cancha StatsBomb">
      <defs>
        <marker id="arrowBlue" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L4,2 L0,4 z" fill="#65a9ff" /></marker>
        <marker id="arrowRed" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L4,2 L0,4 z" fill="#ff5a6e" /></marker>
        <marker id="arrowGold" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L4,2 L0,4 z" fill="#d4af37" /></marker>
        <radialGradient id="grass" cx="45%" cy="40%"><stop offset="0%" stopColor="#183c31"/><stop offset="55%" stopColor="#0b251f"/><stop offset="100%" stopColor="#061613"/></radialGradient>
      </defs>
      <rect x="0" y="0" width="120" height="80" rx="1" fill="url(#grass)" />
      {[10,20,30,40,50,60,70,80,90,100,110].map(x => <line key={x} x1={x} x2={x} y1="0" y2="80" className="stripe" />)}
      <rect x="2" y="2" width="116" height="76" fill="none" className="line" />
      <line x1="60" x2="60" y1="2" y2="78" className="line" />
      <circle cx="60" cy="40" r="9.15" fill="none" className="line" />
      <circle cx="60" cy="40" r="0.8" className="dot" />
      <rect x="2" y="18" width="18" height="44" fill="none" className="line" />
      <rect x="100" y="18" width="18" height="44" fill="none" className="line" />
      <rect x="2" y="30" width="6" height="20" fill="none" className="line" />
      <rect x="112" y="30" width="6" height="20" fill="none" className="line" />
      <circle cx="12" cy="40" r="0.8" className="dot" />
      <circle cx="108" cy="40" r="0.8" className="dot" />
      {(chart === 'pass-map' || chart === 'final-third') && passes.slice(0, 450).map((p, i) => <g key={p.id || i} opacity={p.complete ? 0.72 : 0.55}>
        <line x1={p.x} y1={p.y} x2={p.endX} y2={p.endY} className={p.complete ? 'passComplete' : 'passBad'} markerEnd={p.complete ? 'url(#arrowBlue)' : 'url(#arrowRed)'} />
        <circle cx={p.endX} cy={p.endY} r={p.finalThird ? 0.9 : 0.55} className={p.complete ? 'endComplete' : 'endBad'} />
      </g>)}
      {chart === 'shots' && shots.map((s, i) => <g key={s.id || i}>
        <circle cx={s.x} cy={s.y} r={Math.max(1.1, 2.2 + s.xg * 8)} className={s.outcome === 'Goal' ? 'goalShot' : 'shot'} />
      </g>)}
      {chart === 'carries' && carries.slice(0, 350).map((c, i) => <g key={c.id || i} opacity={c.progressive ? 0.75 : 0.35}>
        <line x1={c.x} y1={c.y} x2={c.endX} y2={c.endY} className={c.progressive ? 'carryProg' : 'carry'} markerEnd={c.progressive ? 'url(#arrowGold)' : undefined} />
      </g>)}
      <text x="5" y="7" className="pitchLabel">StatsBomb 120×80</text>
      <text x="82" y="7" className="pitchLabel">ataque →</text>
    </svg>
  </div>;
}

function Stat({ label, value }) { return <div className="stat"><span>{label}</span><strong>{value}</strong></div>; }

export default function Home() {
  const [competitions, setCompetitions] = useState([]);
  const [selectedCompetition, setSelectedCompetition] = useState('43:106');
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [matchId, setMatchId] = useState('');
  const [team, setTeam] = useState('');
  const [chart, setChart] = useState('pass-map');
  const [player, setPlayer] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/competitions').then(r => r.json()).then(j => {
      if (!j.ok) throw new Error(j.error);
      setCompetitions(j.competitions);
    }).catch(e => setError(e.message));
  }, []);

  useEffect(() => {
    const [competition_id, season_id] = selectedCompetition.split(':');
    setLoading(true); setError(''); setMatches([]); setTeams([]); setMatchId(''); setTeam(''); setData(null);
    fetch(`/api/matches?competition_id=${competition_id}&season_id=${season_id}`).then(r => r.json()).then(j => {
      if (!j.ok) throw new Error(j.error);
      setMatches(j.matches); setTeams(j.teams);
      const argentinaFinal = j.matches.find(m => m.match_id === 3869685);
      const first = argentinaFinal || j.matches[j.matches.length - 1] || j.matches[0];
      if (first) {
        setMatchId(String(first.match_id));
        const defaultTeam = first.home_team === 'Argentina' || first.away_team === 'Argentina' ? 'Argentina' : first.home_team;
        setTeam(defaultTeam || j.teams[0] || '');
      }
    }).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [selectedCompetition]);

  useEffect(() => {
    if (!matchId) return;
    setLoading(true); setError('');
    const params = new URLSearchParams({ match_id: matchId, team, chart, player });
    fetch(`/api/events?${params.toString()}`).then(r => r.json()).then(j => {
      if (!j.ok) throw new Error(j.error);
      setData(j);
    }).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [matchId, team, chart, player]);

  const currentMatch = useMemo(() => matches.find(m => String(m.match_id) === String(matchId)), [matches, matchId]);
  const topPlayers = data?.passByPlayer?.slice(0, 8) || [];

  return <>
    <Head>
      <title>Argentum Fútbol Analytics</title>
      <meta name="description" content="Fútbol analytics con StatsBomb open-data: mapas de pases, tiros, carries y último tercio." />
    </Head>
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">ARGENTUM · STATSBOMB OPEN DATA</p>
          <h1>Argentum Fútbol Analytics</h1>
          <p className="lead">Backend ligero sobre datos públicos de StatsBomb y frontend oscuro/minimalista para explorar torneos, temporadas, equipos y visualizaciones sobre una cancha dark con líneas blancas gruesas.</p>
        </div>
        <div className="badge">v0.1<br/><span>primera versión</span></div>
      </section>

      <section className="controls card">
        <label>Torneo / temporada<select value={selectedCompetition} onChange={e => { setSelectedCompetition(e.target.value); setPlayer(''); }}>
          {competitions.map(c => <option key={`${c.competition_id}:${c.season_id}`} value={`${c.competition_id}:${c.season_id}`}>{c.label}</option>)}
        </select></label>
        <label>Partido<select value={matchId} onChange={e => { setMatchId(e.target.value); setPlayer(''); }}>
          {matches.map(m => <option key={m.match_id} value={m.match_id}>{m.label}</option>)}
        </select></label>
        <label>Equipo<select value={team} onChange={e => { setTeam(e.target.value); setPlayer(''); }}>
          {teams.map(t => <option key={t} value={t}>{t}</option>)}
        </select></label>
        <label>Gráfica<select value={chart} onChange={e => setChart(e.target.value)}>
          {CHARTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select></label>
        <label>Jugador<select value={player} onChange={e => setPlayer(e.target.value)}>
          <option value="">Todos</option>
          {(data?.players || []).map(p => <option key={p} value={p}>{p}</option>)}
        </select></label>
      </section>

      {error && <section className="card error">{error}</section>}
      <section className="matchline">
        <span>{currentMatch ? `${currentMatch.home_team} ${currentMatch.home_score}-${currentMatch.away_score} ${currentMatch.away_team}` : 'Cargando partido'}</span>
        <span>{currentMatch?.match_date}</span>
      </section>

      <section className="grid">
        <div className="card field-card">
          <div className="card-title"><span>Cancha</span><strong>{CHARTS.find(c => c[0] === chart)?.[1]}</strong></div>
          {loading && !data ? <div className="loading">Cargando datos StatsBomb…</div> : data && <Pitch data={data} chart={chart} />}
        </div>
        <aside className="card side">
          <div className="card-title"><span>Resumen</span><strong>{team || 'Todos'}</strong></div>
          {data ? <div className="stats">
            <Stat label="Eventos" value={data.summary.events} />
            <Stat label="Pases" value={data.summary.passes} />
            <Stat label="Completos" value={data.summary.completedPasses} />
            <Stat label="Último tercio" value={data.summary.finalThirdPasses} />
            <Stat label="Tiros" value={data.summary.shots} />
            <Stat label="xG" value={data.summary.xg} />
            <Stat label="Carries" value={data.summary.carries} />
            <Stat label="Carries prog." value={data.summary.progressiveCarries} />
          </div> : <div className="loading">Sin datos todavía</div>}
          <div className="ranking">
            <h3>Top pases</h3>
            {topPlayers.map(p => <div className="rank" key={p.player}><span>{p.player}</span><b>{p.total}</b><em>{p.completionPct}%</em></div>)}
          </div>
        </aside>
      </section>
      <footer>Datos: StatsBomb open-data. Esta v0.1 replica el espíritu de la notebook Tiki-Tiki: pases, tiros, carries y último tercio.</footer>
    </main>
  </>;
}
