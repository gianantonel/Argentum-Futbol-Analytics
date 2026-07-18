import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';

const CHARTS = [
  ['pass-map', 'Mapa de pases'],
  ['final-third', 'Pases al último tercio'],
  ['shots', 'Mapa de tiros'],
  ['carries', 'Carries progresivos'],
];

const MAX_MINUTE = 130;

function clampMinute(value, fallback) {
  const n = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(MAX_MINUTE, n));
}

function Pitch({ data, chart }) {
  const passes = chart === 'final-third' ? data.passes.filter(p => p.finalThird) : data.passes;
  const carries = chart === 'carries' ? data.carries : [];
  const shots = chart === 'shots' ? data.shots : [];
  return <div className="pitch-wrap">
    <svg viewBox="0 0 120 80" className="pitch" role="img" aria-label="Cancha de fútbol">
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
      {(chart === 'pass-map' || chart === 'final-third') && passes.slice(0, 700).map((p, i) => <g key={p.id || i} opacity={p.complete ? 0.72 : 0.55}>
        <line x1={p.x} y1={p.y} x2={p.endX} y2={p.endY} className={p.complete ? 'passComplete' : 'passBad'} markerEnd={p.complete ? 'url(#arrowBlue)' : 'url(#arrowRed)'} />
        <circle cx={p.endX} cy={p.endY} r={p.finalThird ? 0.9 : 0.55} className={p.complete ? 'endComplete' : 'endBad'} />
      </g>)}
      {chart === 'shots' && shots.map((s, i) => <g key={s.id || i}>
        <circle cx={s.x} cy={s.y} r={Math.max(1.1, 2.2 + s.xg * 8)} className={s.outcome === 'Goal' ? 'goalShot' : 'shot'} />
      </g>)}
      {chart === 'carries' && carries.slice(0, 500).map((c, i) => <g key={c.id || i} opacity={c.progressive ? 0.75 : 0.35}>
        <line x1={c.x} y1={c.y} x2={c.endX} y2={c.endY} className={c.progressive ? 'carryProg' : 'carry'} markerEnd={c.progressive ? 'url(#arrowGold)' : undefined} />
      </g>)}
    </svg>
  </div>;
}

function Stat({ label, value }) { return <div className="stat"><span>{label}</span><strong>{value}</strong></div>; }

function MinuteControl({ startMinute, endMinute, setStartMinute, setEndMinute }) {
  function updateStart(value) {
    const next = Math.min(clampMinute(value, startMinute), endMinute);
    setStartMinute(next);
  }
  function updateEnd(value) {
    const next = Math.max(clampMinute(value, endMinute), startMinute);
    setEndMinute(next);
  }
  return <section className="time-card card">
    <div className="time-head">
      <div>
        <span>Tiempo del partido</span>
        <strong>{startMinute}' a {endMinute}'</strong>
      </div>
      <p>Pasos de 5 minutos en los sliders. También podés escribir un minuto entero exacto.</p>
    </div>
    <div className="time-grid">
      <label>Tiempo inicial
        <div className="minute-row">
          <input type="range" min="0" max={MAX_MINUTE} step="5" value={startMinute} onChange={e => updateStart(e.target.value)} />
          <input className="minute-input" type="number" min="0" max={MAX_MINUTE} step="1" value={startMinute} onChange={e => updateStart(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }} />
        </div>
      </label>
      <label>Tiempo final
        <div className="minute-row">
          <input type="range" min="0" max={MAX_MINUTE} step="5" value={endMinute} onChange={e => updateEnd(e.target.value)} />
          <input className="minute-input" type="number" min="0" max={MAX_MINUTE} step="1" value={endMinute} onChange={e => updateEnd(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }} />
        </div>
      </label>
    </div>
  </section>;
}

export default function Home() {
  const [competitions, setCompetitions] = useState([]);
  const [selectedCompetition, setSelectedCompetition] = useState('43:106');
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [matchId, setMatchId] = useState('');
  const [team, setTeam] = useState('');
  const [chart, setChart] = useState('pass-map');
  const [player, setPlayer] = useState('');
  const [startMinute, setStartMinute] = useState(0);
  const [endMinute, setEndMinute] = useState(130);
  const [theme, setTheme] = useState('dark');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('afa-theme') : null;
    if (saved === 'light' || saved === 'dark') setTheme(saved);
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') document.documentElement.dataset.theme = theme;
    if (typeof window !== 'undefined') window.localStorage.setItem('afa-theme', theme);
  }, [theme]);

  useEffect(() => {
    fetch('/api/competitions').then(r => r.json()).then(j => {
      if (!j.ok) throw new Error(j.error);
      setCompetitions(j.competitions);
    }).catch(e => setError(e.message));
  }, []);

  useEffect(() => {
    const [competition_id, season_id] = selectedCompetition.split(':');
    setLoading(true); setError(''); setMatches([]); setTeams([]); setMatchId(''); setTeam(''); setData(null); setPlayer('');
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
    const params = new URLSearchParams({
      match_id: matchId,
      team,
      chart,
      player,
      minute_start: String(startMinute),
      minute_end: String(endMinute),
    });
    fetch(`/api/events?${params.toString()}`).then(r => r.json()).then(j => {
      if (!j.ok) throw new Error(j.error);
      setData(j);
    }).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [matchId, team, chart, player, startMinute, endMinute]);

  const currentMatch = useMemo(() => matches.find(m => String(m.match_id) === String(matchId)), [matches, matchId]);
  const topPlayers = data?.passByPlayer?.slice(0, 8) || [];

  return <>
    <Head>
      <title>Argentum Fútbol Analytics</title>
      <meta name="description" content="App de análisis de datos futbolísticos: mapas de pases, tiros, carries y último tercio." />
    </Head>
    <main className="shell">
      <header className="app-header">
        <div className="brand">
          <img src="/logo.jpg" alt="Argentum Fútbol Analytics" className="brand-logo" />
          <h1>App de análisis de datos futbolísticos</h1>
        </div>
        <button className="theme-toggle" type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Cambiar tema">
          <span>{theme === 'dark' ? 'Tema oscuro' : 'Tema claro'}</span>
          <b>{theme === 'dark' ? 'Claro' : 'Oscuro'}</b>
        </button>
      </header>

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

      <MinuteControl startMinute={startMinute} endMinute={endMinute} setStartMinute={setStartMinute} setEndMinute={setEndMinute} />

      {error && <section className="card error">{error}</section>}
      <section className="matchline">
        <span>{currentMatch ? `${currentMatch.home_team} ${currentMatch.home_score}-${currentMatch.away_score} ${currentMatch.away_team}` : 'Cargando partido'}</span>
        <span>{currentMatch?.match_date}</span>
      </section>

      <section className="field-card card">
        <div className="card-title"><span>{CHARTS.find(c => c[0] === chart)?.[1]}</span><strong>{team || 'Todos'} · {startMinute}'-{endMinute}'</strong></div>
        {loading && !data ? <div className="loading">Cargando datos…</div> : data && <Pitch data={data} chart={chart} />}
      </section>

      <section className="summary-card card">
        <div className="card-title"><span>Resumen</span><strong>{team || 'Todos'}</strong></div>
        {data ? <div className="summary-grid">
          <div className="stats">
            <Stat label="Eventos" value={data.summary.events} />
            <Stat label="Pases" value={data.summary.passes} />
            <Stat label="Completos" value={data.summary.completedPasses} />
            <Stat label="Último tercio" value={data.summary.finalThirdPasses} />
            <Stat label="Tiros" value={data.summary.shots} />
            <Stat label="xG" value={data.summary.xg} />
            <Stat label="Carries" value={data.summary.carries} />
            <Stat label="Carries prog." value={data.summary.progressiveCarries} />
          </div>
          <div className="ranking">
            <h3>Top pases</h3>
            {topPlayers.map(p => <div className="rank" key={p.player}><span>{p.player}</span><b>{p.total}</b><em>{p.completionPct}%</em></div>)}
          </div>
        </div> : <div className="loading">Sin datos todavía</div>}
      </section>

      <footer>Todos los derechos reservados para Gianfranco Antonel</footer>
    </main>
  </>;
}
