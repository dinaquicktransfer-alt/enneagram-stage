import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ENNEAGRAM,
  SAMPLE_PACKAGE,
  validateQuestions,
  type EnneagramType,
  type NomineeColor,
} from "@/lib/enneagram";
import {
  buildExportBundle,
  bundleToCSV,
  bundleToJSON,
  bundleToMarkdown,
  bundleToScript,
  importBundle,
  personLeadingTypes,
  useEvent,
} from "@/lib/event-store";
import {
  BUNDLE_GROUPS,
  buildSourceZip,
  downloadBlob,
  listBundleFiles,
} from "@/lib/source-bundle";

export const Route = createFileRoute("/host")({
  head: () => ({
    meta: [
      { title: "Host Panel · Enneagram Event" },
      {
        name: "description",
        content: "Host control panel for the Enneagram live event platform.",
      },
      { property: "og:title", content: "Host Panel · Enneagram Event" },
      {
        property: "og:description",
        content: "Host control panel for the Enneagram live event platform.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: HostPanel,
});

function HostPanel() {
  const state = useEvent();
  const q = state.questions[state.currentIndex];

  return (
    <div className="min-h-screen bg-[oklch(0.98_0_0)] text-[oklch(0.2_0.04_275)]">
      <header className="sticky top-0 z-10 border-b border-black/5 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[oklch(0.14_0.04_275)] text-sm font-black text-white">
              E
            </div>
            <div>
              <div className="text-sm font-bold">Enneagram Host Panel</div>
              <div className="text-xs text-black/50">
                Screen:{" "}
                <span className="font-semibold text-black/80">{state.screen}</span>{" "}
                · Questions loaded:{" "}
                <span className="font-semibold text-black/80">
                  {state.questions.length}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/presentation"
              target="_blank"
              className="rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-semibold shadow-sm hover:bg-black/5"
            >
              Open Presentation ↗
            </Link>
            <button
              onClick={() => {
                if (confirm("Reset entire event? All scores and people are erased.")) {
                  useEvent.getState().reset();
                }
              }}
              className="rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-red-600 shadow-sm hover:bg-red-50"
            >
              Reset event
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <QuestionPackagePanel />
          <EventControlPanel />
          <div className="grid gap-6 md:grid-cols-2">
            <CurrentQuestionPanel />
            <NomineePanel />
          </div>
          <WinnerPanel />
        </div>
        <div className="space-y-6">
          <ProgressPanel />
          <ResultsControlPanel />
          <ExportPanel />
          <DebugPanel />
        </div>
      </main>
    </div>
  );
}

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-widest text-black/60">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function QuestionPackagePanel() {
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const loaded = useEvent((s) => s.questions.length);

  const load = (raw: string) => {
    try {
      const parsed = JSON.parse(raw);
      const result = validateQuestions(parsed);
      if (!result.ok || !result.data) {
        setMsg({ ok: false, text: result.error ?? "Invalid package" });
        return;
      }
      useEvent.getState().loadQuestions(result.data);
      setMsg({ ok: true, text: `Loaded ${result.data.length} questions` });
    } catch (e) {
      setMsg({ ok: false, text: `JSON parse error: ${(e as Error).message}` });
    }
  };

  return (
    <Panel
      title="Question Package"
      action={
        <span className="text-xs font-semibold text-black/50">
          {loaded} loaded
        </span>
      }
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={7}
        placeholder='[{"question":"Who would make the best principal?","primaryType":3,"secondaryType":8,"trait":"Leadership","winnerPoints":3,"secondaryPoints":2,"nomineePoints":1}]'
        className="w-full rounded-xl border border-black/10 bg-[oklch(0.98_0_0)] p-3 font-mono text-xs outline-none focus:border-black/30"
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={() => load(text)}
          className="rounded-lg bg-[oklch(0.14_0.04_275)] px-4 py-2 text-sm font-bold text-white hover:opacity-90"
        >
          Load package
        </button>
        <label className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold hover:bg-black/5 cursor-pointer">
          Load JSON file
          <input
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const t = await f.text();
              setText(t);
              load(t);
              e.target.value = "";
            }}
          />
        </label>
        <button
          onClick={() => {
            const s = JSON.stringify(SAMPLE_PACKAGE, null, 2);
            setText(s);
            load(s);
          }}
          className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold hover:bg-black/5"
        >
          Load sample
        </button>
        {msg && (
          <span
            className={`ml-auto text-xs font-semibold ${
              msg.ok ? "text-green-600" : "text-red-600"
            }`}
          >
            {msg.text}
          </span>
        )}
      </div>
    </Panel>
  );
}

function EventControlPanel() {
  const {
    startEvent,
    showQuestion,
    showNominees,
    showWinner,
    nextQuestion,
    showResults,
    showChemistry,
    showSummary,
  } = useEvent.getState();
  const hasQuestions = useEvent((s) => s.questions.length > 0);
  const hasWinner = useEvent((s) => s.winnerColor !== null);
  const hasNominees = useEvent((s) => {
    const n = s.nominees;
    return !!(n.red || n.blue || n.green);
  });
  const canNext = useEvent((s) => s.currentIndex < s.questions.length - 1);

  const btn =
    "rounded-xl px-4 py-3 text-sm font-bold text-white shadow-sm transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <Panel title="Event Control">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <button
          onClick={startEvent}
          className={`${btn} bg-gradient-to-br from-[oklch(0.55_0.2_290)] to-[oklch(0.65_0.22_320)]`}
        >
          Start Event
        </button>
        <button
          onClick={showQuestion}
          disabled={!hasQuestions}
          className={`${btn} bg-gradient-to-br from-[oklch(0.55_0.2_240)] to-[oklch(0.65_0.2_210)]`}
        >
          Show Question
        </button>
        <button
          onClick={showNominees}
          disabled={!hasNominees}
          className={`${btn} bg-gradient-to-br from-[oklch(0.55_0.2_150)] to-[oklch(0.65_0.2_170)]`}
        >
          Show Nominees
        </button>
        <button
          onClick={showWinner}
          disabled={!hasWinner}
          className={`${btn} bg-gradient-to-br from-[oklch(0.65_0.2_60)] to-[oklch(0.6_0.22_30)]`}
        >
          Show Winner
        </button>
        <button
          onClick={nextQuestion}
          disabled={!canNext}
          className={`${btn} bg-gradient-to-br from-[oklch(0.5_0.15_275)] to-[oklch(0.55_0.15_250)]`}
        >
          Next Question
        </button>
        <button
          onClick={showResults}
          className={`${btn} bg-gradient-to-br from-[oklch(0.6_0.22_310)] to-[oklch(0.6_0.22_350)]`}
        >
          Generate Results
        </button>
        <button
          onClick={showChemistry}
          className={`${btn} bg-gradient-to-br from-[oklch(0.55_0.2_200)] to-[oklch(0.6_0.2_170)]`}
        >
          Show Chemistry
        </button>
        <button
          onClick={showSummary}
          className={`${btn} bg-gradient-to-br from-[oklch(0.45_0.1_275)] to-[oklch(0.35_0.05_275)]`}
        >
          Event Summary
        </button>
      </div>
    </Panel>
  );
}

function ProgressPanel() {
  const { currentIndex, questions } = useEvent();
  const pct = questions.length
    ? ((currentIndex + 1) / questions.length) * 100
    : 0;
  return (
    <Panel title="Question Progress">
      <div className="text-4xl font-black">
        {questions.length
          ? `${currentIndex + 1} of ${questions.length}`
          : "0 of 0"}
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[oklch(0.65_0.22_320)] to-[oklch(0.75_0.2_60)] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </Panel>
  );
}

function CurrentQuestionPanel() {
  const q = useEvent((s) => s.questions[s.currentIndex]);
  return (
    <Panel title="Current Question">
      {q ? (
        <div>
          <div className="text-xl font-black leading-tight">{q.question}</div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {q.trait && (
              <span className="rounded-full bg-black/5 px-2 py-1 font-semibold">
                {q.trait}
              </span>
            )}
            <span className="rounded-full bg-black/5 px-2 py-1 font-semibold">
              Primary: Type {q.primaryType} · {ENNEAGRAM[q.primaryType].name}
            </span>
            <span className="rounded-full bg-black/5 px-2 py-1 font-semibold">
              Secondary: Type {q.secondaryType} · {ENNEAGRAM[q.secondaryType].name}
            </span>
            <span className="rounded-full bg-black/5 px-2 py-1 font-semibold">
              +{q.winnerPoints}/{q.secondaryPoints}/{q.nomineePoints}
            </span>
          </div>
        </div>
      ) : (
        <div className="text-sm text-black/50">
          Load a question package to begin.
        </div>
      )}
    </Panel>
  );
}

function NomineePanel() {
  const nominees = useEvent((s) => s.nominees);
  const set = useEvent.getState().setNominee;
  const showNominees = useEvent.getState().showNominees;
  const colors: { key: NomineeColor; label: string; bg: string }[] = [
    { key: "red", label: "Red Nominee", bg: "oklch(0.65 0.24 25)" },
    { key: "blue", label: "Blue Nominee", bg: "oklch(0.62 0.2 250)" },
    { key: "green", label: "Green Nominee", bg: "oklch(0.7 0.19 150)" },
  ];
  return (
    <Panel title="Nominees">
      <div className="space-y-3">
        {colors.map((c) => (
          <label key={c.key} className="block">
            <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: c.bg }}
              />
              {c.label}
            </div>
            <input
              value={nominees[c.key]}
              onChange={(e) => set(c.key, e.target.value)}
              placeholder="Name"
              className="w-full rounded-lg border border-black/10 bg-[oklch(0.98_0_0)] px-3 py-2 outline-none focus:border-black/30"
            />
          </label>
        ))}
        <button
          onClick={showNominees}
          className="w-full rounded-xl bg-[oklch(0.14_0.04_275)] px-4 py-2.5 text-sm font-bold text-white hover:opacity-90"
        >
          Show Nominees on Screen
        </button>
      </div>
    </Panel>
  );
}

function WinnerPanel() {
  const { winnerColor, nominees } = useEvent();
  const setWinner = useEvent.getState().setWinner;
  const showWinner = useEvent.getState().showWinner;
  const colors: { key: NomineeColor; bg: string; label: string }[] = [
    { key: "red", bg: "oklch(0.65 0.24 25)", label: "Red Winner" },
    { key: "blue", bg: "oklch(0.62 0.2 250)", label: "Blue Winner" },
    { key: "green", bg: "oklch(0.7 0.19 150)", label: "Green Winner" },
  ];
  return (
    <Panel title="Winner">
      <div className="grid gap-3 md:grid-cols-3">
        {colors.map((c) => {
          const isActive = winnerColor === c.key;
          return (
            <button
              key={c.key}
              onClick={() => setWinner(c.key)}
              className={`rounded-xl p-4 text-left text-white shadow-sm transition-all ${
                isActive ? "scale-[1.02] ring-4 ring-black/20" : "opacity-90 hover:opacity-100"
              }`}
              style={{ background: `linear-gradient(160deg, ${c.bg}, oklch(from ${c.bg} calc(l - 0.15) c h))` }}
            >
              <div className="text-xs font-bold uppercase tracking-widest opacity-80">
                {c.label}
              </div>
              <div className="mt-1 text-lg font-black">
                {nominees[c.key] || "—"}
              </div>
            </button>
          );
        })}
      </div>
      <button
        onClick={showWinner}
        disabled={!winnerColor}
        className="mt-4 w-full rounded-xl bg-gradient-to-br from-[oklch(0.65_0.2_60)] to-[oklch(0.6_0.22_30)] px-4 py-2.5 text-sm font-bold text-white shadow-sm disabled:opacity-40"
      >
        Show Winner on Screen 🎉
      </button>
    </Panel>
  );
}

function ResultsControlPanel() {
  const people = useEvent((s) => s.people);
  const selectedType = useEvent((s) => s.selectedType);
  const selectType = useEvent.getState().selectType;
  const dist = useMemo(() => {
    const d: Record<EnneagramType, number> = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0,
    };
    Object.values(people).forEach((p) => {
      const { leading } = personLeadingTypes(p);
      if (leading) d[leading] += 1;
    });
    return d;
  }, [people]);
  return (
    <Panel title="Show Type on Screen">
      <div className="grid grid-cols-3 gap-2">
        {([1, 2, 3, 4, 5, 6, 7, 8, 9] as EnneagramType[]).map((t) => {
          const active = selectedType === t;
          return (
            <button
              key={t}
              onClick={() => selectType(t)}
              className={`flex flex-col items-center rounded-xl p-3 text-white shadow-sm transition-transform hover:scale-[1.03] ${
                active ? "ring-4 ring-black/25" : ""
              }`}
              style={{ backgroundColor: ENNEAGRAM[t].color }}
            >
              <span className="text-lg font-black">{t}</span>
              <span className="text-[10px] font-semibold uppercase tracking-widest opacity-90">
                {ENNEAGRAM[t].name.replace("The ", "")}
              </span>
              <span className="mt-1 text-xs font-bold">{dist[t]}</span>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

function DebugPanel() {
  const people = useEvent((s) => s.people);
  const list = Object.values(people).sort((a, b) => b.wins - a.wins || b.nominations - a.nominations);
  return (
    <Panel title="Host Debug — People">
      {list.length === 0 ? (
        <div className="text-sm text-black/50">No people yet.</div>
      ) : (
        <div className="max-h-96 overflow-auto">
          <table className="w-full text-xs">
            <thead className="text-black/50">
              <tr>
                <th className="text-left font-semibold uppercase tracking-widest">Name</th>
                <th className="font-semibold uppercase tracking-widest">Wins</th>
                <th className="font-semibold uppercase tracking-widest">Noms</th>
                <th className="font-semibold uppercase tracking-widest">Leading</th>
                <th className="font-semibold uppercase tracking-widest">Second</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => {
                const { leading, second } = personLeadingTypes(p);
                return (
                  <tr key={p.id} className="border-t border-black/5">
                    <td className="py-1.5 text-left font-semibold">{p.name}</td>
                    <td className="text-center">{p.wins}</td>
                    <td className="text-center">{p.nominations}</td>
                    <td className="text-center">
                      {leading ? (
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-bold text-white"
                          style={{ backgroundColor: ENNEAGRAM[leading].color }}
                        >
                          {leading} · {ENNEAGRAM[leading].name.replace("The ", "")}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="text-center">
                      {second ? (
                        <span className="text-black/60">
                          {second} · {ENNEAGRAM[second].name.replace("The ", "")}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

function ExportPanel() {
  const [format, setFormat] = useState<"json" | "script" | "markdown" | "csv">("json");
  const [copied, setCopied] = useState(false);
  const state = useEvent();

  const output = useMemo(() => {
    const b = buildExportBundle();
    if (format === "json") return bundleToJSON(b);
    if (format === "script") return bundleToScript(b);
    if (format === "markdown") return bundleToMarkdown(b);
    return bundleToCSV(b);
  }, [format, state.updatedAt]);

  const ext = format === "markdown" ? "md" : format === "script" ? "js" : format;
  const mime =
    format === "json"
      ? "application/json"
      : format === "csv"
      ? "text/csv"
      : format === "script"
      ? "application/javascript"
      : "text/markdown";

  const download = () => {
    const blob = new Blob([output], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `enneagram-event.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };

  const tabs: { key: typeof format; label: string }[] = [
    { key: "json", label: "JSON" },
    { key: "script", label: "Script (.js)" },
    { key: "markdown", label: "Markdown" },
    { key: "csv", label: "CSV" },
  ];

  return (
    <Panel
      title="Export Event"
      action={<span className="text-xs font-semibold text-black/50">portable</span>}
    >
      <div className="flex flex-wrap gap-1 rounded-lg bg-black/5 p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFormat(t.key)}
            className={`flex-1 rounded-md px-2 py-1.5 text-xs font-bold transition ${
              format === t.key
                ? "bg-white shadow-sm"
                : "text-black/60 hover:text-black"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <textarea
        readOnly
        value={output}
        rows={7}
        className="mt-3 w-full rounded-xl border border-black/10 bg-[oklch(0.98_0_0)] p-3 font-mono text-[10px] leading-relaxed outline-none"
      />
      <div className="mt-3 flex gap-2">
        <button
          onClick={copy}
          className="flex-1 rounded-lg bg-[oklch(0.14_0.04_275)] px-3 py-2 text-xs font-bold text-white hover:opacity-90"
        >
          {copied ? "Copied ✓" : "Copy to clipboard"}
        </button>
        <button
          onClick={download}
          className="flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-bold shadow-sm hover:bg-black/5"
        >
          Download .{ext}
        </button>
      </div>
    </Panel>
  );
}
