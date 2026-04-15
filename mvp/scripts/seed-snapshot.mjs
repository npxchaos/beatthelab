#!/usr/bin/env node
/**
 * seed-snapshot.mjs
 *
 * Fetches live tournament data from football-data.org, merges a curated
 * synthetic player roster, and writes the result to src/data/seed.json.
 *
 * Run with:
 *   FOOTBALL_DATA_KEY=<token> node scripts/seed-snapshot.mjs
 *   # or via npm:
 *   npm run seed
 *
 * The resulting file is imported by data.ts as a "seeded" provider, meaning
 * the app works without a live API key at runtime.
 */

import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { resolve, dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, "../src/data/seed.json");

// ─── CLI arg / env ─────────────────────────────────────────────────────────────

const token = process.env.FOOTBALL_DATA_KEY;
if (!token) {
  console.error("Error: FOOTBALL_DATA_KEY env var is required.");
  console.error("Usage: FOOTBALL_DATA_KEY=<token> node scripts/seed-snapshot.mjs");
  process.exit(1);
}

const competition = process.env.FOOTBALL_DATA_COMPETITION ?? "WC";
const baseUrl = process.env.FOOTBALL_DATA_BASE_URL ?? "https://api.football-data.org/v4";
const headers = { "X-Auth-Token": token };

// ─── TLA → flagcdn.com 2-letter code ──────────────────────────────────────────

const TLA_FLAG = {
  ALG: "dz", ARG: "ar", AUS: "au", AUT: "at",
  BEL: "be", BIH: "ba", BRA: "br",
  CAN: "ca", CIV: "ci", COD: "cd", COL: "co", CPV: "cv", CRO: "hr", CUR: "cw", CZE: "cz",
  ECU: "ec", EGY: "eg", ENG: "gb-eng", ESP: "es",
  FRA: "fr",
  GER: "de", GHA: "gh",
  HAI: "ht",
  IRN: "ir", IRQ: "iq",
  JOR: "jo", JPN: "jp",
  KOR: "kr", KSA: "sa",
  MAR: "ma", MEX: "mx",
  NED: "nl", NOR: "no", NZL: "nz",
  PAN: "pa", PAR: "py", POR: "pt",
  QAT: "qa",
  RSA: "za",
  SCO: "gb-sct", SEN: "sn", SUI: "ch", SWE: "se",
  TUN: "tn", TUR: "tr",
  URU: "uy", USA: "us", UZB: "uz",
};

const TLA_POWER = {
  ARG: 94, FRA: 92, ESP: 91, ENG: 90, BRA: 89, POR: 88,
  BEL: 85, NED: 84, GER: 83, COL: 82, URU: 81,
  CRO: 80, MAR: 80, JPN: 79, MEX: 79, SUI: 78, SEN: 78,
  TUR: 77, USA: 77, KOR: 77, AUS: 76, ECU: 75,
  QAT: 74, IRN: 73, NOR: 72, SWE: 71, ALG: 71,
  GHA: 70, EGY: 70, KSA: 69, CIV: 69, SCO: 68, PAN: 68,
  CZE: 67, AUT: 67, TUN: 66, IRQ: 65, PAR: 65,
  JOR: 64, UZB: 63, CPV: 62, NZL: 62, COD: 62,
  BIH: 61, RSA: 60, HAI: 58, CUR: 57,
};

// ─── Synthetic player registry ─────────────────────────────────────────────────
// Maps team.name → star players with sofifa photo IDs

const STARS_BY_TEAM = {
  Argentina:       [{ name: "Lautaro Martínez",   pos: "FWD", sofifaId: 208616 }, { name: "Rodrigo De Paul",   pos: "MID", sofifaId: 214348 }, { name: "Julián Álvarez",    pos: "FWD", sofifaId: 247198 }],
  France:          [{ name: "Kylian Mbappé",       pos: "FWD", sofifaId: 231747 }, { name: "Antoine Griezmann", pos: "MID", sofifaId: 194765 }, { name: "Ousmane Dembélé",  pos: "FWD", sofifaId: 224334 }],
  Spain:           [{ name: "Pedri",               pos: "MID", sofifaId: 325354 }, { name: "Rodri",            pos: "MID", sofifaId: 221518 }, { name: "Gavi",              pos: "MID", sofifaId: 308722 }],
  England:         [{ name: "Jude Bellingham",     pos: "MID", sofifaId: 246268 }, { name: "Bukayo Saka",      pos: "FWD", sofifaId: 256561 }, { name: "Harry Kane",        pos: "FWD", sofifaId: 202126 }],
  Brazil:          [{ name: "Vinícius Júnior",     pos: "FWD", sofifaId: 260098 }, { name: "Rodrygo",          pos: "FWD", sofifaId: 270843 }, { name: "Lucas Paquetá",     pos: "MID", sofifaId: 241027 }],
  Portugal:        [{ name: "Cristiano Ronaldo",   pos: "FWD", sofifaId: 20801  }, { name: "Bruno Fernandes",  pos: "MID", sofifaId: 212831 }, { name: "Rafael Leão",       pos: "FWD", sofifaId: 241084 }],
  Germany:         [{ name: "Jamal Musiala",       pos: "MID", sofifaId: 301648 }, { name: "Florian Wirtz",    pos: "MID", sofifaId: 319619 }, { name: "Kai Havertz",       pos: "FWD", sofifaId: 239085 }],
  Netherlands:     [{ name: "Virgil van Dijk",     pos: "DEF", sofifaId: 203376 }, { name: "Xavi Simons",      pos: "MID", sofifaId: 337145 }, { name: "Memphis Depay",     pos: "FWD", sofifaId: 203282 }],
  Belgium:         [{ name: "Kevin De Bruyne",     pos: "MID", sofifaId: 192985 }, { name: "Romelu Lukaku",    pos: "FWD", sofifaId: 192505 }],
  Colombia:        [{ name: "James Rodríguez",     pos: "MID", sofifaId: 193447 }, { name: "Luis Díaz",        pos: "FWD", sofifaId: 246669 }],
  Uruguay:         [{ name: "Darwin Núñez",        pos: "FWD", sofifaId: 249521 }, { name: "Federico Valverde", pos: "MID", sofifaId: 238796 }],
  Croatia:         [{ name: "Luka Modrić",         pos: "MID", sofifaId: 177003 }, { name: "Mateo Kovačić",    pos: "MID", sofifaId: 188545 }],
  Morocco:         [{ name: "Achraf Hakimi",       pos: "DEF", sofifaId: 231443 }, { name: "Hakim Ziyech",     pos: "MID", sofifaId: 222737 }, { name: "Youssef En-Nesyri", pos: "FWD", sofifaId: 231682 }],
  Japan:           [{ name: "Takefusa Kubo",       pos: "MID", sofifaId: 246392 }, { name: "Wataru Endō",      pos: "MID", sofifaId: 236355 }],
  Mexico:          [{ name: "Hirving Lozano",      pos: "FWD", sofifaId: 239302 }, { name: "Santiago Giménez", pos: "FWD", sofifaId: 251598 }],
  "United States": [{ name: "Christian Pulisic",   pos: "MID", sofifaId: 222665 }, { name: "Gio Reyna",        pos: "MID", sofifaId: 261129 }],
  "South Korea":   [{ name: "Son Heung-min",       pos: "FWD", sofifaId: 200826 }, { name: "Lee Kang-in",      pos: "MID", sofifaId: 250073 }],
  Senegal:         [{ name: "Sadio Mané",          pos: "FWD", sofifaId: 208722 }, { name: "Idrissa Gueye",    pos: "MID", sofifaId: 204679 }],
  Canada:          [{ name: "Alphonso Davies",     pos: "DEF", sofifaId: 243108 }, { name: "Jonathan David",   pos: "FWD", sofifaId: 249652 }],
  Ecuador:         [{ name: "Moisés Caicedo",      pos: "MID", sofifaId: 262240 }, { name: "Enner Valencia",   pos: "FWD", sofifaId: 202126 }],
  Turkey:          [{ name: "Hakan Çalhanoğlu",    pos: "MID", sofifaId: 201024 }, { name: "Arda Güler",       pos: "MID", sofifaId: 357053 }],
  Switzerland:     [{ name: "Granit Xhaka",        pos: "MID", sofifaId: 189615 }, { name: "Breel Embolo",     pos: "FWD", sofifaId: 218922 }],
  Ghana:           [{ name: "Mohammed Kudus",      pos: "MID", sofifaId: 251692 }, { name: "Thomas Partey",    pos: "MID", sofifaId: 210458 }],
  Egypt:           [{ name: "Mohamed Salah",       pos: "FWD", sofifaId: 155862 }, { name: "Mostafa Mohamed",  pos: "FWD", sofifaId: 243089 }],
  Austria:         [{ name: "David Alaba",         pos: "DEF", sofifaId: 189615 }, { name: "Marcel Sabitzer",  pos: "MID", sofifaId: 207431 }],
  Iran:            [{ name: "Mehdi Taremi",        pos: "FWD", sofifaId: 225606 }, { name: "Sardar Azmoun",    pos: "FWD", sofifaId: 219461 }],
  Paraguay:        [{ name: "Miguel Almirón",      pos: "MID", sofifaId: 212838 }],
  Norway:          [{ name: "Erling Haaland",      pos: "FWD", sofifaId: 239085 }, { name: "Martin Ødegaard",  pos: "MID", sofifaId: 231568 }],
  Algeria:         [{ name: "Riyad Mahrez",        pos: "FWD", sofifaId: 197445 }],
};

const sofifaUrl = (id) => `https://cdn.sofifa.net/players/${id}/25_120.png`;

function buildSyntheticPlayers(teams) {
  const players = [];
  for (const team of teams) {
    const stars = STARS_BY_TEAM[team.name] ?? [];
    stars.forEach((star, i) => {
      players.push({
        id:          `syn-${team.id}-${i}`,
        teamId:      team.id,
        name:        star.name,
        position:    star.pos,
        goals:       0,
        assists:     0,
        yellowCards: 0,
        redCards:    0,
        status:      "available",
        overall:     80 + Math.floor(Math.random() * 10),
        photoUrl:    sofifaUrl(star.sofifaId),
      });
    });
    // Always ensure at least 2 players per team for award pickers
    if (stars.length === 0) {
      players.push(
        { id: `syn-${team.id}-0`, teamId: team.id, name: `${team.name} Player A`, position: "FWD", goals: 0, assists: 0, yellowCards: 0, redCards: 0, status: "available", overall: 72 },
        { id: `syn-${team.id}-1`, teamId: team.id, name: `${team.name} Player B`, position: "MID", goals: 0, assists: 0, yellowCards: 0, redCards: 0, status: "available", overall: 70 },
      );
    }
  }
  return players;
}

// ─── API helpers ───────────────────────────────────────────────────────────────

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function normalizeGroup(raw) {
  return raw.replace(/^(?:GROUP_|Group\s*)/i, "").trim();
}

function normalizeStatus(s) {
  if (s === "FINISHED") return "finished";
  if (["IN_PLAY", "PAUSED", "HALFTIME"].includes(s)) return "live";
  return "scheduled";
}

function normalizeStage(stage) {
  const v = stage.toLowerCase();
  if (v.includes("group")) return "group";
  if (v.includes("last_16") || v.includes("round_of_16")) return "round_of_16";
  if (v.includes("quarter")) return "quarter";
  if (v.includes("semi")) return "semi";
  return "final";
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Fetching from football-data.org (competition: ${competition})…`);

  const [standingsRes, matchesRes] = await Promise.all([
    fetch(`${baseUrl}/competitions/${competition}/standings`, { headers }),
    fetch(`${baseUrl}/competitions/${competition}/matches`,  { headers }),
  ]);

  if (!standingsRes.ok) {
    console.error(`Standings request failed: ${standingsRes.status} ${standingsRes.statusText}`);
    process.exit(1);
  }
  if (!matchesRes.ok) {
    console.error(`Matches request failed: ${matchesRes.status} ${matchesRes.statusText}`);
    process.exit(1);
  }

  const standingsJson = await standingsRes.json();
  const matchesJson   = await matchesRes.json();

  // Build teams
  const rawStandings = standingsJson.standings.filter((s) => s.type === "TOTAL");

  const teamRows = rawStandings.flatMap((grp) =>
    grp.table.map((row) => ({
      fdTeam:       row.team,
      group:        normalizeGroup(grp.group),
      points:       row.points,
      goalsFor:     row.goalsFor,
      goalsAgainst: row.goalsAgainst,
    })),
  );

  const teams = teamRows.map((row) => {
    const tla = row.fdTeam.tla;
    const power = TLA_POWER[tla] ?? 65;
    return {
      id:            `fd-${row.fdTeam.id}`,
      slug:          slugify(row.fdTeam.shortName ?? row.fdTeam.name),
      name:          row.fdTeam.name,
      group:         row.group,
      confederation: "Unknown",
      powerIndex:    power,
      formIndex:     Math.max(55, power - 3 + (row.points * 2)),
      goalsFor:      row.goalsFor,
      goalsAgainst:  row.goalsAgainst,
      flagCode:      TLA_FLAG[tla],
    };
  });

  const teamIdMap = new Map(teamRows.map((row) => [row.fdTeam.id, `fd-${row.fdTeam.id}`]));

  // Build fixtures
  const fixtures = matchesJson.matches.reduce((acc, match) => {
    const { id: homeId } = match.homeTeam;
    const { id: awayId } = match.awayTeam;
    if (homeId === null || awayId === null) return acc;
    const homeTeamId = teamIdMap.get(homeId);
    const awayTeamId = teamIdMap.get(awayId);
    if (!homeTeamId || !awayTeamId) return acc;
    acc.push({
      id:         `fd-${match.id}`,
      stage:      normalizeStage(match.stage),
      dateUtc:    match.utcDate,
      homeTeamId,
      awayTeamId,
      status:     normalizeStatus(match.status),
      homeScore:  match.score.fullTime.home,
      awayScore:  match.score.fullTime.away,
      events:     [],
    });
    return acc;
  }, []);

  // Build synthetic players
  const players = buildSyntheticPlayers(teams);

  const seed = {
    seededAt: new Date().toISOString(),
    teams,
    fixtures,
    players,
  };

  writeFileSync(OUT_PATH, JSON.stringify(seed, null, 2));

  console.log(`✓ Seeded ${teams.length} teams, ${fixtures.length} fixtures, ${players.length} players`);
  console.log(`  Written to: ${OUT_PATH}`);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
