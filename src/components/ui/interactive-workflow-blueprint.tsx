// Editor di flussi AI interattivo — adattato dal blocco "interactive-workflow-blueprint" (21st.dev).
// Il visitatore vede un flusso di lavoro edile già pronto e può modificarlo: aggiungere passaggi,
// collegarli, spostarli. È una simulazione: nessun servizio reale viene collegato.
// Adattamenti: testi in italiano, palette del sito, niente loghi esterni, CTA verso la consulenza
// al posto dell'esportazione JSON. Va renderizzato solo nel browser (vedi WorkflowSection).

import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from "react";
import {
  ReactFlow,
  Handle,
  Position,
  getBezierPath,
  applyNodeChanges,
  applyEdgeChanges,
  useNodesInitialized,
  useReactFlow,
  type Node,
  type Edge,
  type NodeProps,
  type EdgeProps,
  type Connection,
  type ReactFlowInstance,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

export type WorkflowKind = "trigger" | "agent" | "integration" | "review" | "delivery";
export interface WorkflowAction extends Record<string, unknown> {
  label: string;
  detail: string;
  kind: WorkflowKind;
  tool?: string;
}
export interface WorkflowApp {
  id: string;
  name: string;
  actions: WorkflowAction[];
}
export type WorkflowNode = Node<WorkflowAction, "blueprint">;
export interface WorkflowGraph {
  nodes: WorkflowNode[];
  edges: Edge[];
}
export interface WorkflowBlueprintProps {
  initialGraph: WorkflowGraph;
  apps: WorkflowApp[];
  title?: string;
  className?: string;
  style?: CSSProperties;
  animated?: boolean;
  agentTemplate?: WorkflowAction;
  /** Link del bottone principale (di default il form di contatto). */
  ctaHref?: string;
  ctaLabel?: string;
  onChange?: (graph: WorkflowGraph) => void;
}

const MAX_NODES = 20;
const STEP_X = 240;

const labels: Record<WorkflowKind, string> = {
  trigger: "Avvio",
  agent: "Agente AI",
  integration: "Collegamento",
  review: "Controllo",
  delivery: "Consegna",
};
const glyphs: Record<WorkflowKind, string> = {
  trigger: "M13 3 5 13h5l-1 8 9-12h-5z",
  agent: "M12 3l2.2 5.5L20 10l-5.8 1.5L12 17l-2.2-5.5L4 10l5.8-1.5z",
  integration:
    "M10.5 13.5a3.5 3.5 0 0 0 4.95 0l2.5-2.5a3.5 3.5 0 0 0-4.95-4.95l-1 1 M13.5 10.5a3.5 3.5 0 0 0-4.95 0l-2.5 2.5a3.5 3.5 0 0 0 4.95 4.95l1-1",
  review: "M12 3 4 7v5c0 5 3.4 8.2 8 9 4.6-.8 8-4 8-9V7z M9 12l2 2 4-5",
  delivery: "M5 12h12M13 6l6 6-6 6",
};

function KindGlyph({ kind }: { kind: WorkflowKind }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={glyphs[kind]} />
    </svg>
  );
}

function BlueprintNode({ data, selected }: NodeProps<WorkflowNode>) {
  return (
    <div className="wb-node" data-kind={data.kind} data-selected={selected}>
      <Handle type="target" position={Position.Left} aria-label={`Ingresso di ${data.label}`} />
      <div className="wb-node-head">
        <span className="wb-glyph">
          <KindGlyph kind={data.kind} />
        </span>
        <div>
          <strong>{data.label}</strong>
          <small>{labels[data.kind]}</small>
        </div>
      </div>
      <div className="wb-node-body">
        <p>{data.detail}</p>
        {data.tool && <span>{data.tool}</span>}
      </div>
      <Handle type="source" position={Position.Right} aria-label={`Uscita di ${data.label}`} />
    </div>
  );
}

function BlueprintEdge(props: EdgeProps) {
  const gradient = `wb-${useId().replace(/:/g, "")}`;
  const [path] = getBezierPath(props);
  return (
    <>
      <defs>
        <linearGradient id={gradient}>
          <stop stopColor="var(--wb-primary)" />
          <stop offset="1" stopColor="var(--wb-secondary)" />
        </linearGradient>
      </defs>
      <path d={path} className="wb-edge-halo" />
      <path d={path} className="wb-edge" style={{ stroke: `url(#${gradient})` }} />
      <path d={path} className="wb-edge-pulse" />
      <circle cx={props.sourceX} cy={props.sourceY} r="4" className="wb-port" />
      <circle cx={props.targetX} cy={props.targetY} r="4" className="wb-port" />
    </>
  );
}
const nodeTypes = { blueprint: BlueprintNode };
const edgeTypes = { blueprint: BlueprintEdge };

function InitialViewport({ width }: { width: number }) {
  const ready = useNodesInitialized();
  const flow = useReactFlow();
  const previousWidth = useRef(0);
  useEffect(() => {
    if (!ready || !width || previousWidth.current === width) return;
    // React Flow misura il proprio pannello con un ResizeObserver: aspettiamo due frame
    // prima di adattare la vista, altrimenti usa dimensioni vecchie.
    let nextFrame = 0;
    const frame = requestAnimationFrame(() => {
      nextFrame = requestAnimationFrame(() => {
        previousWidth.current = width;
        if (width < 600) void flow.setViewport({ x: 24, y: 20, zoom: 0.8 });
        else void flow.fitView({ padding: 0.1, maxZoom: 1 });
      });
    });
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(nextFrame);
    };
  }, [ready, width, flow]);
  return null;
}

/** Rifiuta collegamenti doppi, su se stessi e cicli. */
function canConnect(connection: Pick<Connection, "source" | "target">, graph: WorkflowGraph) {
  const { source, target } = connection;
  if (!source || !target || source === target || !graph.nodes.some((n) => n.id === source) || !graph.nodes.some((n) => n.id === target)) return false;
  if (graph.edges.some((e) => e.source === source && e.target === target)) return false;
  const visited = new Set<string>();
  const reachesSource = (id: string): boolean => {
    if (id === source) return true;
    if (visited.has(id)) return false;
    visited.add(id);
    return graph.edges.filter((e) => e.source === id).some((e) => reachesSource(e.target));
  };
  return !reachesSource(target);
}

function normalizeGraph(graph: WorkflowGraph): WorkflowGraph {
  const ids = new Set(graph.nodes.map((n) => n.id));
  const name = (id: string) => graph.nodes.find((n) => n.id === id)?.data.label;
  return {
    nodes: graph.nodes.map((n) => ({
      ...n,
      type: "blueprint",
      ariaLabel: `${n.data.label}. ${labels[n.data.kind]}. ${n.data.detail}`,
      data: { ...n.data },
    })),
    edges: graph.edges
      .filter((e) => ids.has(e.source) && ids.has(e.target))
      .map((e) => ({ ...e, type: "blueprint", ariaLabel: `Collegamento da ${name(e.source)} a ${name(e.target)}` })),
  };
}

export default function WorkflowBlueprint({
  initialGraph,
  apps,
  title = "Il tuo flusso AI",
  className = "",
  style,
  animated = true,
  agentTemplate,
  ctaHref = "#cta-finale",
  ctaLabel = "Progettiamolo insieme",
  onChange,
}: WorkflowBlueprintProps) {
  const [graph, setGraph] = useState(() => normalizeGraph(initialGraph));
  const [selected, setSelected] = useState(initialGraph.nodes[0]?.id ?? "");
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [message, setMessage] = useState("Scegli un'azione dal pannello o trascina un passaggio per iniziare.");
  const [history, setHistory] = useState<WorkflowGraph[]>([]);
  const [flow, setFlow] = useState<ReactFlowInstance<WorkflowNode> | null>(null);
  const [width, setWidth] = useState(0);
  const [motionPaused, setMotionPaused] = useState(false);
  const [editing, setEditing] = useState<{ id: string; label: string; detail: string; tool: string } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<ReactFlowInstance<WorkflowNode> | null>(null);
  const editLabelRef = useRef<HTMLInputElement>(null);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const selectedRef = useRef<HTMLSelectElement>(null);
  const initialRef = useRef(normalizeGraph(initialGraph));
  const sequence = useRef(0);
  const uid = useId().replace(/:/g, "");
  const changed = useRef(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (changed.current) onChangeRef.current?.(graph);
  }, [graph]);
  const editingId = editing?.id;
  useEffect(() => {
    if (editingId) editLabelRef.current?.focus();
  }, [editingId]);
  useEffect(() => {
    const element = canvasRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const label = (id: string) => graph.nodes.find((n) => n.id === id)?.data.label;

  const commit = (next: WorkflowGraph, announcement: string) => {
    setHistory((h) => [...h.slice(-19), graph]);
    changed.current = true;
    setGraph(normalizeGraph(next));
    setMessage(announcement);
  };
  const connect = (connection: Pick<Connection, "source" | "target">) => {
    if (!canConnect(connection, graph)) {
      setMessage("Scegli due passaggi diversi, non già collegati e senza creare un giro chiuso.");
      return;
    }
    commit({ ...graph, edges: [...graph.edges, { id: `${uid}-edge-${++sequence.current}`, ...connection, type: "blueprint" }] }, "Collegamento aggiunto.");
  };
  /** Riadatta la vista con un'animazione morbida dopo che React Flow ha misurato i nodi. */
  const refit = () => {
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        void flow?.fitView({ padding: width < 600 ? 0.08 : 0.12, maxZoom: 1, duration: 550 });
      }),
    );
  };
  const add = (action: WorkflowAction, editNow = false) => {
    if (graph.nodes.length >= MAX_NODES) {
      setMessage(`Il flusso può avere al massimo ${MAX_NODES} passaggi. Rimuovine uno prima di aggiungerne altri.`);
      return;
    }
    const after = graph.nodes.find((n) => n.id === selected);
    const id = `${uid}-node-${++sequence.current}`;
    let nodes = graph.nodes.map((n) => ({ ...n, selected: false }));
    let position: { x: number; y: number };
    if (after) {
      // Il nuovo passaggio va subito a destra di quello selezionato; quelli che vengono dopo
      // scorrono a destra per fargli posto, così il flusso resta ordinato da sinistra a destra.
      position = { x: after.position.x + STEP_X, y: after.position.y };
      nodes = nodes.map((n) =>
        n.id !== after.id && n.position.x > after.position.x + 10 ? { ...n, position: { ...n.position, x: n.position.x + STEP_X } } : n,
      );
    } else {
      const maxX = graph.nodes.reduce((m, n) => Math.max(m, n.position.x), -STEP_X);
      position = { x: maxX + STEP_X, y: 40 };
    }
    const node: WorkflowNode = { id, type: "blueprint", position, data: { ...action }, selected: true };
    const outgoing = graph.edges.filter((e) => e.source === after?.id);
    let edges = graph.edges;
    // Con un solo successore lo manteniamo inserendo il nuovo passaggio in mezzo; i rami non vengono mai ricollegati da soli.
    if (after) {
      if (outgoing.length === 1) edges = edges.map((e) => (e.id === outgoing[0].id ? { ...e, source: id } : e));
      edges = [...edges, { id: `${uid}-edge-${++sequence.current}`, source: after.id, target: id, type: "blueprint" }];
    }
    commit({ nodes: [...nodes, node], edges }, `${action.label} aggiunto${after ? ` dopo ${after.data.label}` : ""}.`);
    setSelected(id);
    setEditing(editNow ? { id, label: action.label, detail: action.detail, tool: action.tool ?? "" } : null);
    refit();
  };
  const remove = () => {
    const node = graph.nodes.find((n) => n.id === selected);
    if (!node) return;
    const incoming = graph.edges.filter((edge) => edge.target === selected);
    const outgoing = graph.edges.filter((edge) => edge.source === selected);
    const remaining = {
      nodes: graph.nodes.filter((n) => n.id !== selected),
      edges: graph.edges.filter((e) => e.source !== selected && e.target !== selected),
    };
    const bridge = incoming.length === 1 && outgoing.length === 1 ? { source: incoming[0].source, target: outgoing[0].target } : null;
    const reconnect = bridge && canConnect(bridge, remaining);
    if (reconnect) {
      remaining.edges.push({ id: `${uid}-edge-${++sequence.current}`, ...bridge, type: "blueprint" });
      // Chiude il buco: i passaggi a destra scorrono indietro di un posto.
      remaining.nodes = remaining.nodes.map((n) =>
        n.position.x > node.position.x + 10 ? { ...n, position: { ...n.position, x: n.position.x - STEP_X } } : n,
      );
    }
    commit(
      remaining,
      reconnect ? `${node.data.label} rimosso. I passaggi vicini restano collegati.` : `${node.data.label} e i suoi collegamenti rimossi.`,
    );
    setSelected("");
    setEditing(null);
    selectedRef.current?.focus({ preventScroll: true });
    refit();
  };
  const onNodesChange = useCallback((changes: NodeChange<WorkflowNode>[]) => {
    changed.current = true;
    setGraph((g) => {
      const viewport = flowRef.current?.getViewport();
      const canvas = canvasRef.current?.getBoundingClientRect();
      const boundedChanges = changes.map((change) => {
        if (change.type !== "position" || !change.position || !viewport || !canvas) return change;
        const node = g.nodes.find((item) => item.id === change.id);
        if (!node) return change;
        const inset = 4;
        const minX = (inset - viewport.x) / viewport.zoom;
        const minY = (inset - viewport.y) / viewport.zoom;
        const maxX = (canvas.width - inset - viewport.x) / viewport.zoom - (node.measured?.width ?? 196);
        const maxY = (canvas.height - inset - viewport.y) / viewport.zoom - (node.measured?.height ?? 166);
        return {
          ...change,
          position: {
            x: Math.max(minX, Math.min(change.position.x, Math.max(minX, maxX))),
            y: Math.max(minY, Math.min(change.position.y, Math.max(minY, maxY))),
          },
        };
      });
      return { ...g, nodes: applyNodeChanges(boundedChanges, g.nodes) };
    });
    const selection = changes.find((c) => c.type === "select" && c.selected);
    if (selection && "id" in selection) setSelected(selection.id);
  }, []);
  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    changed.current = true;
    setGraph((g) => ({ ...g, edges: applyEdgeChanges(changes, g.edges) }));
  }, []);
  const focusNode = (id: string) => {
    setSelected(id);
    setEditing(null);
    setGraph((g) => ({ ...g, nodes: g.nodes.map((n) => ({ ...n, selected: n.id === id })) }));
    const node = graph.nodes.find((n) => n.id === id);
    if (node) void flow?.setCenter(node.position.x + 98, node.position.y + 84, { zoom: 1, duration: 450 });
  };
  const editSelected = () => {
    const node = graph.nodes.find((item) => item.id === selected);
    if (node) setEditing({ id: node.id, label: node.data.label, detail: node.data.detail, tool: node.data.tool ?? "" });
  };
  const saveStep = () => {
    if (!editing || !editing.label.trim()) return;
    const name = editing.label.trim();
    commit(
      {
        ...graph,
        nodes: graph.nodes.map((node) =>
          node.id === editing.id
            ? { ...node, data: { ...node.data, label: name, detail: editing.detail.trim(), tool: editing.tool.trim() || undefined } }
            : node,
        ),
      },
      `${name} aggiornato.`,
    );
    setEditing(null);
    editButtonRef.current?.focus({ preventScroll: true });
  };
  const undo = () => {
    const previous = history[history.length - 1];
    if (!previous) return;
    changed.current = true;
    setGraph(previous);
    setHistory((h) => h.slice(0, -1));
    setSelected("");
    setEditing(null);
    setMessage("Ultima modifica annullata.");
  };
  const hasSelection = graph.nodes.some((n) => n.id === selected);

  return (
    <section className={`wb-root ${className}`} style={style} aria-label={title} data-animated={animated && !motionPaused}>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <header className="wb-header">
        <span className="wb-mark" aria-hidden="true">
          +
        </span>
        <div className="wb-heading">
          <h3>{title}</h3>
          <span>Simulazione interattiva</span>
        </div>
        <div className="wb-header-actions">
          <button
            type="button"
            onClick={() =>
              add(
                {
                  ...agentTemplate,
                  label: agentTemplate?.label ?? "Nuovo agente AI",
                  detail: agentTemplate?.detail ?? "Descrivi cosa deve fare questo agente.",
                  kind: "agent",
                },
                true,
              )
            }
            disabled={graph.nodes.length >= MAX_NODES}
          >
            + Aggiungi agente
          </button>
          <button type="button" onClick={undo} disabled={!history.length}>
            Annulla
          </button>
          <a className="wb-primary wb-cta" href={ctaHref}>
            {ctaLabel} <span aria-hidden="true">→</span>
          </a>
        </div>
      </header>
      <div className="wb-workspace">
        <div className="wb-canvas-column">
          <div className="wb-canvas" ref={canvasRef}>
            <ReactFlow<WorkflowNode>
              nodes={graph.nodes}
              edges={graph.edges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              onInit={(instance) => {
                flowRef.current = instance;
                setFlow(instance);
              }}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={connect}
              isValidConnection={(connection) => canConnect(connection, graph)}
              onNodeClick={(_, node) => {
                setSelected(node.id);
                setEditing(null);
              }}
              nodesFocusable
              edgesFocusable
              disableKeyboardA11y={false}
              minZoom={0.3}
              maxZoom={1.5}
              zoomOnScroll={false}
              zoomOnDoubleClick={false}
              autoPanOnNodeDrag={false}
              preventScrolling={false}
              deleteKeyCode={null}
              snapToGrid
              snapGrid={[10, 10]}
              proOptions={{ hideAttribution: false }}
              aria-label={`${title}: diagramma`}
            >
              <InitialViewport width={width} />
            </ReactFlow>
            {!graph.nodes.length && <p className="wb-empty">Aggiungi un'azione dal pannello per iniziare.</p>}
            <div className="wb-tools" role="group" aria-label="Controlli della vista">
              <button type="button" aria-label="Riduci" onClick={() => void flow?.zoomOut()}>
                −
              </button>
              <button type="button" onClick={() => void flow?.fitView({ padding: 0.15, maxZoom: 1 })}>
                Vedi tutto
              </button>
              <button type="button" aria-label="Ingrandisci" onClick={() => void flow?.zoomIn()}>
                +
              </button>
              {animated && (
                <button type="button" onClick={() => setMotionPaused((p) => !p)} aria-pressed={motionPaused}>
                  {motionPaused ? "Riprendi animazione" : "Ferma animazione"}
                </button>
              )}
            </div>
          </div>
          <div className="wb-status">
            <span>
              <i aria-hidden="true" /> {graph.nodes.length} passaggi · {graph.edges.length} collegamenti
            </span>
            <span>Simulazione · nessun dato reale</span>
          </div>
          <div className="wb-editor">
            <div className="wb-edit-row">
              <label htmlFor={`${uid}-selected`}>Passaggio selezionato</label>
              <select ref={selectedRef} id={`${uid}-selected`} value={hasSelection ? selected : ""} onChange={(e) => focusNode(e.target.value)}>
                <option value="">Nessuno (nuovo passaggio scollegato)</option>
                {graph.nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.data.label}
                  </option>
                ))}
              </select>
              <button ref={editButtonRef} type="button" onClick={editSelected} disabled={!hasSelection}>
                Modifica
              </button>
              <button type="button" onClick={remove} disabled={!hasSelection}>
                Rimuovi
              </button>
            </div>
            {editing && (
              <form
                className="wb-step-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  saveStep();
                }}
              >
                <label>
                  Nome del passaggio
                  <input ref={editLabelRef} required maxLength={60} value={editing.label} onChange={(event) => setEditing({ ...editing, label: event.target.value })} />
                </label>
                <label>
                  Cosa fa
                  <textarea maxLength={160} rows={2} value={editing.detail} onChange={(event) => setEditing({ ...editing, detail: event.target.value })} />
                </label>
                <label>
                  Strumento (facoltativo)
                  <input maxLength={40} value={editing.tool} onChange={(event) => setEditing({ ...editing, tool: event.target.value })} />
                </label>
                <div>
                  <button type="submit" className="wb-primary">
                    Salva
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(null);
                      editButtonRef.current?.focus({ preventScroll: true });
                    }}
                  >
                    Annulla
                  </button>
                </div>
              </form>
            )}
            <form
              className="wb-connect"
              onSubmit={(e) => {
                e.preventDefault();
                connect({ source, target });
              }}
            >
              <label>
                Da
                <select value={source} onChange={(e) => setSource(e.target.value)}>
                  <option value="">Scegli l'origine</option>
                  {graph.nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.data.label}
                    </option>
                  ))}
                </select>
              </label>
              <span aria-hidden="true">→</span>
              <label>
                A
                <select value={target} onChange={(e) => setTarget(e.target.value)}>
                  <option value="">Scegli la destinazione</option>
                  {graph.nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.data.label}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit" disabled={!source || !target}>
                Collega
              </button>
            </form>
            <details className="wb-details">
              <summary>Collegamenti ({graph.edges.length}) e come si usa</summary>
              <p>
                Clicca un passaggio per selezionarlo, poi trascinalo per spostarlo. Puoi collegare due passaggi tirando una linea tra i
                pallini laterali oppure con il modulo qui sopra. Rimuovendo un passaggio con un solo ingresso e una sola uscita, i vicini
                restano collegati. "Annulla" ripristina l'ultima modifica.
              </p>
              {graph.edges.length ? (
                <ul>
                  {graph.edges.map((edge) => (
                    <li key={edge.id}>
                      <span>
                        {label(edge.source)} → {label(edge.target)}
                      </span>
                      <button
                        type="button"
                        aria-label={`Rimuovi il collegamento da ${label(edge.source)} a ${label(edge.target)}`}
                        onClick={() => commit({ ...graph, edges: graph.edges.filter((e) => e.id !== edge.id) }, "Collegamento rimosso.")}
                      >
                        Rimuovi
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Nessun collegamento.</p>
              )}
            </details>
            <p className="wb-message" role="status" aria-live="polite">
              {message}
            </p>
            <button
              type="button"
              className="wb-reset"
              onClick={() => {
                commit(normalizeGraph(initialRef.current), "Flusso iniziale ripristinato. Con \"Annulla\" recuperi le tue modifiche.");
                setSelected(initialRef.current.nodes[0]?.id ?? "");
                setEditing(null);
              }}
            >
              Ripristina il flusso iniziale
            </button>
          </div>
        </div>
        <aside className="wb-stack" aria-label="Azioni disponibili">
          <div className="wb-stack-heading">
            <h4>Azioni disponibili</h4>
            <span aria-hidden="true">▱</span>
          </div>
          <p>Scegli un'azione: viene aggiunta dopo il passaggio selezionato.</p>
          {apps.map((app, index) => (
            <details key={app.id} open={index === 0} className="wb-app">
              <summary>
                <span className="wb-app-mark" aria-hidden="true">
                  {app.name.slice(0, 1)}
                </span>
                <strong>{app.name}</strong>
                <small>{app.actions.length}</small>
              </summary>
              <div className="wb-actions">
                {app.actions.map((action, i) => (
                  <button
                    key={`${app.id}-${i}`}
                    type="button"
                    onClick={() => add({ ...action })}
                    disabled={graph.nodes.length >= MAX_NODES}
                    aria-label={`Aggiungi ${action.label} (${app.name})`}
                  >
                    <span>
                      {action.label}
                      <small>{labels[action.kind]}</small>
                    </span>
                    <b aria-hidden="true">+</b>
                  </button>
                ))}
              </div>
            </details>
          ))}
        </aside>
      </div>
    </section>
  );
}

const styles = String.raw`
.wb-root{--wb-bg:#f6f8f6;--wb-fg:#111827;--wb-card:#ffffff;--wb-muted:#6b7280;--wb-border:#dde3de;--wb-primary:#1A9E60;--wb-on-primary:#ffffff;--wb-secondary:#3BCE78;--wb-accent-2:#3BCE78;--wb-accent-3:#0f766e;width:100%;min-width:0;border:1px solid var(--wb-border);border-radius:20px;overflow:hidden;background:var(--wb-bg);color:var(--wb-fg);font-size:14px;line-height:1.5;font-family:inherit;container-type:inline-size;box-sizing:border-box;text-align:left;isolation:isolate;box-shadow:0 30px 60px -40px rgb(17 24 39 / .35)}
.wb-root *{box-sizing:border-box}.wb-root button,.wb-root select{font:inherit;color:inherit}.wb-root button{cursor:pointer}.wb-root button:disabled{opacity:.45;cursor:not-allowed}.wb-root button,.wb-root select,.wb-root .wb-cta{border:1px solid var(--wb-border);border-radius:10px;background:var(--wb-card);min-height:40px;padding:8px 12px}.wb-root button:hover:enabled{background:color-mix(in srgb,var(--wb-primary) 10%,var(--wb-card))}.wb-root :is(button,select,summary,a):focus-visible{outline:2px solid var(--wb-primary);outline-offset:1px}.wb-root .wb-primary{background:var(--wb-primary);color:var(--wb-on-primary);border-color:var(--wb-primary);font-weight:600}.wb-root .wb-primary:hover{background:var(--wb-primary);filter:brightness(1.08)}.wb-root .wb-cta{display:inline-flex;align-items:center;gap:8px;text-decoration:none}
.wb-header{display:flex;align-items:center;gap:12px;padding:18px 20px;border-bottom:1px solid var(--wb-border);background:var(--wb-card)}.wb-mark{display:grid;place-items:center;width:36px;height:36px;border-radius:10px;background:var(--wb-primary);color:var(--wb-on-primary);font:26px/1 system-ui}.wb-heading{flex:1;min-width:0}.wb-heading h3{font-size:16px;line-height:1.25;font-weight:700;margin:0}.wb-heading>span{font:10px/1.7 ui-monospace,monospace;letter-spacing:.13em;text-transform:uppercase;color:var(--wb-muted)}.wb-header-actions{display:flex;gap:8px;font-size:12px;flex-wrap:wrap}.wb-workspace{display:grid;grid-template-columns:minmax(0,1fr) 264px}.wb-canvas-column{min-width:0}.wb-canvas{position:relative;height:470px;background-image:radial-gradient(color-mix(in srgb,var(--wb-muted) 34%,transparent) 1px,transparent 1px),radial-gradient(ellipse at 50% 0%,color-mix(in srgb,var(--wb-secondary) 12%,transparent),transparent 68%);background-size:18px 18px,100% 100%}.wb-root .react-flow{background:transparent;--xy-attribution-background-color:var(--wb-card);--xy-edge-stroke:var(--wb-primary);--xy-connectionline-stroke:var(--wb-primary)}.wb-root .react-flow__attribution a{color:var(--wb-muted);background:var(--wb-card)}.wb-root .react-flow__node:focus-visible{outline:none}.wb-root .react-flow__node:focus-visible .wb-node{border-color:var(--wb-primary)}.wb-root .react-flow__node{background:none;border:none;padding:0}
.wb-node{width:196px;min-height:166px;border:1px solid color-mix(in srgb,var(--wb-node-accent,var(--wb-primary)) 60%,var(--wb-border));border-radius:18px;background:var(--wb-card);box-shadow:0 14px 32px -20px color-mix(in srgb,var(--wb-fg) 32%,transparent),0 0 26px -21px var(--wb-node-accent,var(--wb-primary));color:var(--wb-fg);position:relative}.wb-node[data-kind=agent]{--wb-node-accent:var(--wb-accent-2)}.wb-node[data-kind=integration],.wb-node[data-kind=review]{--wb-node-accent:var(--wb-accent-3)}.wb-node[data-selected=true]{border-color:var(--wb-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--wb-primary) 22%,transparent),0 18px 36px -20px color-mix(in srgb,var(--wb-primary) 55%,transparent)}.wb-node{animation:wb-node-in .45s cubic-bezier(.2,.8,.2,1) both;transition:border-color .25s,box-shadow .25s}@keyframes wb-node-in{from{opacity:0;transform:translateY(8px) scale(.96)}}.wb-node-head{padding:15px 13px 12px;display:flex;gap:10px;align-items:center}.wb-node-head strong{font-size:14px;line-height:1.2;display:block;font-weight:700;overflow-wrap:anywhere}.wb-node-head small{font:9px/1.5 ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--wb-muted);display:block;margin-top:5px}.wb-glyph{display:grid;place-items:center;flex:0 0 36px;height:36px;border:1px solid var(--wb-border);border-radius:10px;background:color-mix(in srgb,var(--wb-secondary) 12%,var(--wb-card));color:var(--wb-node-accent,var(--wb-primary))}.wb-glyph svg{width:21px;height:21px}.wb-node-body{padding:10px 13px 12px;border-top:1px solid var(--wb-border)}.wb-node-body p{font-size:12px;line-height:1.5;color:var(--wb-muted);margin:0 0 9px;overflow-wrap:anywhere}.wb-node-body>span{display:inline-block;border:1px solid var(--wb-border);border-radius:5px;padding:2px 6px;color:var(--wb-muted);font:9px/1.5 ui-monospace,monospace;text-transform:uppercase}
.wb-root .react-flow__handle{width:12px;height:12px;min-width:12px;min-height:12px;border:2px solid var(--wb-card);background:var(--wb-node-accent,var(--wb-primary))}.wb-root .react-flow__handle:hover{outline:3px solid color-mix(in srgb,var(--wb-primary) 30%,transparent)}.wb-edge-halo{fill:none;stroke:color-mix(in srgb,var(--wb-primary) 13%,transparent);stroke-width:9}.wb-edge{fill:none;stroke-width:2.5}.wb-edge-pulse{fill:none;stroke:var(--wb-fg);stroke-opacity:.45;stroke-width:2;stroke-dasharray:3 45;animation:wb-travel 6s linear infinite}.wb-port{fill:var(--wb-primary)}@keyframes wb-travel{to{stroke-dashoffset:-192}}.wb-root[data-animated=false] .wb-edge-pulse{animation:none}.wb-root .react-flow__edge.selected .wb-edge{stroke-width:5}.wb-root .react-flow__edge:focus-visible{outline:none}.wb-root .react-flow__edge:focus-visible .wb-edge{stroke-width:5;filter:drop-shadow(0 0 3px var(--wb-primary))}
.wb-empty{position:absolute;inset:40% 20px auto;text-align:center;color:var(--wb-muted);pointer-events:none}.wb-tools{position:absolute;left:16px;bottom:16px;display:flex;gap:3px;padding:4px;border:1px solid var(--wb-border);border-radius:10px;background:var(--wb-card);z-index:5}.wb-tools button{border:0;min-width:36px;padding:6px 9px;font-size:12px}.wb-status{display:flex;justify-content:space-between;gap:12px;border-top:1px solid var(--wb-border);padding:11px 18px;color:var(--wb-muted);font:10px/1.5 ui-monospace,monospace}.wb-status i{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--wb-secondary);margin-right:5px}.wb-editor{padding:18px;border-top:1px solid var(--wb-border);background:var(--wb-card);font-size:12px}.wb-edit-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.wb-edit-row>label{color:var(--wb-muted)}.wb-edit-row select{flex:1;min-width:120px;max-width:100%}.wb-connect{display:flex;gap:10px;align-items:end;margin-top:14px}.wb-connect label{flex:1;min-width:0;color:var(--wb-muted);display:grid;gap:5px}.wb-connect select{width:100%;min-width:0;color:var(--wb-fg)}.wb-connect>span{align-self:center;padding-top:19px;color:var(--wb-muted)}.wb-connect button{white-space:nowrap}.wb-details{margin-top:16px}.wb-details summary{cursor:pointer;color:var(--wb-muted);padding:6px 0}.wb-details p{line-height:1.7;max-width:65ch;color:var(--wb-muted)}.wb-details ul{list-style:none;padding:0;margin:8px 0}.wb-details li{display:flex;justify-content:space-between;gap:12px;align-items:center;border-top:1px solid var(--wb-border);padding:7px 0}.wb-details li span{overflow-wrap:anywhere}.wb-details li button{font-size:11px;padding:5px 9px}.wb-message{margin:14px 0 7px;min-height:1.5em;color:var(--wb-fg)}.wb-root .wb-reset{border:0;background:none;text-decoration:underline;color:var(--wb-muted);padding:6px 0;font-size:11px}
.wb-stack{border-left:1px solid var(--wb-border);background:color-mix(in srgb,var(--wb-card) 94%,var(--wb-secondary));padding:20px 15px;min-width:0}.wb-stack-heading{display:flex;align-items:center;justify-content:space-between}.wb-stack h4{font-size:14px;letter-spacing:-.01em;margin:0;font-weight:700}.wb-stack-heading>span{color:var(--wb-muted);font-size:24px;line-height:1}.wb-stack>p{font-size:11px;line-height:1.6;color:var(--wb-muted);margin:8px 0 19px}.wb-app{border:1px solid var(--wb-border);border-radius:11px;background:var(--wb-card);margin-top:9px;overflow:hidden}.wb-app summary{list-style:none;display:flex;gap:9px;align-items:center;padding:12px;cursor:pointer}.wb-app summary::-webkit-details-marker{display:none}.wb-app summary:after{content:'+';margin-left:auto;color:var(--wb-muted)}.wb-app[open] summary:after{content:'−'}.wb-app summary strong{font-size:12px;font-weight:600}.wb-app summary small{font:10px ui-monospace,monospace;color:var(--wb-muted)}.wb-app-mark{display:grid;place-items:center;width:27px;height:27px;border-radius:7px;border:1px solid var(--wb-border);color:var(--wb-primary);font-size:13px;font-weight:700}.wb-actions{border-top:1px solid var(--wb-border);padding:6px}.wb-actions button{display:flex;align-items:center;gap:12px;width:100%;text-align:left;font-size:11px;border:0;border-radius:6px;padding:9px;background:none}.wb-actions button>span{flex:1}.wb-actions small{display:block;font:8px/1.7 ui-monospace,monospace;text-transform:uppercase;letter-spacing:.09em;color:var(--wb-muted);margin-top:3px}.wb-actions b{font-size:16px;font-weight:400;color:var(--wb-primary)}
.wb-step-form{display:grid;gap:12px;margin-top:14px;padding:14px;border:1px solid var(--wb-border);border-radius:10px;background:var(--wb-bg)}.wb-step-form label{display:grid;gap:5px;color:var(--wb-muted)}.wb-step-form input,.wb-step-form textarea{width:100%;min-width:0;min-height:40px;padding:9px 10px;border:1px solid var(--wb-border);border-radius:8px;background:var(--wb-card);color:var(--wb-fg);font:inherit;resize:vertical}.wb-step-form :is(input,textarea):focus-visible{outline:3px solid var(--wb-primary);outline-offset:2px}.wb-step-form>div{display:flex;gap:8px;flex-wrap:wrap}
@container(max-width:1050px){.wb-workspace{grid-template-columns:1fr}.wb-stack{border-left:0;border-top:1px solid var(--wb-border);display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;align-items:start}.wb-stack-heading,.wb-stack>p{grid-column:1/-1}.wb-stack>p{margin:0}.wb-app{margin:0}.wb-canvas{height:420px}}
@container(max-width:480px){.wb-header{padding:14px;flex-wrap:wrap}.wb-header-actions{width:100%;justify-content:flex-end}.wb-header-actions>*{flex:1;justify-content:center}.wb-canvas{height:360px}.wb-status{flex-wrap:wrap;padding:10px 14px;gap:4px}.wb-editor{padding:14px}.wb-edit-row{display:grid;grid-template-columns:1fr}.wb-edit-row select{width:100%}.wb-connect{flex-wrap:wrap}.wb-connect label{flex:1 1 40%}.wb-connect>span{display:none}.wb-connect button{width:100%}.wb-stack{grid-template-columns:1fr}.wb-stack-heading,.wb-stack>p{grid-column:auto}.wb-details li{align-items:start}.wb-heading h3{font-size:15px}}
@media(prefers-reduced-motion:reduce){.wb-root .wb-edge-pulse,.wb-node{animation:none}}
`;
