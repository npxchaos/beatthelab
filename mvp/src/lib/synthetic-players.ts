import type { Player, Team } from "@/lib/types";

// ─── Known star players per nation (name → team name mapping) ─────────────────
// sofifaId is used for the EA FC photo CDN. Skip if uncertain.

type StarEntry = {
  name:      string;
  position:  Player["position"];
  sofifaId?: number;
};

const STARS_BY_TEAM: Record<string, StarEntry[]> = {
  Argentina: [
    { name: "Lautaro Martínez",   position: "FWD", sofifaId: 208616 },
    { name: "Rodrigo De Paul",     position: "MID", sofifaId: 214348 },
    { name: "Julián Álvarez",      position: "FWD", sofifaId: 247198 },
  ],
  France: [
    { name: "Kylian Mbappé",       position: "FWD", sofifaId: 231747 },
    { name: "Antoine Griezmann",   position: "MID", sofifaId: 194765 },
    { name: "Ousmane Dembélé",     position: "FWD", sofifaId: 224334 },
  ],
  Spain: [
    { name: "Pedri",               position: "MID", sofifaId: 325354 },
    { name: "Rodri",               position: "MID", sofifaId: 221518 },
    { name: "Gavi",                position: "MID", sofifaId: 308722 },
  ],
  England: [
    { name: "Jude Bellingham",     position: "MID", sofifaId: 246268 },
    { name: "Bukayo Saka",         position: "FWD", sofifaId: 256561 },
    { name: "Harry Kane",          position: "FWD", sofifaId: 202126 },
  ],
  Brazil: [
    { name: "Vinícius Júnior",     position: "FWD", sofifaId: 260098 },
    { name: "Rodrygo",             position: "FWD", sofifaId: 270843 },
    { name: "Lucas Paquetá",       position: "MID", sofifaId: 241027 },
  ],
  Portugal: [
    { name: "Cristiano Ronaldo",   position: "FWD", sofifaId: 20801  },
    { name: "Bruno Fernandes",     position: "MID", sofifaId: 212831 },
    { name: "Rafael Leão",         position: "FWD", sofifaId: 241084 },
  ],
  Germany: [
    { name: "Jamal Musiala",       position: "MID", sofifaId: 301648 },
    { name: "Florian Wirtz",       position: "MID", sofifaId: 319619 },
    { name: "Kai Havertz",         position: "FWD", sofifaId: 239085 },
  ],
  Netherlands: [
    { name: "Virgil van Dijk",     position: "DEF", sofifaId: 203376 },
    { name: "Xavi Simons",         position: "MID", sofifaId: 337145 },
    { name: "Memphis Depay",       position: "FWD", sofifaId: 203282 },
  ],
  Belgium: [
    { name: "Kevin De Bruyne",     position: "MID", sofifaId: 192985 },
    { name: "Romelu Lukaku",       position: "FWD", sofifaId: 192505 },
    { name: "Yannick Carrasco",    position: "MID" },
  ],
  Colombia: [
    { name: "James Rodríguez",     position: "MID", sofifaId: 193447 },
    { name: "Luis Díaz",           position: "FWD", sofifaId: 246669 },
    { name: "Falcao",              position: "FWD" },
  ],
  Uruguay: [
    { name: "Darwin Núñez",        position: "FWD", sofifaId: 249521 },
    { name: "Federico Valverde",   position: "MID", sofifaId: 238796 },
    { name: "Rodrigo Bentancur",   position: "MID", sofifaId: 236392 },
  ],
  Croatia: [
    { name: "Luka Modrić",         position: "MID", sofifaId: 177003 },
    { name: "Ivan Perišić",        position: "FWD", sofifaId: 179636 },
    { name: "Mateo Kovačić",       position: "MID", sofifaId: 188545 },
  ],
  Morocco: [
    { name: "Achraf Hakimi",       position: "DEF", sofifaId: 231443 },
    { name: "Hakim Ziyech",        position: "MID", sofifaId: 222737 },
    { name: "Youssef En-Nesyri",   position: "FWD", sofifaId: 231682 },
  ],
  Japan: [
    { name: "Takefusa Kubo",       position: "MID", sofifaId: 246392 },
    { name: "Wataru Endō",         position: "MID", sofifaId: 236355 },
    { name: "Daichi Kamada",       position: "MID", sofifaId: 240096 },
  ],
  Mexico: [
    { name: "Hirving Lozano",      position: "FWD", sofifaId: 239302 },
    { name: "Santiago Giménez",    position: "FWD", sofifaId: 251598 },
    { name: "Édson Álvarez",       position: "MID", sofifaId: 239333 },
  ],
  "United States": [
    { name: "Christian Pulisic",   position: "MID", sofifaId: 222665 },
    { name: "Tyler Adams",         position: "MID", sofifaId: 239318 },
    { name: "Gio Reyna",           position: "MID", sofifaId: 261129 },
  ],
  "South Korea": [
    { name: "Son Heung-min",       position: "FWD", sofifaId: 200826 },
    { name: "Lee Kang-in",         position: "MID", sofifaId: 250073 },
    { name: "Kim Min-jae",         position: "DEF", sofifaId: 239335 },
  ],
  Australia: [
    { name: "Mathew Ryan",         position: "GK"  },
    { name: "Aaron Mooy",          position: "MID" },
    { name: "Martin Boyle",        position: "FWD" },
  ],
  Switzerland: [
    { name: "Granit Xhaka",        position: "MID", sofifaId: 189615 },
    { name: "Xherdan Shaqiri",     position: "MID", sofifaId: 186320 },
    { name: "Breel Embolo",        position: "FWD", sofifaId: 218922 },
  ],
  Senegal: [
    { name: "Sadio Mané",          position: "FWD", sofifaId: 208722 },
    { name: "Idrissa Gueye",       position: "MID", sofifaId: 204679 },
    { name: "Kalidou Koulibaly",   position: "DEF", sofifaId: 213445 },
  ],
  Tunisia: [
    { name: "Wahbi Khazri",        position: "FWD" },
    { name: "Youssef Msakni",      position: "FWD" },
    { name: "Hannibal Mejbri",     position: "MID", sofifaId: 256896 },
  ],
  Ghana: [
    { name: "Mohammed Kudus",      position: "MID", sofifaId: 251692 },
    { name: "Thomas Partey",       position: "MID", sofifaId: 210458 },
    { name: "Jordan Ayew",         position: "FWD", sofifaId: 204606 },
  ],
  Egypt: [
    { name: "Mohamed Salah",       position: "FWD", sofifaId: 155862 },
    { name: "Mostafa Mohamed",     position: "FWD", sofifaId: 243089 },
    { name: "Ahmed Hegazy",        position: "DEF" },
  ],
  "Ivory Coast": [
    { name: "Sébastien Haller",    position: "FWD", sofifaId: 214168 },
    { name: "Franck Kessié",       position: "MID", sofifaId: 222358 },
    { name: "Serge Gnabry",        position: "FWD" },  // placeholder
  ],
  Canada: [
    { name: "Alphonso Davies",     position: "DEF", sofifaId: 243108 },
    { name: "Jonathan David",      position: "FWD", sofifaId: 249652 },
    { name: "Tajon Buchanan",      position: "FWD", sofifaId: 254284 },
  ],
  Ecuador: [
    { name: "Enner Valencia",      position: "FWD", sofifaId: 202126 },
    { name: "Moisés Caicedo",      position: "MID", sofifaId: 262240 },
    { name: "Jeremy Sarmiento",    position: "MID", sofifaId: 257591 },
  ],
  Poland: [
    { name: "Robert Lewandowski",  position: "FWD", sofifaId: 188545 },
    { name: "Piotr Zieliński",     position: "MID", sofifaId: 198435 },
    { name: "Wojciech Szczęsny",   position: "GK",  sofifaId: 185337 },
  ],
  Turkey: [
    { name: "Hakan Çalhanoğlu",    position: "MID", sofifaId: 201024 },
    { name: "Arda Güler",          position: "MID", sofifaId: 357053 },
    { name: "Kerem Aktürkoğlu",    position: "FWD", sofifaId: 251576 },
  ],
  Austria: [
    { name: "David Alaba",         position: "DEF", sofifaId: 189615 },
    { name: "Marcel Sabitzer",     position: "MID", sofifaId: 207431 },
    { name: "Christoph Baumgartner", position: "MID" },
  ],
  Iran: [
    { name: "Mehdi Taremi",        position: "FWD", sofifaId: 225606 },
    { name: "Sardar Azmoun",       position: "FWD", sofifaId: 219461 },
    { name: "Alireza Jahanbakhsh", position: "FWD", sofifaId: 203316 },
  ],
  "Saudi Arabia": [
    { name: "Salem Al-Dawsari",    position: "FWD", sofifaId: 232570 },
    { name: "Mohammed Al-Owais",   position: "GK"  },
    { name: "Firas Al-Buraikan",   position: "FWD" },
  ],
  Qatar: [
    { name: "Akram Afif",          position: "FWD" },
    { name: "Almoez Ali",          position: "FWD" },
    { name: "Hassan Al-Haydos",    position: "MID" },
  ],
  "New Zealand": [
    { name: "Chris Wood",          position: "FWD" },
    { name: "Liberato Cacace",     position: "DEF" },
    { name: "Jai Ingham",          position: "MID" },
  ],
  Panama: [
    { name: "Rolando Blackburn",   position: "FWD" },
    { name: "Adalberto Carrasquilla", position: "MID" },
    { name: "Ricardo Ábrego",      position: "MID" },
  ],
  Paraguay: [
    { name: "Miguel Almirón",      position: "MID", sofifaId: 212838 },
    { name: "Gustavo Gómez",       position: "DEF", sofifaId: 218723 },
    { name: "Alán Benítez",        position: "FWD" },
  ],
  Norway: [
    { name: "Erling Haaland",      position: "FWD", sofifaId: 239085 },
    { name: "Martin Ødegaard",     position: "MID", sofifaId: 231568 },
    { name: "Alexander Sørloth",   position: "FWD", sofifaId: 215464 },
  ],
  Scotland: [
    { name: "Andrew Robertson",    position: "DEF", sofifaId: 209658 },
    { name: "Scott McTominay",     position: "MID", sofifaId: 235224 },
    { name: "Lyndon Dykes",        position: "FWD" },
  ],
  Algeria: [
    { name: "Riyad Mahrez",        position: "FWD", sofifaId: 197445 },
    { name: "Islam Slimani",       position: "FWD" },
    { name: "Sofiane Feghouli",    position: "MID" },
  ],
};

// ─── Sofifa photo URL helper ───────────────────────────────────────────────────
const sofifaUrl = (id: number) =>
  `https://cdn.sofifa.net/players/${id}/25_120.png`;

// ─── Generator ────────────────────────────────────────────────────────────────

export function generateSyntheticPlayers(teams: Team[]): Player[] {
  const players: Player[] = [];

  for (const team of teams) {
    const stars = STARS_BY_TEAM[team.name] ?? [];

    stars.forEach((star, i) => {
      players.push({
        id:        `syn-${team.id}-${i}`,
        teamId:    team.id,
        name:      star.name,
        position:  star.position,
        goals:     0,
        assists:   0,
        yellowCards: 0,
        redCards:  0,
        status:    "available",
        photoUrl:  star.sofifaId ? sofifaUrl(star.sofifaId) : undefined,
        overall:   star.sofifaId ? 80 + Math.floor(Math.random() * 10) : 75,
      });
    });
  }

  return players;
}
