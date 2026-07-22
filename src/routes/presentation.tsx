import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef } from "react";
import confetti from "canvas-confetti";
import {
  ENNEAGRAM,
  NOMINEE_COLORS,
  type EnneagramType,
  type NomineeColor,
} from "@/lib/enneagram";
import {
  computeChemistry,
  computeDistribution,
  funFacts,
  personLeadingTypes,
  useEvent,
} from "@/lib/event-store";

export const Route = createFileRoute("/presentation")({
  head: () => ({
    meta: [
      { title: "Presentation · Enneagram Event" },
      {
        name: "description",
        content: "Live audience screen for the Enneagram game show.",
      },
      { property: "og:title", content: "Presentation · Enneagram Event" },
      {
        property: "og:description",
        content: "Live audience screen for the Enneagram game show.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Presentation,
});

function Presentation() {
  const screen = useEvent((s) => s.screen);
  return (
    <div className="relative min-h-screen overflow-hidden bg-[oklch(0.1_0.04_275)] text-white">
      <BackgroundFX />
      <div className="relative flex min-h-screen items-center justify-center p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.04, y: -20 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full"
          >
            {screen === "welcome" && <Welcome />}
            {screen === "question" && <QuestionScreen />}
            {screen === "nominees" && <NomineesScreen />}
            {screen === "winner" && <WinnerScreen />}
            {screen === "results" && <ResultsScreen />}
            {screen === "type-detail" && <TypeDetailScreen />}
            {screen === "chemistry" && <ChemistryScreen />}
            {screen === "summary" && <SummaryScreen />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function BackgroundFX() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute -left-40 top-0 h-[600px] w-[600px] rounded-full bg-[oklch(0.7_0.22_320)] opacity-30 blur-[120px]"
        animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-0 top-1/3 h-[700px] w-[700px] rounded-full bg-[oklch(0.75_0.2_60)] opacity-25 blur-[120px]"
        animate={{ x: [0, -80, 0], y: [0, 60, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-40 left-1/4 h-[600px] w-[600px] rounded-full bg-[oklch(0.7_0.2_180)] opacity-25 blur-[120px]"
        animate={{ x: [0, 100, 0], y: [0, -40, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

function Welcome() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 text-center">
      <motion.span
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-full border border-white/20 bg-white/10 px-6 py-2 text-sm font-semibold uppercase tracking-[0.4em] backdrop-blur"
      >
        Welcome to the show
      </motion.span>
      <motion.h1
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="text-7xl font-black leading-[0.9] tracking-tight md:text-9xl"
      >
        <span className="bg-gradient-to-r from-[oklch(0.85_0.2_60)] via-[oklch(0.75_0.24_350)] to-[oklch(0.72_0.22_260)] bg-clip-text text-transparent">
          Enneagram
        </span>
        <br />
        <span className="text-white">Live!</span>
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="max-w-2xl text-2xl text-white/70"
      >
        Nine personalities. One unforgettable night. Let's discover who you
        really are.
      </motion.p>
      <motion.div
        className="mt-6 flex gap-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((t) => (
          <motion.span
            key={t}
            className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-black text-white shadow-lg"
            style={{ backgroundColor: ENNEAGRAM[t as EnneagramType].color }}
            animate={{ y: [0, -8, 0] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: t * 0.1,
              ease: "easeInOut",
            }}
          >
            {t}
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
}

function QuestionScreen() {
  const { questions, currentIndex } = useEvent();
  const q = questions[currentIndex];
  if (!q) return <EmptyState label="Waiting for questions…" />;
  return (
    <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 text-center">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 rounded-full border border-white/20 bg-white/5 px-6 py-2 text-sm font-semibold uppercase tracking-[0.3em] backdrop-blur"
      >
        <span className="h-2 w-2 rounded-full bg-[oklch(0.8_0.2_60)]" />
        Question {currentIndex + 1} of {questions.length}
        {q.trait ? <span className="text-white/50">· {q.trait}</span> : null}
      </motion.div>
      <motion.h1
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="text-balance text-6xl font-black leading-[1.05] tracking-tight md:text-8xl"
      >
        {q.question}
      </motion.h1>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-lg uppercase tracking-[0.3em] text-white/50"
      >
        Who is it?
      </motion.div>
    </div>
  );
}

function NomineeCard({
  color,
  name,
  delay,
  large,
}: {
  color: NomineeColor;
  name: string;
  delay: number;
  large?: boolean;
}) {
  const bg = NOMINEE_COLORS[color];
  return (
    <motion.div
      initial={{ opacity: 0, y: 60, rotate: -4 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`relative flex ${large ? "h-[520px]" : "h-96"} flex-1 flex-col items-center justify-between overflow-hidden rounded-[2.5rem] p-10 shadow-2xl`}
      style={{
        background: `linear-gradient(160deg, ${bg}, oklch(from ${bg} calc(l - 0.15) c h))`,
      }}
    >
      <div className="absolute inset-0 opacity-20 mix-blend-overlay">
        <div className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-white blur-3xl" />
      </div>
      <div className="relative flex items-center gap-2 self-start rounded-full bg-black/25 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.3em] text-white backdrop-blur">
        {color}
      </div>
      <div className="relative text-center">
        <div className={`font-black leading-none text-white drop-shadow-lg ${large ? "text-8xl" : "text-6xl"}`}>
          {name || "—"}
        </div>
      </div>
      <div className="relative h-1.5 w-24 rounded-full bg-white/40" />
    </motion.div>
  );
}

function NomineesScreen() {
  const { nominees } = useEvent();
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center text-5xl font-black tracking-tight md:text-7xl"
      >
        The nominees are…
      </motion.h2>
      <div className="flex flex-col gap-6 md:flex-row">
        <NomineeCard color="red" name={nominees.red} delay={0.15} />
        <NomineeCard color="blue" name={nominees.blue} delay={0.3} />
        <NomineeCard color="green" name={nominees.green} delay={0.45} />
      </div>
    </div>
  );
}

function WinnerScreen() {
  const { winnerColor, nominees, questions, currentIndex } = useEvent();
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    const end = Date.now() + 2500;
    const colors = ["#ff5c8a", "#5ce1e6", "#ffd166", "#a06cd5", "#7ee787"];
    (function frame() {
      confetti({
        particleCount: 6,
        spread: 70,
        startVelocity: 55,
        origin: { x: Math.random(), y: Math.random() * 0.3 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
    return () => {
      fired.current = false;
    };
  }, []);
  if (!winnerColor) return <EmptyState label="Waiting for winner…" />;
  const q = questions[currentIndex];
  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 text-center">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-full border border-white/20 bg-white/10 px-6 py-2 text-sm font-semibold uppercase tracking-[0.4em] backdrop-blur"
      >
        {q?.trait ? `${q.trait} · ` : ""}Winner
      </motion.div>
      <motion.h1
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 14 }}
        className="text-7xl font-black tracking-tight md:text-9xl"
      >
        🎉
      </motion.h1>
      <div className="w-full">
        <NomineeCard
          color={winnerColor}
          name={nominees[winnerColor]}
          delay={0.15}
          large
        />
      </div>
    </div>
  );
}

function ResultsScreen() {
  const { people } = useEvent();
  const list = Object.values(people);
  const dist = useMemo(() => computeDistribution(list), [list]);
  const max = Math.max(1, ...Object.values(dist));
  return (
    <div className="mx-auto flex max-w-6xl flex-col items-center gap-10">
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-full border border-white/20 bg-white/10 px-6 py-2 text-sm font-semibold uppercase tracking-[0.4em] backdrop-blur"
        >
          The Results
        </motion.div>
        <motion.h1
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mt-4 text-6xl font-black tracking-tight md:text-8xl"
        >
          The Enneagram Wheel
        </motion.h1>
      </div>
      <EnneagramWheel distribution={dist} max={max} />
      <div className="grid w-full grid-cols-3 gap-3 md:grid-cols-9">
        {([1, 2, 3, 4, 5, 6, 7, 8, 9] as EnneagramType[]).map((t) => (
          <motion.div
            key={t}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * t }}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur"
          >
            <div
              className="mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm font-black text-white shadow"
              style={{ backgroundColor: ENNEAGRAM[t].color }}
            >
              {t}
            </div>
            <div className="mt-2 text-xs font-semibold uppercase tracking-widest text-white/60">
              {ENNEAGRAM[t].name.replace("The ", "")}
            </div>
            <div className="mt-1 text-3xl font-black">{dist[t]}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function EnneagramWheel({
  distribution,
  max,
}: {
  distribution: Record<EnneagramType, number>;
  max: number;
}) {
  const size = 480;
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = 200;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "conic-gradient(from 270deg, oklch(0.68 0.19 25), oklch(0.72 0.17 350), oklch(0.78 0.17 85), oklch(0.65 0.18 305), oklch(0.62 0.14 240), oklch(0.7 0.16 200), oklch(0.8 0.18 65), oklch(0.62 0.22 20), oklch(0.72 0.15 145), oklch(0.68 0.19 25))",
          filter: "blur(30px)",
          opacity: 0.35,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      />
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={rOuter} fill="oklch(0.14 0.04 275)" stroke="oklch(1 0 0 / 0.1)" />
        {([1, 2, 3, 4, 5, 6, 7, 8, 9] as EnneagramType[]).map((t, i) => {
          const angle = (i / 9) * Math.PI * 2 - Math.PI / 2;
          const x = cx + Math.cos(angle) * rOuter;
          const y = cy + Math.sin(angle) * rOuter;
          return (
            <line
              key={`l-${t}`}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke="oklch(1 0 0 / 0.15)"
              strokeWidth={1}
            />
          );
        })}
        {([1, 2, 3, 4, 5, 6, 7, 8, 9] as EnneagramType[]).map((t, i) => {
          const angle = (i / 9) * Math.PI * 2 - Math.PI / 2;
          const magnitude = distribution[t] / max;
          const r = 60 + magnitude * 130;
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r;
          return (
            <motion.circle
              key={`d-${t}`}
              cx={x}
              cy={y}
              r={12 + magnitude * 20}
              fill={ENNEAGRAM[t].color}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 * i, type: "spring", stiffness: 180, damping: 12 }}
            />
          );
        })}
        {([1, 2, 3, 4, 5, 6, 7, 8, 9] as EnneagramType[]).map((t, i) => {
          const angle = (i / 9) * Math.PI * 2 - Math.PI / 2;
          const x = cx + Math.cos(angle) * (rOuter + 22);
          const y = cy + Math.sin(angle) * (rOuter + 22);
          return (
            <text
              key={`t-${t}`}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={20}
              fontWeight={900}
              fill="white"
            >
              {t}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function TypeDetailScreen() {
  const { selectedType, people } = useEvent();
  if (!selectedType) return <EmptyState label="Select a type…" />;
  const info = ENNEAGRAM[selectedType];
  const members = Object.values(people).filter(
    (p) => personLeadingTypes(p).leading === selectedType,
  );
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10">
      <div className="flex flex-col items-center gap-6 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 14 }}
          className="flex h-32 w-32 items-center justify-center rounded-full text-6xl font-black text-white shadow-2xl"
          style={{ backgroundColor: info.color }}
        >
          {info.type}
        </motion.div>
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-6xl font-black tracking-tight md:text-8xl"
          >
            {info.name}
          </motion.h1>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-2 text-lg uppercase tracking-[0.4em] text-white/60"
          >
            {info.title}
          </motion.div>
        </div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="max-w-3xl text-2xl text-white/80"
        >
          {info.description}
        </motion.p>
      </div>
      <div>
        <div className="mb-4 text-center text-sm font-semibold uppercase tracking-[0.3em] text-white/50">
          {members.length > 0 ? `${members.length} in the group` : "No one yet — keep playing!"}
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          {members.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.05 * i, type: "spring", stiffness: 200, damping: 16 }}
              className="rounded-2xl border border-white/10 bg-white/10 px-6 py-4 text-center backdrop-blur"
              style={{ borderColor: `${info.color}` }}
            >
              <div className="text-2xl font-black">{p.name}</div>
              <div className="text-xs uppercase tracking-widest text-white/60">
                {p.wins} wins · {p.nominations} noms
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChemistryScreen() {
  const { people } = useEvent();
  const list = Object.values(people);
  const report = useMemo(() => computeChemistry(list), [list]);
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10">
      <div className="text-center">
        <div className="rounded-full border border-white/20 bg-white/10 px-6 py-2 text-sm font-semibold uppercase tracking-[0.4em] backdrop-blur inline-block">
          Group Chemistry
        </div>
        <h1 className="mt-4 text-6xl font-black tracking-tight md:text-8xl">
          <span className="bg-gradient-to-r from-[oklch(0.85_0.2_60)] via-[oklch(0.75_0.24_350)] to-[oklch(0.72_0.22_260)] bg-clip-text text-transparent">
            {report.vibe}
          </span>
        </h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mx-auto mt-6 max-w-3xl text-lg text-white/70 md:text-xl"
        >
          {report.narrative}
        </motion.p>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {(
          [
            ["Leadership", report.presence.leadership, "oklch(0.7 0.22 25)"],
            ["Support", report.presence.support, "oklch(0.72 0.17 350)"],
            ["Creativity", report.presence.creativity, "oklch(0.68 0.2 305)"],
            ["Harmony", report.presence.harmony, "oklch(0.72 0.18 150)"],
          ] as const
        ).map(([label, value, color], i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
            className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur"
          >
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
              {label}
            </div>
            <div className="mt-3 text-5xl font-black" style={{ color }}>
              {value}%
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ delay: 0.2 + 0.1 * i, duration: 0.8 }}
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
              />
            </div>
          </motion.div>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <Panel title="Strengths" items={report.strengths} accent="oklch(0.78 0.17 85)" />
        <Panel title="Opportunities" items={report.opportunities} accent="oklch(0.72 0.22 320)" />
        <Panel title="Risk Factors" items={report.risks} accent="oklch(0.7 0.24 25)" />
      </div>
      {report.notable.length > 0 && (
        <div>
          <div className="mb-4 text-center text-sm font-semibold uppercase tracking-[0.3em] text-white/50">
            Notable Group Members
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {report.notable.map((n, i) => (
              <motion.div
                key={n.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * i }}
                className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-center backdrop-blur"
              >
                <div className="text-2xl font-black">{n.name}</div>
                <div className="text-xs uppercase tracking-widest text-white/60">{n.note}</div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Panel({
  title,
  items,
  accent,
}: {
  title: string;
  items: string[];
  accent: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
      <div
        className="text-xs font-semibold uppercase tracking-[0.3em]"
        style={{ color: accent }}
      >
        {title}
      </div>
      <ul className="mt-4 space-y-3">
        {items.length === 0 ? (
          <li className="text-white/50">—</li>
        ) : (
          items.map((s, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i }}
              className="text-xl font-medium"
            >
              {s}
            </motion.li>
          ))
        )}
      </ul>
    </div>
  );
}

function SummaryScreen() {
  const { people } = useEvent();
  const list = Object.values(people);
  const dist = computeDistribution(list);
  const mostNoms = [...list].sort((a, b) => b.nominations - a.nominations)[0];
  const mostWins = [...list].sort((a, b) => b.wins - a.wins)[0];
  const commonEntry = (Object.entries(dist) as [string, number][])
    .sort((a, b) => b[1] - a[1])
    .filter(([, v]) => v > 0)[0];
  const commonType = commonEntry ? (Number(commonEntry[0]) as EnneagramType) : null;

  // Closest competition: two people with close wins
  const sortedByWins = [...list].sort((a, b) => b.wins - a.wins);
  const closest =
    sortedByWins.length >= 2
      ? { a: sortedByWins[0], b: sortedByWins[1] }
      : null;

  // Hidden gem: high nominations but low wins
  const hidden = [...list]
    .filter((p) => p.nominations >= 2)
    .sort((a, b) => b.nominations - a.nominations - (b.wins - a.wins))
    .reverse()[0];

  const report = computeChemistry(list);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <div className="text-center">
        <div className="rounded-full border border-white/20 bg-white/10 px-6 py-2 text-sm font-semibold uppercase tracking-[0.4em] backdrop-blur inline-block">
          The Final Word
        </div>
        <h1 className="mt-4 text-6xl font-black tracking-tight md:text-8xl">
          Event Summary
        </h1>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Most Nominated" value={mostNoms?.name ?? "—"} sub={mostNoms ? `${mostNoms.nominations} noms` : ""} color="oklch(0.72 0.22 320)" />
        <StatCard label="Most Wins" value={mostWins?.name ?? "—"} sub={mostWins ? `${mostWins.wins} wins` : ""} color="oklch(0.78 0.17 85)" />
        <StatCard
          label="Most Common Type"
          value={commonType ? ENNEAGRAM[commonType].name : "—"}
          sub={commonType ? ENNEAGRAM[commonType].title : ""}
          color={commonType ? ENNEAGRAM[commonType].color : "oklch(0.7 0.15 240)"}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
            Closest Competition
          </div>
          <div className="mt-3 text-3xl font-black">
            {closest ? `${closest.a.name} vs ${closest.b.name}` : "—"}
          </div>
          <div className="mt-1 text-white/60">
            {closest ? `${closest.a.wins} – ${closest.b.wins}` : ""}
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
            Hidden Gem
          </div>
          <div className="mt-3 text-3xl font-black">{hidden?.name ?? "—"}</div>
          <div className="mt-1 text-white/60">
            {hidden ? `Nominated ${hidden.nominations}× — the people's favorite` : ""}
          </div>
        </div>
      </div>
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
          Group Personality Summary
        </div>
        <div className="mt-3 text-3xl font-black">{report.vibe}</div>
        <p className="mt-3 text-lg text-white/70">{report.narrative}</p>
      </div>
      {facts.length > 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[oklch(0.8_0.2_60)]">
            Fun Facts
          </div>
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {facts.map((f, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i }}
                className="flex items-start gap-3 text-lg"
              >
                <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-[oklch(0.8_0.2_60)]" />
                <span>{f}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur"
    >
      <div className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color }}>
        {label}
      </div>
      <div className="mt-3 text-4xl font-black">{value}</div>
      {sub ? <div className="mt-1 text-white/60">{sub}</div> : null}
    </motion.div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="text-center text-2xl font-semibold uppercase tracking-[0.3em] text-white/40">
      {label}
    </div>
  );
}
