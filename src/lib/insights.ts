import { ENNEAGRAM, leadingTypes, type EnneagramType, type Person, type QuestionItem } from "./enneagram";

// ============ Utilities ============
function pick<T>(a: T[]): T { return a[Math.floor(Math.random() * a.length)]; }
function names(ns: string[]): string {
  if (ns.length === 0) return "";
  if (ns.length === 1) return ns[0];
  if (ns.length === 2) return `${ns[0]} and ${ns[1]}`;
  return `${ns.slice(0, -1).join(", ")}, and ${ns[ns.length - 1]}`;
}

// ============ Personality Profile ============
export interface PersonalityProfile {
  person: Person;
  dominant: EnneagramType | null;
  wing: EnneagramType | null;
  confidence: number; // 0-100
  top3: { type: EnneagramType; score: number; pct: number }[];
  blend: string;
  role: string;
  howGroupSeesYou: string[];
}

export function buildProfile(person: Person, allPeople: Person[]): PersonalityProfile {
  const entries = (Object.entries(person.scores) as [string, number][])
    .map(([k, v]) => ({ type: Number(k) as EnneagramType, score: v }))
    .sort((a, b) => b.score - a.score);
  const total = entries.reduce((s, e) => s + e.score, 0) || 1;
  const top3 = entries.slice(0, 3).map((e) => ({ ...e, pct: Math.round((e.score / total) * 100) }));
  const dominant = entries[0]?.score > 0 ? entries[0].type : null;
  const second = entries[1]?.score > 0 ? entries[1].type : null;
  // Wing: adjacent type (dominant±1, wrapping 1..9) with higher of the two scores
  let wing: EnneagramType | null = null;
  if (dominant) {
    const left = (((dominant - 1 - 1 + 9) % 9) + 1) as EnneagramType;
    const right = ((dominant % 9) + 1) as EnneagramType;
    const lS = person.scores[left]; const rS = person.scores[right];
    wing = lS === 0 && rS === 0 ? null : lS >= rS ? left : right;
  }
  // Confidence: how dominant the top type is vs #2
  const gap = (entries[0]?.score ?? 0) - (entries[1]?.score ?? 0);
  const confidence = Math.max(20, Math.min(99, Math.round(40 + (gap / Math.max(1, total)) * 200 + (dominant ? 20 : 0))));
  const role = dominant ? ENNEAGRAM[dominant].role : "The Newcomer";
  const blend =
    dominant && second
      ? `${ENNEAGRAM[dominant].role} with a ${ENNEAGRAM[second].role} streak`
      : dominant
      ? `A pure ${ENNEAGRAM[dominant].role}`
      : "Still forming";

  // How the group sees you — data-driven
  const seen: string[] = [];
  const winRate = person.nominations > 0 ? person.wins / person.nominations : 0;
  if (person.nominations >= Math.max(2, Math.floor(allPeople.length / 3))) {
    seen.push(`You were on people's minds — nominated in ${person.nominations} moments across the night.`);
  }
  if (person.wins >= 3) {
    seen.push(`The group repeatedly landed on you when it mattered — ${person.wins} wins tonight.`);
  }
  if (winRate >= 0.6 && person.nominations >= 2) {
    seen.push(`When you were named, the room agreed — ${Math.round(winRate * 100)}% of your nominations became wins.`);
  }
  if (person.nominations > 0 && person.wins === 0) {
    seen.push(`People kept thinking of you even when the spotlight went elsewhere — a quiet, trusted presence.`);
  }
  if (dominant) {
    const info = ENNEAGRAM[dominant];
    seen.push(`Whenever a moment called for ${info.keywords[0].toLowerCase()} or ${info.keywords[1].toLowerCase()}, your name came up.`);
    seen.push(`The group sees you as ${info.role.toLowerCase()} — ${info.title.toLowerCase()}.`);
  }
  if (dominant && wing && wing !== dominant) {
    seen.push(`They also see a ${ENNEAGRAM[wing].keywords[0].toLowerCase()} edge in you — you don't fit just one box.`);
  }
  if (seen.length === 0) seen.push("The group is still getting to know your rhythm. Keep playing!");

  return { person, dominant, wing, confidence, top3, blend, role, howGroupSeesYou: seen };
}

// ============ Scenarios ============
export function scenariosFor(profile: PersonalityProfile): Record<string, string> {
  const t = profile.dominant;
  const name = profile.person.name;
  if (!t) {
    const empty = `${name} is still revealing themselves — nothing to say yet.`;
    return {
      "On A Typical Day": empty, "In A Crisis": empty, "During Conflict": empty,
      "In A Team Project": empty, "As A Leader": empty, "As A Friend": empty,
    };
  }
  const S: Record<EnneagramType, Record<string, string>> = {
    1: {
      "On A Typical Day": `${name} moves with quiet purpose — lists get crossed off, standards get held, and small things are noticed.`,
      "In A Crisis": `${name} steadies the room by finding the right thing to do, then doing it precisely.`,
      "During Conflict": `${name} pushes for what's fair — sometimes at the cost of what's easy.`,
      "In A Team Project": `${name} is the one who fixes what everyone else missed at the last minute.`,
      "As A Leader": `${name} leads by principle. Expect high standards and no shortcuts.`,
      "As A Friend": `${name} is the friend who tells you the truth — because they respect you enough to.`,
    },
    2: {
      "On A Typical Day": `${name} is quietly noticing what everyone needs before they say it.`,
      "In A Crisis": `${name} shows up with food, with hugs, with the practical thing you didn't know you needed.`,
      "During Conflict": `${name} tries to help everyone feel heard — even the person being difficult.`,
      "In A Team Project": `${name} is the emotional glue — the one who keeps the group actually a group.`,
      "As A Leader": `${name} leads through relationship. People follow because they feel seen.`,
      "As A Friend": `${name} is the friend who remembers everything about you and celebrates you loudly.`,
    },
    3: {
      "On A Typical Day": `${name} is already three steps into the goal you're still describing.`,
      "In A Crisis": `${name} snaps into action mode — deliver first, feel later.`,
      "During Conflict": `${name} wants a resolution that works, keeps their reputation clean, and moves on fast.`,
      "In A Team Project": `${name} sets the pace and drags results across the line.`,
      "As A Leader": `${name} leads from the front. Vision, energy, results.`,
      "As A Friend": `${name} is the friend who genuinely wants to see you win — and helps you do it.`,
    },
    4: {
      "On A Typical Day": `${name} sees the beauty and the ache in ordinary moments most people breeze past.`,
      "In A Crisis": `${name} names what everyone else is feeling but won't say.`,
      "During Conflict": `${name} needs to be understood, not fixed. Meaning matters more than resolution.`,
      "In A Team Project": `${name} brings the idea nobody else would've thought of — and defends its soul.`,
      "As A Leader": `${name} leads with meaning. Work has to matter.`,
      "As A Friend": `${name} is the friend who goes deep fast — no small talk, real conversation.`,
    },
    5: {
      "On A Typical Day": `${name} is quietly mastering something. You'll find out later how good they got.`,
      "In A Crisis": `${name} goes calm and analytical — while everyone else is losing signal, they're finding it.`,
      "During Conflict": `${name} steps back, thinks it through, and returns with a precise answer.`,
      "In A Team Project": `${name} is the one who actually understands the thing. Ask them the hard question.`,
      "As A Leader": `${name} leads by expertise. Trust the depth of what they know.`,
      "As A Friend": `${name} is the friend who's low-maintenance but shows up with real substance when it counts.`,
    },
    6: {
      "On A Typical Day": `${name} is scanning for what could go wrong — and quietly making sure it won't.`,
      "In A Crisis": `${name} is the person you actually want next to you. Loyal, prepared, on your side.`,
      "During Conflict": `${name} needs to know who's safe. Once they do, they'll fight for their people.`,
      "In A Team Project": `${name} is the one who spotted the risk everyone else ignored.`,
      "As A Leader": `${name} leads by commitment. They will not leave their people behind.`,
      "As A Friend": `${name} is the friend who never bails, never forgets, and always has your back.`,
    },
    7: {
      "On A Typical Day": `${name} is already onto the next idea, and the one after that, and you're invited.`,
      "In A Crisis": `${name} keeps morale up by finding the angle nobody else saw.`,
      "During Conflict": `${name} reframes fast — sometimes too fast for the person still hurting.`,
      "In A Team Project": `${name} brings the spark and the twelve ideas. The trick is picking one.`,
      "As A Leader": `${name} leads by energy. Follow them into places you'd never go alone.`,
      "As A Friend": `${name} is the friend your best stories are about.`,
    },
    8: {
      "On A Typical Day": `${name} is deciding. Fast, clear, not asking permission.`,
      "In A Crisis": `${name} takes the wheel. Everything gets simpler.`,
      "During Conflict": `${name} goes direct. If they push you, it's usually because they respect you.`,
      "In A Team Project": `${name} pushes the group past the polite ceiling into what's actually possible.`,
      "As A Leader": `${name} leads by presence. They protect their people and refuse to lose.`,
      "As A Friend": `${name} is the friend who'd absolutely show up if you called at 3am.`,
    },
    9: {
      "On A Typical Day": `${name} is quietly holding the room together — steady, warm, unhurried.`,
      "In A Crisis": `${name} keeps everyone calm and reminds them they'll get through it.`,
      "During Conflict": `${name} sees every side. That's a gift, and a trap.`,
      "In A Team Project": `${name} is the mediator — the one who makes the group actually work.`,
      "As A Leader": `${name} leads by consensus. Nobody feels left out.`,
      "As A Friend": `${name} is the friend who feels like home.`,
    },
  };
  return S[t];
}

// ============ Random Group Insights ============
export function randomInsight(
  people: Person[],
  questions: QuestionItem[],
  currentIndex: number,
): string {
  const list = people;
  if (list.length === 0) return "The group is warming up — everyone's still finding their voice.";
  const options: string[] = [];
  const sortedNoms = [...list].sort((a, b) => b.nominations - a.nominations);
  const sortedWins = [...list].sort((a, b) => b.wins - a.wins);
  const topNom = sortedNoms[0];
  const topWin = sortedWins[0];
  if (topNom && topNom.nominations >= 3) {
    options.push(`${topNom.name} has been on people's minds — nominated ${topNom.nominations} times already.`);
  }
  if (topWin && topWin.wins >= 3) {
    options.push(`${topWin.name} has quietly become the frontrunner — ${topWin.wins} wins and counting.`);
  }
  const totals: Record<EnneagramType, number> = { 1:0,2:0,3:0,4:0,5:0,6:0,7:0,8:0,9:0 };
  list.forEach((p) => (Object.keys(totals) as unknown as string[]).forEach((k) => {
    totals[Number(k) as EnneagramType] += p.scores[Number(k) as EnneagramType];
  }));
  const topType = (Object.entries(totals) as [string, number][])
    .sort((a, b) => b[1] - a[1])[0];
  if (topType && topType[1] > 0) {
    const t = Number(topType[0]) as EnneagramType;
    options.push(`${ENNEAGRAM[t].role} energy is dominating tonight — the group keeps picking ${ENNEAGRAM[t].keywords[0].toLowerCase()}.`);
  }
  // Repeated leadership picks
  const leaderScores = list
    .map((p) => ({ name: p.name, s: (p.scores[3] ?? 0) + (p.scores[8] ?? 0) }))
    .sort((a, b) => b.s - a.s);
  if (leaderScores[0] && leaderScores[0].s >= 6) {
    options.push(`The group keeps looking to ${leaderScores[0].name} for the leadership calls.`);
  }
  const supporters = list
    .map((p) => ({ name: p.name, s: (p.scores[2] ?? 0) + (p.scores[9] ?? 0) }))
    .sort((a, b) => b.s - a.s);
  if (supporters[0] && supporters[0].s >= 6) {
    options.push(`${supporters[0].name} is the emotional anchor — support and warmth keep coming back to them.`);
  }
  const done = Math.max(1, currentIndex);
  options.push(`${done} question${done === 1 ? "" : "s"} in, ${list.length} personalities on the board.`);
  if (questions.length && currentIndex + 1 < questions.length) {
    const remaining = questions.length - currentIndex - 1;
    options.push(`${remaining} question${remaining === 1 ? "" : "s"} left. The story is far from over.`);
  }
  // Undefeated
  const undefeated = list.filter((p) => p.nominations >= 2 && p.wins === p.nominations);
  if (undefeated.length) {
    options.push(`${undefeated[0].name} is undefeated tonight — every nomination has turned into a win.`);
  }
  return pick(options);
}

// ============ Group Story ============
export interface GroupStory {
  archetype: string;
  story: string;
  superpower: string;
  challenge: string;
  works: string;
  problems: string;
  conflict: string;
  innovates: string;
  supports: string;
}

export function groupStory(people: Person[]): GroupStory {
  if (people.length === 0) {
    const empty = "Waiting for the story to begin.";
    return { archetype: "Yet to be written", story: empty, superpower: empty, challenge: empty, works: empty, problems: empty, conflict: empty, innovates: empty, supports: empty };
  }
  const dist: Record<EnneagramType, string[]> = { 1:[],2:[],3:[],4:[],5:[],6:[],7:[],8:[],9:[] };
  people.forEach((p) => {
    const { leading } = leadingTypes(p.scores);
    if (leading) dist[leading].push(p.name);
  });
  const withLeaders = names(dist[3].concat(dist[8]));
  const withHelpers = names(dist[2].concat(dist[9]));
  const withCreators = names(dist[4].concat(dist[7]));
  const withThinkers = names(dist[5].concat(dist[6]));
  const dominantEntry = (Object.entries(dist) as [string, string[]][])
    .sort((a, b) => b[1].length - a[1].length)[0];
  const dominantT = Number(dominantEntry[0]) as EnneagramType;
  const archetype = `The ${ENNEAGRAM[dominantT].role.replace("The ", "")}-Led Ensemble`;
  const story = `Every crew has a shape. Yours is built around ${withLeaders || "quiet leadership"}, held together by ${withHelpers || "the peacemakers"}, and colored by ${withCreators || "moments of spark"}. Together you make the kind of group that doesn't happen twice.`;
  const superpower = withLeaders && withHelpers
    ? `When ${names(dist[3].concat(dist[8]).slice(0, 2))} decide something and ${names(dist[2].concat(dist[9]).slice(0, 2))} rally the room around it — this group moves.`
    : `This group's superpower is that everyone brings something the others don't.`;
  const challenge = dist[9].length + dist[2].length > people.length * 0.5
    ? `So much harmony that hard truths get softened. Watch for the thing no one wants to say.`
    : dist[8].length + dist[3].length > people.length * 0.5
    ? `A lot of drive in the room. Watch for the quieter voices getting steamrolled.`
    : `A wide mix of energies. The challenge is coordinating them without flattening what makes each one special.`;
  const works = `${withLeaders || "The doers"} set direction, ${withThinkers || "the thinkers"} pressure-test it, and ${withHelpers || "the connectors"} make sure everyone stays in the room.`;
  const problems = `${withThinkers || "The analysts"} name what's actually going on. ${withLeaders || "The doers"} pick a path. ${withHelpers || "The peacemakers"} carry the group through it.`;
  const conflict = dist[9].length
    ? `${names(dist[9].slice(0, 2))} step in to mediate. That's the good news. The trap: the tension gets smoothed before it gets solved.`
    : `Conflict here goes direct. Which means it either resolves fast — or leaves a mark.`;
  const innovates = withCreators
    ? `${names(dist[4].concat(dist[7]).slice(0, 3))} bring the ideas nobody else would've thought of. The group's job is to catch the good ones before they scatter.`
    : `Ideas come from unexpected places here. Nobody's the designated creative — which is a strength if the group listens.`;
  const supports = withHelpers
    ? `${names(dist[2].concat(dist[9]).slice(0, 3))} carry the emotional weight — often invisibly. Notice them tonight.`
    : `Support in this group is direct, not sentimental. It shows up as action, not words.`;
  return { archetype, story, superpower, challenge, works, problems, conflict, innovates, supports };
}

// ============ Awards ============
export interface Award {
  title: string;
  winner: string | null;
  subtitle: string;
  color: string;
  emoji: string;
}

export function awards(people: Person[]): Award[] {
  const list = people;
  const empty = (title: string, sub: string, color: string, emoji: string): Award =>
    ({ title, winner: null, subtitle: sub, color, emoji });
  if (list.length === 0) {
    return [empty("Most Loved", "TBD", "oklch(0.72 0.17 350)", "❤️")];
  }
  const winner = (score: (p: Person) => number): Person | null => {
    const sorted = [...list].sort((a, b) => score(b) - score(a));
    return sorted[0] && score(sorted[0]) > 0 ? sorted[0] : null;
  };
  const mostLoved = winner((p) => p.nominations);
  const mostTrusted = winner((p) => p.scores[6] + p.scores[9]);
  const naturalLeader = winner((p) => p.scores[3] + p.scores[8]);
  const creativeSpark = winner((p) => p.scores[4] + p.scores[7]);
  const bestSupporter = winner((p) => p.scores[2]);
  const peacekeeper = winner((p) => p.scores[9]);
  const mvp = winner((p) => p.wins * 2 + p.nominations);
  const hiddenHero = [...list]
    .filter((p) => p.nominations >= 2 && p.wins <= 1)
    .sort((a, b) => b.nominations - a.nominations)[0] ?? null;
  return [
    { title: "Most Loved", winner: mostLoved?.name ?? null, subtitle: mostLoved ? `${mostLoved.nominations} nominations` : "TBD", color: "oklch(0.72 0.17 350)", emoji: "❤️" },
    { title: "Most Trusted", winner: mostTrusted?.name ?? null, subtitle: "the one you'd call first", color: "oklch(0.7 0.16 200)", emoji: "🛡️" },
    { title: "Natural Leader", winner: naturalLeader?.name ?? null, subtitle: "front of the room", color: "oklch(0.62 0.22 20)", emoji: "👑" },
    { title: "Creative Spark", winner: creativeSpark?.name ?? null, subtitle: "the idea machine", color: "oklch(0.65 0.18 305)", emoji: "✨" },
    { title: "Best Supporter", winner: bestSupporter?.name ?? null, subtitle: "the emotional glue", color: "oklch(0.72 0.17 350)", emoji: "🤝" },
    { title: "Peacekeeper", winner: peacekeeper?.name ?? null, subtitle: "the calm in the room", color: "oklch(0.72 0.15 145)", emoji: "🕊️" },
    { title: "Hidden Hero", winner: hiddenHero?.name ?? null, subtitle: hiddenHero ? `${hiddenHero.nominations} noms, quietly loved` : "TBD", color: "oklch(0.78 0.17 85)", emoji: "🌟" },
    { title: "Group MVP", winner: mvp?.name ?? null, subtitle: mvp ? `${mvp.wins} wins · ${mvp.nominations} noms` : "TBD", color: "oklch(0.8 0.18 65)", emoji: "🏆" },
  ];
}

// ============ Movie Cast ============
export interface MovieCast {
  theme: string;
  tagline: string;
  logline: string;
  roles: { name: string; role: string; note: string }[];
}

const CAST_ARCHETYPES = [
  "the heart",
  "the strategist",
  "the wildcard",
  "the mentor",
  "the loyal sidekick",
  "the creative spark",
  "the reluctant hero",
  "the peacemaker",
  "the mastermind",
  "the comic relief",
  "the protector",
  "the visionary",
];

export function movieCast(people: Person[], theme: string): MovieCast {
  const t = theme.trim() || "A group of friends who accidentally save the world";
  const roles = people.map((p, i) => {
    const { leading } = leadingTypes(p.scores);
    const archetype = leading ? ENNEAGRAM[leading].role.toLowerCase() : CAST_ARCHETYPES[i % CAST_ARCHETYPES.length];
    const note = leading
      ? `Cast as ${archetype} — the one who brings ${ENNEAGRAM[leading].keywords[0].toLowerCase()}.`
      : `Cast as ${archetype} — the wildcard nobody saw coming.`;
    return { name: p.name, role: archetype, note };
  });
  const tagline = `${t}. Nine personalities. One night. No script.`;
  const logline = people.length > 0
    ? `Starring ${names(roles.slice(0, 3).map((r) => r.name))} and the entire ensemble — the story of a group that could only exist tonight.`
    : `The cast is still assembling.`;
  return { theme: t, tagline, logline, roles };
}
