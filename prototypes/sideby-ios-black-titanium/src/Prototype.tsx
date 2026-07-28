import { useEffect, useState } from "react";
import {
  BarChartIcon,
  ChevronRightIcon,
  ClockIcon,
  FileTextIcon,
  LoopIcon,
  Pencil2Icon,
} from "@radix-ui/react-icons";
import { BottomSheet, KeyboardInput, MobileScroll, useKeyboard } from "./mobile";

type Tab = "compare" | "history" | "sources";
type Editor = "optionA" | "optionB" | "brief" | null;

const sourceRows = [
  ["react.dev", "Rendering, server components, and ecosystem guidance"],
  ["vuejs.org", "Reactivity, composition API, and performance notes"],
  ["npmjs.com", "Package activity and ecosystem signals"],
] as const;

// Build app-specific screens and flows in this file. The surrounding mobile
// runtime is template-owned and intentionally lives outside this component.
export default function Prototype() {
  const keyboard = useKeyboard();
  const [tab, setTab] = useState<Tab>("compare");
  const [editor, setEditor] = useState<Editor>(null);
  const [optionA, setOptionA] = useState("React");
  const [optionB, setOptionB] = useState("Vue");
  const [useCase, setUseCase] = useState("SaaS dashboard");
  const [team, setTeam] = useState("Small product team");
  const [researching, setResearching] = useState(false);
  const [progress, setProgress] = useState(5);

  useEffect(() => {
    if (!researching || progress >= 8) return;
    const timer = window.setTimeout(() => setProgress((current) => Math.min(8, current + 1)), 1100);
    return () => window.clearTimeout(timer);
  }, [progress, researching]);

  const changeTab = (next: Tab) => {
    keyboard.hide();
    setEditor(null);
    setTab(next);
  };

  const swapOptions = () => {
    setOptionA(optionB);
    setOptionB(optionA);
  };

  const startResearch = () => {
    keyboard.hide();
    setProgress(1);
    setResearching(true);
  };

  const compareContent = (
    <main className="compare-content" aria-label="New comparison">
      <section className="comparison-stage" aria-label="Comparison options">
        <button className="option-zone option-a" type="button" onClick={() => setEditor("optionA")}>
          <span className="option-rule" aria-hidden="true" />
          <span className="option-letter">A</span>
          <strong>{optionA}</strong>
          <span className="visually-hidden">Edit option A</span>
        </button>

        <div className="stage-divider" aria-hidden="true" />
        <button className="swap-button" type="button" onClick={swapOptions} aria-label="Swap comparison options">
          <LoopIcon />
        </button>

        <button className="option-zone option-b" type="button" onClick={() => setEditor("optionB")}>
          <span className="option-rule" aria-hidden="true" />
          <span className="option-letter">B</span>
          <strong>{optionB}</strong>
          <span className="visually-hidden">Edit option B</span>
        </button>
      </section>

      <section className="brief-strip">
        <p>{useCase} <span aria-hidden="true">·</span> {team}</p>
        <button type="button" onClick={() => setEditor("brief")}><Pencil2Icon /> Edit brief</button>
      </section>

      <button className="research-button" type="button" onClick={startResearch}>
        <span>{researching ? (progress === 8 ? "Research complete" : `Researching · ${progress} of 8`) : "Start sourced research"}</span>
        <ChevronRightIcon />
      </button>

      <section className="continue-section" aria-labelledby="continue-title">
        <div className="section-heading">
          <h2 id="continue-title">Continue</h2>
          <span>{progress} of 8 steps</span>
        </div>
        <button className="continue-row" type="button" onClick={() => { setResearching(true); setProgress((value) => value === 8 ? 1 : value); }}>
          <span>
            <strong>Cursor vs Windsurf</strong>
            <small>{progress === 8 ? "Verdict ready · 18 sources" : "Extracting comparable facts"}</small>
          </span>
          <ChevronRightIcon />
        </button>
        <div className="progress-track" aria-label={`${progress} of 8 research steps complete`}>
          <span style={{ width: `${(progress / 8) * 100}%` }} />
        </div>
      </section>
    </main>
  );

  const historyContent = (
    <main className="secondary-content" aria-label="Comparison history">
      <p className="eyebrow">Decision archive</p>
      <h1>History</h1>
      <p className="page-intro">Every verdict keeps its assumptions, evidence, and source trail.</p>
      {["Cursor vs Windsurf", "Supabase vs Firebase", "React vs Vue"].map((item, index) => (
        <button className="archive-row" type="button" key={item} onClick={() => changeTab("compare")}>
          <span><strong>{item}</strong><small>{index === 0 ? "In progress · 5 of 8" : "Complete · cited verdict"}</small></span>
          <ChevronRightIcon />
        </button>
      ))}
    </main>
  );

  const sourcesContent = (
    <main className="secondary-content" aria-label="Source library">
      <p className="eyebrow">Evidence library</p>
      <h1>Sources</h1>
      <p className="page-intro">Primary documentation and research used across your decisions.</p>
      {sourceRows.map(([name, description]) => (
        <button className="source-row" type="button" key={name}>
          <span><strong>{name}</strong><small>{description}</small></span>
          <ChevronRightIcon />
        </button>
      ))}
    </main>
  );

  return (
    <div className="sideby-app" data-testid="sideby-app">
      <header className="app-header">
        <span className="wordmark">SideBy</span>
        <span className="header-title">{tab === "compare" ? "Compare" : tab === "history" ? "History" : "Sources"}</span>
        <button type="button" onClick={() => changeTab("history")} aria-label="Open comparison history"><ClockIcon /></button>
      </header>

      <MobileScroll className="app-screen sideby-scroll">
        {tab === "compare" ? compareContent : tab === "history" ? historyContent : sourcesContent}
      </MobileScroll>

      <nav className="bottom-dock" aria-label="Primary navigation">
        <button type="button" data-active={tab === "compare"} onClick={() => changeTab("compare")}>
          <BarChartIcon /><span>Compare</span>
        </button>
        <button type="button" data-active={tab === "history"} onClick={() => changeTab("history")}>
          <ClockIcon /><span>History</span>
        </button>
        <button type="button" data-active={tab === "sources"} onClick={() => changeTab("sources")}>
          <FileTextIcon /><span>Sources</span>
        </button>
      </nav>

      <BottomSheet
        open={editor !== null}
        onOpenChange={(open) => { if (!open) setEditor(null); }}
        title={editor === "brief" ? "Decision brief" : `Edit option ${editor === "optionA" ? "A" : "B"}`}
        description={editor === "brief" ? "Context changes how SideBy weighs the evidence." : "Use a clear product, service, or approach."}
        snap={0.47}
      >
        {editor === "optionA" ? (
          <label className="sheet-field">Option A<KeyboardInput value={optionA} onChange={(event) => setOptionA(event.target.value)} /></label>
        ) : editor === "optionB" ? (
          <label className="sheet-field">Option B<KeyboardInput value={optionB} onChange={(event) => setOptionB(event.target.value)} /></label>
        ) : (
          <div className="sheet-fields">
            <label className="sheet-field">Use case<KeyboardInput value={useCase} onChange={(event) => setUseCase(event.target.value)} /></label>
            <label className="sheet-field">Team context<KeyboardInput value={team} onChange={(event) => setTeam(event.target.value)} /></label>
          </div>
        )}
        <button className="sheet-save" type="button" onClick={() => { keyboard.hide(); setEditor(null); }}>Save changes</button>
      </BottomSheet>
    </div>
  );
}
