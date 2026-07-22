import { create } from "zustand";
import {
  ENNEAGRAM,
  leadingTypes,
  makePerson,
  type EnneagramType,
  type NomineeColor,
  type Person,
  type QuestionItem,
} from "./enneagram";

export type Screen =
  | "welcome"
  | "question"
  | "nominees"
  | "winner"
  | "results"
  | "type-detail"
  | "chemistry"
  | "summary";

export interface Nominees {
  red: string;
  blue: string;
  green: string;
}

export interface EventState {
  screen: Screen;
  questions: QuestionItem[];
  currentIndex: number;
  nominees: Nominees;
  winnerColor: NomineeColor | null;
  people: Record<string, Person>;
  selectedType: EnneagramType | null;
  updatedAt: number;
}

const initial: EventState = {
  screen: "welcome",
  questions: [],
  currentIndex: 0,
  nominees: { red: "", blue: "", green: "" },
  winnerColor: null,
  people: {},
  selectedType: null,
  updatedAt: Date.now(),
};

const STORAGE_KEY = "enneagram-event-state-v1";
const CHANNEL = "enneagram-event-channel-v1";

function loadInitial(): EventState {
  if (typeof window === "undefined") return initial;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initial;
    return { ...initial, ...JSON.parse(raw) };
  } catch {
    return initial;
  }
}

let bc: BroadcastChannel | null = null;
let suppressBroadcast = false;

interface Actions {
  set: (patch: Partial<EventState>) => void;
  loadQuestions: (qs: QuestionItem[]) => void;
  reset: () => void;
  startEvent: () => void;
  showQuestion: () => void;
  setNominee: (color: NomineeColor, name: string) => void;
  showNominees: () => void;
  setWinner: (color: NomineeColor) => void;
  showWinner: () => void;
  nextQuestion: () => void;
  showResults: () => void;
  selectType: (t: EnneagramType) => void;
  showChemistry: () => void;
  showSummary: () => void;
  _hydrateFromRemote: (s: EventState) => void;
}

export const useEvent = create<EventState & Actions>((set, get) => {
  const commit = (patch: Partial<EventState>) => {
    const next = { ...get(), ...patch, updatedAt: Date.now() };
    set(next);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stripActions(next)));
      } catch {
        /* noop */
      }
      if (!suppressBroadcast && bc) {
        bc.postMessage(stripActions(next));
      }
    }
  };

  return {
    ...loadInitial(),
    set: commit,
    _hydrateFromRemote: (s) => {
      suppressBroadcast = true;
      set({ ...s });
      suppressBroadcast = false;
    },
    loadQuestions: (qs) =>
      commit({
        questions: qs,
        currentIndex: 0,
        screen: "welcome",
        nominees: { red: "", blue: "", green: "" },
        winnerColor: null,
        people: {},
        selectedType: null,
      }),
    reset: () => commit({ ...initial, updatedAt: Date.now() }),
    startEvent: () => commit({ screen: "welcome" }),
    showQuestion: () => commit({ screen: "question" }),
    setNominee: (color, name) =>
      commit({ nominees: { ...get().nominees, [color]: name } }),
    showNominees: () => {
      // register/increment nominations
      const { nominees, people } = get();
      const next = { ...people };
      (["red", "blue", "green"] as NomineeColor[]).forEach((c) => {
        const n = nominees[c].trim();
        if (!n) return;
        const id = n.toLowerCase();
        if (!next[id]) next[id] = makePerson(n);
        next[id] = { ...next[id], nominations: next[id].nominations + 1 };
      });
      commit({ people: next, screen: "nominees", winnerColor: null });
    },
    setWinner: (color) => commit({ winnerColor: color }),
    showWinner: () => {
      const { winnerColor, nominees, people, questions, currentIndex } = get();
      if (!winnerColor) return;
      const q = questions[currentIndex];
      if (!q) return;
      const next = { ...people };
      (["red", "blue", "green"] as NomineeColor[]).forEach((c) => {
        const n = nominees[c].trim();
        if (!n) return;
        const id = n.toLowerCase();
        if (!next[id]) next[id] = makePerson(n);
        const p = { ...next[id], scores: { ...next[id].scores } };
        if (c === winnerColor) {
          p.wins += 1;
          p.scores[q.primaryType] += q.winnerPoints;
          p.scores[q.secondaryType] += q.secondaryPoints;
        } else {
          p.scores[q.primaryType] += q.nomineePoints;
          p.scores[q.secondaryType] += q.nomineePoints;
        }
        next[id] = p;
      });
      commit({ people: next, screen: "winner" });
    },
    nextQuestion: () => {
      const { currentIndex, questions } = get();
      const ni = Math.min(currentIndex + 1, questions.length - 1);
      commit({
        currentIndex: ni,
        nominees: { red: "", blue: "", green: "" },
        winnerColor: null,
        screen: "question",
      });
    },
    showResults: () => commit({ screen: "results", selectedType: null }),
    selectType: (t) => commit({ selectedType: t, screen: "type-detail" }),
    showChemistry: () => commit({ screen: "chemistry" }),
    showSummary: () => commit({ screen: "summary" }),
  };
});

function stripActions(s: EventState & Partial<Actions>): EventState {
  const {
    screen,
    questions,
    currentIndex,
    nominees,
    winnerColor,
    people,
    selectedType,
    updatedAt,
  } = s;
  return {
    screen,
    questions,
    currentIndex,
    nominees,
    winnerColor,
    people,
    selectedType,
    updatedAt,
  };
}

// Cross-tab sync setup
if (typeof window !== "undefined") {
  try {
    bc = new BroadcastChannel(CHANNEL);
    bc.onmessage = (ev) => {
      const s = ev.data as EventState;
      if (!s || typeof s.updatedAt !== "number") return;
      if (s.updatedAt <= useEvent.getState().updatedAt) return;
      useEvent.getState()._hydrateFromRemote(s);
    };
  } catch {
    // ignore
  }
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY || !e.newValue) return;
    try {
      const s = JSON.parse(e.newValue) as EventState;
      if (s.updatedAt <= useEvent.getState().updatedAt) return;
      useEvent.getState()._hydrateFromRemote(s);
    } catch {
      /* noop */
    }
  });
}

// Derived helpers
export function personLeadingTypes(p: Person) {
  return leadingTypes(p.scores);
}

export interface ChemistryReport {
  vibe: string;
  strengths: string[];
  opportunities: string[];
  notable: { name: string; note: string }[];
  distribution: Record<EnneagramType, number>;
  presence: {
    leadership: number;
    support: number;
    creativity: number;
    harmony: number;
  };
}

export function computeDistribution(people: Person[]): Record<EnneagramType, number> {
  const dist: Record<EnneagramType, number> = {
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0,
  };
  people.forEach((p) => {
    const { leading } = leadingTypes(p.scores);
    if (leading) dist[leading] += 1;
  });
  return dist;
}

export function computeChemistry(people: Person[]): ChemistryReport {
  const dist = computeDistribution(people);
  const total = Math.max(1, people.length);
  const pct = (types: EnneagramType[]) =>
    Math.round((types.reduce((s, t) => s + dist[t], 0) / total) * 100);
  const presence = {
    leadership: pct([3, 8]),
    support: pct([2, 6, 9]),
    creativity: pct([4, 7]),
    harmony: pct([9, 2]),
  };
  const dominant = (Object.entries(dist) as [string, number][])
    .sort((a, b) => b[1] - a[1])
    .filter(([, v]) => v > 0)
    .slice(0, 3)
    .map(([k]) => Number(k) as EnneagramType);

  const strengths = dominant.map(
    (t) => `Strong ${ENNEAGRAM[t].name} energy — ${ENNEAGRAM[t].keywords[0]}`,
  );
  const missing = (Object.entries(dist) as [string, number][])
    .filter(([, v]) => v === 0)
    .map(([k]) => Number(k) as EnneagramType);
  const opportunities = missing.slice(0, 3).map(
    (t) => `Room to grow: ${ENNEAGRAM[t].name} (${ENNEAGRAM[t].keywords[0]})`,
  );

  const sorted = [...people].sort((a, b) => b.wins - a.wins);
  const notable = sorted.slice(0, 3).map((p) => {
    const { leading } = leadingTypes(p.scores);
    return {
      name: p.name,
      note: leading
        ? `${p.wins} wins · ${ENNEAGRAM[leading].name}`
        : `${p.wins} wins`,
    };
  });

  const vibeParts = dominant.map((t) => ENNEAGRAM[t].keywords[0]);
  const vibe =
    vibeParts.length > 0
      ? `${vibeParts.join(" · ")}`
      : "A group still finding its voice";

  return { vibe, strengths, opportunities, notable, distribution: dist, presence };
}
