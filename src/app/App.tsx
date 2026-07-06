import { useState, useEffect, useCallback } from "react";

const C = { blue: "#74ACDF", gold: "#F6B40E", dark: "#0d2a4a", white: "#f5faff", green: "#2e7d32", red: "#c62828" };

type Zone = "intro" | "map" | "town" | "river" | "forest" | "mine" | "lab" | "decision" | "ending";

// ─── NPC DATA ────────────────────────────────────────────────────────────────

const NPCS: Record<string, { emoji: string; name: string; role: string; lines: string[] }> = {
  intendente: { emoji: "👨‍💼", name: "Intendente Pereyra", role: "Intendente Municipal",
    lines: ["¡Bienvenido/a a Villa Verde, pibe! Soy Pereyra, el intendente.", "Una empresa quiere abrir una mina de hierro acá.", "Necesito que explores el río, el bosque, la mina y el laboratorio.", "Juntá información y después tomá la decisión más importante para el pueblo. ¡Mucha suerte!"] },
  minero: { emoji: "👷", name: "Roberto Sosa", role: "Operario Minero",
    lines: ["¿Viste un casco por ahí en la mina? Se me perdió.", "Si la mina abre, fin de las vacas flacas. Necesitamos laburo ya.", "Yo tengo tres pibes. Solo quiero darles un futuro digno."] },
  cientifica: { emoji: "👩‍🔬", name: "Dra. Fernández", role: "Investigadora del CONICET",
    lines: ["¡Necesito el informe de impacto ambiental! ¿Lo encontraste?", "La muestra del río muestra niveles preocupantes. Hay que actuar.", "Sin datos científicos no podemos avanzar. Gracias por traerlo."] },
  ambientalista: { emoji: "🌱", name: "Luciano Quiroga", role: "Ambientalista",
    lines: ["¡Este río está lleno de basura! ¿Me ayudás a limpiarlo?", "Si contaminamos el Río Salado, el 80% del pueblo se queda sin agua.", "Hay que actuar antes de que sea demasiado tarde, che."] },
  vecina: { emoji: "👩", name: "María Gómez", role: "Vecina y Madre",
    lines: ["Queremos laburo, obvio. Pero agua limpia para los pibes, primero.", "¿De qué sirve ganar plata si el agua del grifo viene marrón?", "Los vecinos ya estamos armando una asamblea para decidir entre todos."] },
  empresario: { emoji: "👨", name: "Ing. Cattáneo", role: "Representante de la Empresa",
    lines: ["500 empleos, hospital nuevo y rutas asfaltadas. Eso traemos.", "Necesitamos arrancar ya. Cada día que pasa son millones que se pierden.", "Claro que cumpliremos con las normas... cuando podamos."] },
  maestra: { emoji: "👩‍🏫", name: "Seño Patricia", role: "Maestra de la Primaria",
    lines: ["Los chicos preguntan si van a tener que mudarse.", "Si el agua se contamina, la escuela cierra. No hay alternativa.", "Pero con empleo genuino, las familias se quedan y el pueblo crece."] },
  abuelo: { emoji: "👴", name: "Don Héctor", role: "Vecino Histórico",
    lines: ["Yo vi lo que pasó en San Marcos con la mina sin controles.", "En cinco años el río murió y el pueblo quedó vacío. No repitamos eso.", "Pero también vi pueblos que se vaciaron por no tener trabajo. Es un dilema."] },
  nino: { emoji: "👦", name: "Tomás", role: "Estudiante, 10 años",
    lines: ["¡Quiero que el río esté limpio para pescar con mi papá!", "Mi maestra dice que si contaminamos el agua, los sapos desaparecen.", "¿Vas a ayudarnos a cuidar Villa Verde?"] },
  periodista: { emoji: "📰", name: "Claudia Ríos", role: "Periodista Local",
    lines: ["Estoy investigando el impacto de la mina en la comunidad.", "La empresa promete mucho, pero los vecinos no la creen.", "¿Qué decidiste? Tu postura puede influir en la opinión pública."] },
};

// ─── MISSIONS ────────────────────────────────────────────────────────────────

const MISSIONS = [
  { id: 0, title: "Hablar con el Intendente", zone: "town", xp: 50, icon: "👨‍💼" },
  { id: 1, title: "Encontrar el casco del minero", zone: "mine", xp: 30, icon: "🪖" },
  { id: 2, title: "Explorar la mina", zone: "mine", xp: 20, icon: "⛏" },
  { id: 3, title: "Buscar el informe ambiental", zone: "lab", xp: 40, icon: "📄" },
  { id: 4, title: "Hablar con la Dra. Fernández", zone: "lab", xp: 50, icon: "👩‍🔬" },
  { id: 5, title: "Limpiar el Río Salado", zone: "river", xp: 80, icon: "💧" },
  { id: 6, title: "Reforestar el bosque nativo", zone: "forest", xp: 60, icon: "🌳" },
  { id: 7, title: "Decidir el futuro del pueblo", zone: "decision", xp: 200, icon: "🏛" },
];

// ─── ACHIEVEMENTS ────────────────────────────────────────────────────────────

const ACHS: Record<string, { icon: string; title: string }> = {
  primer_paso: { icon: "🥇", title: "¡Primer Paso!" },
  explorador:  { icon: "🪖", title: "Explorador" },
  investigador:{ icon: "📖", title: "Investigador" },
  guardian:    { icon: "💧", title: "Guardián del Río" },
  reforestador:{ icon: "🌳", title: "Reforestador" },
  coleccionista:{icon: "🎒", title: "Coleccionista" },
  sostenible:  { icon: "🏆", title: "Desarrollo Sostenible" },
};

// ─── EVENTS ──────────────────────────────────────────────────────────────────

const EVENTS: Record<string, { title: string; desc: string; icon: string; opts: { label: string; eco: number; env: number; com: number; coins: number }[] }> = {
  expansion: {
    icon: "📰", title: "📰 Última Hora",
    desc: "La empresa quiere ampliar la mina y duplicar la producción. El intendente pide tu opinión urgente.",
    opts: [
      { label: "✔ Aprobar la ampliación", eco: 20, env: -20, com: 5, coins: 30 },
      { label: "✔ Aprobar con controles extras", eco: 10, env: -5, com: 10, coins: 20 },
      { label: "✘ Rechazar la ampliación", eco: -10, env: 15, com: 15, coins: 0 },
    ],
  },
  lluvia: {
    icon: "🌧", title: "🌧 Alerta Climática",
    desc: "El Río Salado creció con las lluvias. Residuos de la mina están llegando al agua. ¿Qué hacemos?",
    opts: [
      { label: "Cerrar la mina temporariamente", eco: -10, env: 20, com: 5, coins: 0 },
      { label: "Reforzar los diques de contención", eco: 5, env: 10, com: 5, coins: -15 },
      { label: "No hacer nada, ver cómo evoluciona", eco: 5, env: -20, com: -10, coins: 0 },
    ],
  },
};

// ─── SHOP ────────────────────────────────────────────────────────────────────

const SHOP = [
  { id: "bici",    icon: "🚲", name: "Bicicletas comunitarias", cost: 30,  eco: 0,  env: 0,  com: 10 },
  { id: "arboles", icon: "🌳", name: "Árboles extra nativos",   cost: 20,  eco: 0,  env: 10, com: 0  },
  { id: "filtro",  icon: "💧", name: "Filtros de agua potable", cost: 40,  eco: 0,  env: 15, com: 5  },
  { id: "hospital",icon: "🏥", name: "Hospital nuevo",           cost: 80,  eco: 15, env: 0,  com: 10 },
  { id: "escuela", icon: "🏫", name: "Escuela ampliada",         cost: 60,  eco: 0,  env: 0,  com: 15 },
];

// ─── SMALL HELPERS ───────────────────────────────────────────────────────────

function clamp(v: number) { return Math.max(0, Math.min(100, v)); }

function FlagBar({ h = 6 }: { h?: number }) {
  return <div className="w-full flex shrink-0" style={{ height: h }}>
    <div className="flex-1" style={{ background: C.blue }} />
    <div className="flex-1 bg-white" />
    <div className="flex-1" style={{ background: C.blue }} />
  </div>;
}

function SolDeMayo({ size = 48 }: { size?: number }) {
  const r = size / 2, rays = 16;
  return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
    {Array.from({ length: rays }, (_, i) => {
      const angle = (i * 360) / rays, rad = angle * Math.PI / 180, w = i % 2 === 0;
      const x1 = r + Math.cos(rad) * r * .44, y1 = r + Math.sin(rad) * r * .44;
      const x2 = r + Math.cos(rad) * r * .90, y2 = r + Math.sin(rad) * r * .90;
      return w
        ? <path key={i} d={`M${x1} ${y1} Q${r + Math.cos(rad)*r*.67+3} ${r+Math.sin(rad)*r*.67-3} ${x2} ${y2}`} stroke={C.gold} strokeWidth={size/22} fill="none" strokeLinecap="round"/>
        : <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.gold} strokeWidth={size/28} strokeLinecap="round"/>;
    })}
    <circle cx={r} cy={r} r={r*.38} fill={C.gold}/>
    <circle cx={r-r*.11} cy={r-r*.07} r={r*.045} fill={C.dark}/>
    <circle cx={r+r*.11} cy={r-r*.07} r={r*.045} fill={C.dark}/>
    <path d={`M${r-r*.13} ${r+r*.09} Q${r} ${r+r*.2} ${r+r*.13} ${r+r*.09}`} stroke={C.dark} strokeWidth={r*.04} fill="none" strokeLinecap="round"/>
  </svg>;
}

// ─── HUD ─────────────────────────────────────────────────────────────────────

function StatPill({ icon, val, color }: { icon: string; val: number; color: string }) {
  return <div className="flex items-center gap-1 flex-1">
    <span className="text-sm shrink-0">{icon}</span>
    <div className="flex-1 rounded-full overflow-hidden" style={{ height: 6, background: "rgba(255,255,255,0.15)" }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${val}%`, background: color }}/>
    </div>
    <span className="text-xs font-black tabular-nums" style={{ fontFamily: "Montserrat", color: "white", minWidth: 22 }}>{val}</span>
  </div>;
}

function HUD({ xp, coins, eco, env, com, mission, onMap, onShop }: {
  xp: number; coins: number; eco: number; env: number; com: number;
  mission: number; onMap: () => void; onShop: () => void;
}) {
  return <div className="shrink-0 z-30 relative">
    <FlagBar h={5}/>
    <div className="px-3 py-2" style={{ background: C.dark }}>
      <div className="flex items-center gap-2 mb-2">
        <button onClick={onMap} className="text-xs font-black px-2 py-1 rounded-lg" style={{ background: `${C.blue}44`, color: C.blue, fontFamily: "Montserrat" }}>🗺 Mapa</button>
        <div className="flex-1 flex gap-3">
          <span className="text-xs font-black" style={{ color: C.gold, fontFamily: "Montserrat" }}>⭐ {xp} XP</span>
          <span className="text-xs font-black" style={{ color: C.gold, fontFamily: "Montserrat" }}>🪙 {coins}</span>
        </div>
        <button onClick={onShop} className="text-xs font-black px-2 py-1 rounded-lg" style={{ background: `${C.gold}33`, color: C.gold, fontFamily: "Montserrat" }}>🏪 Tienda</button>
      </div>
      <div className="flex gap-2">
        <StatPill icon="💰" val={eco} color={C.gold}/>
        <StatPill icon="🌳" val={env} color="#4caf50"/>
        <StatPill icon="👥" val={com} color={C.blue}/>
      </div>
      <div className="mt-1.5 text-xs" style={{ fontFamily: "Nunito", color: "rgba(255,255,255,0.65)" }}>
        📋 Misión {Math.min(mission + 1, 8)}/8:{" "}
        <span style={{ color: "white", fontWeight: 700 }}>{MISSIONS[mission]?.title ?? "¡Juego completado!"}</span>
      </div>
    </div>
    <FlagBar h={3}/>
  </div>;
}

// ─── NPC DIALOG ──────────────────────────────────────────────────────────────

function DialogBox({ npcId, line, onNext, onClose }: { npcId: string; line: number; onNext: () => void; onClose: () => void }) {
  const npc = NPCS[npcId];
  if (!npc) return null;
  const last = line >= npc.lines.length - 1;
  return <div className="absolute inset-0 z-50 flex items-end pb-4 px-3" style={{ background: "rgba(13,42,74,0.45)", backdropFilter: "blur(3px)" }}>
    <div className="w-full rounded-2xl overflow-hidden shadow-2xl" style={{ border: `2px solid ${C.blue}` }}>
      <FlagBar h={5}/>
      <div style={{ background: C.white }} className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="rounded-full flex items-center justify-center text-3xl shrink-0" style={{ width: 48, height: 48, background: `${C.blue}22`, border: `2px solid ${C.blue}` }}>{npc.emoji}</div>
          <div className="flex-1">
            <div className="font-black" style={{ fontFamily: "Montserrat", fontSize: 15, color: C.dark }}>{npc.name}</div>
            <div className="text-xs font-bold" style={{ color: C.blue }}>{npc.role}</div>
          </div>
          <div className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: `${C.blue}20`, color: C.blue }}>{line + 1}/{npc.lines.length}</div>
        </div>
        <p className="leading-relaxed mb-4" style={{ fontFamily: "Nunito", fontSize: 14, color: C.dark }}>{npc.lines[line]}</p>
        <button onClick={last ? onClose : onNext} className="w-full py-2.5 rounded-xl font-black transition-all active:scale-95"
          style={{ fontFamily: "Montserrat", fontSize: 14, background: last ? `linear-gradient(135deg,${C.gold},#d49a0c)` : `linear-gradient(135deg,${C.blue},#5b93c7)`, color: last ? C.dark : "white" }}>
          {last ? "¡Gracias! ✓" : "Continuar ▶"}
        </button>
      </div>
      <FlagBar h={5}/>
    </div>
  </div>;
}

// ─── ACHIEVEMENT TOAST ────────────────────────────────────────────────────────

function AchToast({ id, onDone }: { id: string; onDone: () => void }) {
  const a = ACHS[id];
  useEffect(() => { const t = setTimeout(onDone, 3200); return () => clearTimeout(t); }, [onDone]);
  if (!a) return null;
  return <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce"
    style={{ background: C.gold, color: C.dark, border: "2px solid white", whiteSpace: "nowrap" }}>
    <span className="text-2xl">{a.icon}</span>
    <div><div className="font-black text-sm" style={{ fontFamily: "Montserrat" }}>¡Logro desbloqueado!</div><div className="font-bold text-xs">{a.title}</div></div>
  </div>;
}

// ─── EVENT MODAL ─────────────────────────────────────────────────────────────

function EventModal({ evId, onChoice }: { evId: string; onChoice: (eco: number, env: number, com: number, coins: number) => void }) {
  const ev = EVENTS[evId];
  if (!ev) return null;
  return <div className="absolute inset-0 z-40 flex items-center justify-center px-4" style={{ background: "rgba(13,42,74,0.6)", backdropFilter: "blur(4px)" }}>
    <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl">
      <FlagBar h={6}/>
      <div style={{ background: C.white }} className="p-5">
        <div className="text-4xl text-center mb-2">{ev.icon}</div>
        <div className="font-black text-center mb-2" style={{ fontFamily: "Montserrat", fontSize: 16, color: C.dark }}>{ev.title}</div>
        <p className="text-sm leading-relaxed mb-4 text-center" style={{ fontFamily: "Nunito", color: "#3a6080" }}>{ev.desc}</p>
        <div className="flex flex-col gap-2">
          {ev.opts.map((o, i) => (
            <button key={i} onClick={() => onChoice(o.eco, o.env, o.com, o.coins)}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-sm text-left transition-all active:scale-95"
              style={{ fontFamily: "Nunito", background: i === 0 ? "#e8f5e9" : i === 1 ? "#fff8e1" : "#fce4ec", border: `1.5px solid ${i === 0 ? C.green : i === 1 ? C.gold : C.red}` }}>
              {o.label}
            </button>
          ))}
        </div>
      </div>
      <FlagBar h={6}/>
    </div>
  </div>;
}

// ─── SHOP MODAL ──────────────────────────────────────────────────────────────

function ShopModal({ coins, bought, onBuy, onClose }: { coins: number; bought: Set<string>; onBuy: (id: string, eco: number, env: number, com: number, cost: number) => void; onClose: () => void }) {
  return <div className="absolute inset-0 z-40 flex items-center justify-center px-4" style={{ background: "rgba(13,42,74,0.6)", backdropFilter: "blur(4px)" }}>
    <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl">
      <FlagBar h={6}/>
      <div style={{ background: C.white }} className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-black" style={{ fontFamily: "Montserrat", fontSize: 17, color: C.dark }}>🏪 Tienda del Pueblo</div>
          <div className="font-black" style={{ color: C.gold }}>🪙 {coins}</div>
        </div>
        <div className="flex flex-col gap-2 mb-3">
          {SHOP.map(item => {
            const done = bought.has(item.id);
            const canAfford = coins >= item.cost;
            return <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: done ? "#e8f5e9" : "#f0f4ff", border: `1.5px solid ${done ? C.green : C.blue}20` }}>
              <span className="text-2xl">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-xs" style={{ fontFamily: "Montserrat", color: C.dark }}>{item.name}</div>
                <div className="text-xs" style={{ color: "#3a6080" }}>
                  {item.eco > 0 && `+${item.eco}💰 `}{item.env > 0 && `+${item.env}🌳 `}{item.com > 0 && `+${item.com}👥`}
                </div>
              </div>
              {done ? <span className="text-green-600 font-black text-xs">✓</span>
                : <button onClick={() => onBuy(item.id, item.eco, item.env, item.com, item.cost)}
                    disabled={!canAfford}
                    className="shrink-0 px-3 py-1.5 rounded-lg font-black text-xs transition-all active:scale-95"
                    style={{ fontFamily: "Montserrat", background: canAfford ? C.gold : "#ccc", color: canAfford ? C.dark : "#999" }}>
                    🪙 {item.cost}
                  </button>}
            </div>;
          })}
        </div>
        <button onClick={onClose} className="w-full py-2 rounded-xl font-black text-sm" style={{ fontFamily: "Montserrat", background: `${C.blue}22`, color: C.blue }}>Cerrar ✕</button>
      </div>
      <FlagBar h={6}/>
    </div>
  </div>;
}

// ─── MINIGAME: RIVER ─────────────────────────────────────────────────────────

const TRASH_POS = [
  {x:15,y:45},{x:30,y:60},{x:50,y:38},{x:65,y:55},{x:80,y:42},
  {x:22,y:70},{x:58,y:72},{x:75,y:65},
];

function RiverMinigame({ onComplete }: { onComplete: () => void }) {
  const [collected, setCollected] = useState<Set<number>>(new Set());
  const [done, setDone] = useState(false);
  const collect = (i: number) => {
    setCollected(prev => {
      const n = new Set(prev); n.add(i);
      if (n.size >= TRASH_POS.length) setTimeout(() => setDone(true), 400);
      return n;
    });
  };
  return <div className="absolute inset-0 flex flex-col" style={{ background: "linear-gradient(180deg, #87ceeb 0%, #90caf9 35%, #29b6f6 55%, #0288d1 100%)" }}>
    <div className="absolute inset-0 opacity-30">
      {[20,40,60,80].map(y => <div key={y} className="absolute w-full" style={{ top:`${y}%`, height:2, background:"rgba(255,255,255,0.4)", borderRadius:2 }}/>)}
    </div>
    <div className="relative flex-1">
      <div className="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl font-black text-white shadow-lg text-sm" style={{ fontFamily:"Montserrat", background:"rgba(13,42,74,0.7)" }}>
        💧 Limpiar el Río Salado — {collected.size}/{TRASH_POS.length}
      </div>
      {TRASH_POS.map((p, i) => (
        <button key={i} onClick={() => !collected.has(i) && collect(i)}
          className="absolute transition-all"
          style={{ left:`${p.x}%`, top:`${p.y}%`, transform:"translate(-50%,-50%)", fontSize: 22,
            opacity: collected.has(i) ? 0 : 1, filter: collected.has(i) ? "none" : "drop-shadow(0 2px 4px rgba(0,0,0,0.4))" }}>
          {["🗑","🍾","🧴","📦","🥤","🛒","🧻","📰"][i]}
        </button>
      ))}
      {done && <div className="absolute inset-0 flex items-center justify-center" style={{ background:"rgba(13,42,74,0.55)", backdropFilter:"blur(4px)" }}>
        <div className="text-center p-6 rounded-2xl" style={{ background:C.white }}>
          <div className="text-5xl mb-2">💧✨</div>
          <div className="font-black text-lg mb-1" style={{ fontFamily:"Montserrat", color:C.dark }}>¡Río limpio!</div>
          <div className="text-sm mb-4" style={{ fontFamily:"Nunito", color:"#3a6080" }}>+80 XP · +15 Ambiente · +10 Comunidad</div>
          <button onClick={onComplete} className="px-6 py-2.5 rounded-xl font-black text-white" style={{ fontFamily:"Montserrat", background:`linear-gradient(135deg,${C.blue},#5b93c7)` }}>¡Genial! →</button>
        </div>
      </div>}
    </div>
  </div>;
}

// ─── MINIGAME: FOREST ─────────────────────────────────────────────────────────

const TREE_POS = [{x:20,y:40},{x:42,y:55},{x:63,y:38},{x:80,y:58},{x:35,y:70}];

function ForestMinigame({ onComplete }: { onComplete: () => void }) {
  const [planted, setPlanted] = useState<Set<number>>(new Set());
  const [done, setDone] = useState(false);
  const plant = (i: number) => {
    setPlanted(prev => {
      const n = new Set(prev); n.add(i);
      if (n.size >= TREE_POS.length) setTimeout(() => setDone(true), 600);
      return n;
    });
  };
  return <div className="absolute inset-0 flex flex-col" style={{ background:"linear-gradient(180deg,#87ceeb 0%,#aed581 40%,#558b2f 100%)" }}>
    <div className="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl font-black text-white shadow-lg text-sm z-10" style={{ fontFamily:"Montserrat", background:"rgba(13,42,74,0.7)" }}>
      🌱 Plantar árboles nativos — {planted.size}/{TREE_POS.length}
    </div>
    {TREE_POS.map((p, i) => (
      <button key={i} onClick={() => !planted.has(i) && plant(i)}
        className="absolute transition-all hover:scale-110"
        style={{ left:`${p.x}%`, top:`${p.y}%`, transform:"translate(-50%,-50%)", fontSize:planted.has(i)?36:28 }}>
        {planted.has(i) ? "🌳" : "⭕"}
      </button>
    ))}
    {planted.size > 0 && planted.size < TREE_POS.length && (
      <div className="absolute bottom-4 left-0 right-0 text-center text-xs font-bold text-white" style={{ fontFamily:"Nunito" }}>
        ¡Tap los círculos para plantar!
      </div>
    )}
    {done && <div className="absolute inset-0 flex items-center justify-center" style={{ background:"rgba(13,42,74,0.55)", backdropFilter:"blur(4px)" }}>
      <div className="text-center p-6 rounded-2xl" style={{ background:C.white }}>
        <div className="text-5xl mb-2">🌳🦜🦋</div>
        <div className="font-black text-lg mb-1" style={{ fontFamily:"Montserrat", color:C.dark }}>¡Bosque reforestado!</div>
        <div className="text-sm mb-1" style={{ fontFamily:"Nunito", color:"#3a6080" }}>+60 XP · +15 Ambiente · +5 Comunidad</div>
        <div className="text-xs mb-4" style={{ fontFamily:"Nunito", color:"#558b2f" }}>¡Los animales volvieron al bosque! 🐦🦉</div>
        <button onClick={onComplete} className="px-6 py-2.5 rounded-xl font-black text-white" style={{ fontFamily:"Montserrat", background:`linear-gradient(135deg,${C.green},#1b5e20)` }}>¡Genial! →</button>
      </div>
    </div>}
  </div>;
}

// ─── MINIGAME: MINE ──────────────────────────────────────────────────────────

const ROCKS = [
  {type:"ore"},{type:"toxic"},{type:"ore"},{type:"toxic"},{type:"ore"},{type:"toxic"},
];

function MineMinigame({ onComplete }: { onComplete: (ores: number) => void }) {
  const [revealed, setReveal] = useState<(string|null)[]>(Array(6).fill(null));
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const click = (i: number) => {
    if (revealed[i]) return;
    const r = ROCKS[i].type;
    setReveal(prev => { const n=[...prev]; n[i]=r; return n; });
    if (r === "ore") {
      setScore(s => {
        const ns = s + 1;
        if (ns >= 3) setTimeout(() => setDone(true), 400);
        return ns;
      });
    }
  };
  return <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background:"linear-gradient(180deg,#37474f 0%,#263238 100%)" }}>
    <div className="px-4 py-2 rounded-xl font-black text-white shadow-lg text-sm mb-6" style={{ fontFamily:"Montserrat", background:"rgba(0,0,0,0.5)" }}>
      ⛏ Encontrá los 3 minerales — evitá los tóxicos
    </div>
    <div className="grid grid-cols-3 gap-4 px-6">
      {ROCKS.map((rock, i) => (
        <button key={i} onClick={() => click(i)}
          className="rounded-2xl flex items-center justify-center transition-all active:scale-95"
          style={{ width:72, height:72, background: revealed[i] === "ore" ? "#ffd54f" : revealed[i] === "toxic" ? "#ef5350" : "rgba(255,255,255,0.12)", border:`2px solid ${revealed[i] === "ore" ? C.gold : revealed[i] === "toxic" ? C.red : "rgba(255,255,255,0.2)"}`, fontSize:32 }}>
          {revealed[i] === "ore" ? "💎" : revealed[i] === "toxic" ? "☣️" : "🪨"}
        </button>
      ))}
    </div>
    <div className="mt-4 text-white text-sm font-bold" style={{ fontFamily:"Nunito" }}>Minerales: {score}/3</div>
    {done && <div className="absolute inset-0 flex items-center justify-center" style={{ background:"rgba(13,42,74,0.55)", backdropFilter:"blur(4px)" }}>
      <div className="text-center p-6 rounded-2xl" style={{ background:C.white }}>
        <div className="text-5xl mb-2">💎⛏</div>
        <div className="font-black text-lg mb-1" style={{ fontFamily:"Montserrat", color:C.dark }}>¡Mineral encontrado!</div>
        <div className="text-sm mb-4" style={{ fontFamily:"Nunito", color:"#3a6080" }}>+30 XP · +15 Economía</div>
        <button onClick={() => onComplete(score)} className="px-6 py-2.5 rounded-xl font-black text-white" style={{ fontFamily:"Montserrat", background:`linear-gradient(135deg,#546e7a,#263238)` }}>¡Genial! →</button>
      </div>
    </div>}
  </div>;
}

// ─── MINIGAME: LAB ───────────────────────────────────────────────────────────

function LabMinigame({ onComplete }: { onComplete: (correct: boolean) => void }) {
  const [answered, setAnswered] = useState<number | null>(null);
  const opts = [
    { label: "El agua está contaminada con metales pesados", correct: true },
    { label: "El agua está limpia y es potable", correct: false },
    { label: "Es solo el color natural del río en esta zona", correct: false },
  ];
  return <div className="absolute inset-0 flex flex-col items-center justify-center px-4" style={{ background:"linear-gradient(180deg,#e3f2fd 0%,#f5faff 100%)" }}>
    <div className="w-full max-w-sm">
      <div className="text-center mb-4">
        <div className="text-5xl mb-2">🧪</div>
        <div className="font-black text-base mb-1" style={{ fontFamily:"Montserrat", color:C.dark }}>Análisis de muestra del río</div>
        <div className="text-sm" style={{ fontFamily:"Nunito", color:"#3a6080" }}>La muestra tiene una tonalidad verdosa y olor fuerte. ¿Qué indica esto?</div>
      </div>
      <div className="flex flex-col gap-3">
        {opts.map((o, i) => (
          <button key={i} onClick={() => { if (answered === null) { setAnswered(i); setTimeout(() => onComplete(o.correct), 1800); } }}
            className="p-4 rounded-xl font-semibold text-sm text-left transition-all"
            style={{ fontFamily:"Nunito", background: answered === null ? C.white : answered === i ? (o.correct ? "#e8f5e9" : "#fce4ec") : C.white,
              border:`2px solid ${answered === null ? `${C.blue}40` : answered === i ? (o.correct ? C.green : C.red) : `${C.blue}20`}`,
              color: answered === null ? C.dark : answered === i ? (o.correct ? C.green : C.red) : C.dark }}>
            {answered === i && (o.correct ? "✅ " : "❌ ")}{o.label}
          </button>
        ))}
      </div>
      {answered !== null && <div className="mt-3 text-center text-sm font-bold" style={{ fontFamily:"Nunito", color: opts[answered].correct ? C.green : C.red }}>
        {opts[answered].correct ? "¡Correcto! +50 XP · +10 Comunidad" : "Incorrecto. Revisá los datos del informe."}
      </div>}
    </div>
  </div>;
}

// ─── ZONE: INTRO ─────────────────────────────────────────────────────────────

function ZoneIntro({ onStart }: { onStart: () => void }) {
  return <div className="relative size-full flex flex-col overflow-hidden" style={{ background: C.blue }}>
    <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,#74ACDF 0%,#74ACDF 33%,white 33%,white 66%,#74ACDF 66%,#74ACDF 100%)" }}/>
    <svg className="absolute" style={{ bottom:"28%", left:0, width:"100%", zIndex:1 }} viewBox="0 0 800 140" preserveAspectRatio="none" height={80}>
      <polygon points="0,140 70,30 150,80 240,5 340,65 420,0 510,50 590,10 670,45 760,15 800,40 800,140" fill="#1a3a5c"/>
      <polygon points="0,140 90,50 180,90 280,20 390,70 460,15 550,55 630,18 720,52 800,28 800,140" fill="#22527a" opacity=".7"/>
      <polygon points="220,5 208,32 234,32" fill="white" opacity=".85"/>
      <polygon points="420,0 408,26 434,26" fill="white" opacity=".85"/>
      <polygon points="590,10 578,34 604,34" fill="white" opacity=".85"/>
    </svg>
    <div className="absolute bottom-0 left-0 right-0" style={{ height:"28%", background:"linear-gradient(180deg,#c8a96e 0%,#a07840 100%)", zIndex:2 }}/>
    <svg className="absolute" style={{ bottom:"27%", left:0, width:"100%", zIndex:3 }} viewBox="0 0 800 30" preserveAspectRatio="none" height={18}>
      <path d="M0,20 Q100,5 200,18 Q300,3 400,17 Q500,4 600,18 Q700,3 800,16 L800,30 L0,30 Z" fill="#5a8a3a"/>
    </svg>
    <div className="absolute inset-0 flex items-center justify-center z-10">
      <SolDeMayo size={88}/>
    </div>
    <div className="absolute inset-0 flex flex-col items-center justify-center z-20 px-6 text-center gap-5" style={{ marginTop:"-18%" }}>
      <div>
        <div className="font-black" style={{ fontFamily:"Montserrat", fontSize:"clamp(2rem,9vw,3.5rem)", color:"white", textShadow:"0 3px 18px rgba(13,42,74,.7)", lineHeight:1.1 }}>🏔️ Villa Verde</div>
        <div className="font-bold mt-1" style={{ fontFamily:"Montserrat", fontSize:"clamp(.65rem,2.2vw,.8rem)", color:C.gold, letterSpacing:".15em" }}>PROVINCIA DE SAN MARCOS · ARGENTINA</div>
      </div>
      <div className="max-w-xs rounded-2xl px-5 py-4" style={{ background:"rgba(13,42,74,.65)", backdropFilter:"blur(8px)", fontFamily:"Nunito", fontSize:"clamp(.82rem,2.8vw,.95rem)", color:"rgba(255,255,255,.93)", lineHeight:1.6 }}>
        Una empresa quiere instalar una mina de hierro. Explorá el pueblo, limpiá el río, reforestá el bosque y tomá la mejor decisión para el futuro.
      </div>
      <button onClick={onStart} className="font-black rounded-2xl px-10 py-4 shadow-2xl transition-all hover:scale-105 active:scale-95"
        style={{ fontFamily:"Montserrat", fontSize:"clamp(1rem,4vw,1.2rem)", background:`linear-gradient(135deg,${C.gold},#d49a0c)`, color:C.dark, boxShadow:`0 8px 28px rgba(246,180,14,.5)` }}>
        ▶ COMENZAR
      </button>
    </div>
  </div>;
}

// ─── ZONE: WORLD MAP ─────────────────────────────────────────────────────────

const ZONES_DEF = [
  { id:"town",   icon:"🏘️", name:"Villa Verde",         sub:"Pueblo principal",           bg:"#e3f2fd", border:C.blue },
  { id:"river",  icon:"💧", name:"Río Salado",           sub:"Limpieza del río",            bg:"#e8f5e9", border:"#2e7d32" },
  { id:"forest", icon:"🌳", name:"Bosque Nativo",        sub:"Reforestación",              bg:"#f1f8e9", border:"#558b2f" },
  { id:"mine",   icon:"⛏", name:"La Mina",              sub:"Exploración minera",          bg:"#efebe9", border:"#795548" },
  { id:"lab",    icon:"🔬", name:"Lab. del CONICET",    sub:"Análisis científico",          bg:"#f3e5f5", border:"#7b1fa2" },
];

function ZoneMap({ currentMission, onGo, onDecide }: { currentMission: number; onGo: (z: Zone) => void; onDecide: () => void }) {
  return <div className="flex-1 overflow-auto px-3 py-4" style={{ background:`linear-gradient(135deg,${C.blue}18 0%,white 50%,${C.gold}12 100%)` }}>
    <div className="text-center mb-4">
      <SolDeMayo size={44} className="mx-auto mb-1"/>
      <div className="font-black" style={{ fontFamily:"Montserrat", fontSize:18, color:C.dark }}>Mapa de Villa Verde</div>
      <div className="text-xs" style={{ fontFamily:"Nunito", color:"#3a6080" }}>Tocá una zona para explorarla</div>
    </div>
    <div className="flex flex-col gap-3 max-w-sm mx-auto">
      {ZONES_DEF.map(z => (
        <button key={z.id} onClick={() => onGo(z.id as Zone)}
          className="w-full rounded-2xl p-4 text-left shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 active:scale-98 flex items-center gap-4"
          style={{ background:z.bg, border:`2px solid ${z.border}33` }}>
          <span className="text-4xl">{z.icon}</span>
          <div className="flex-1">
            <div className="font-black text-sm" style={{ fontFamily:"Montserrat", color:C.dark }}>{z.name}</div>
            <div className="text-xs" style={{ fontFamily:"Nunito", color:"#3a6080" }}>{z.sub}</div>
          </div>
          <div className="text-xl">{MISSIONS[currentMission]?.zone === z.id ? "📍" : "→"}</div>
        </button>
      ))}
      {currentMission >= 7 && (
        <button onClick={onDecide}
          className="w-full rounded-2xl p-4 text-center shadow-xl font-black text-white transition-all hover:scale-105 active:scale-95"
          style={{ fontFamily:"Montserrat", fontSize:16, background:`linear-gradient(135deg,${C.gold},#d49a0c)`, color:C.dark, boxShadow:`0 6px 24px rgba(246,180,14,.5)` }}>
          🏛 ¡Decidir el futuro del pueblo! →
        </button>
      )}
    </div>
  </div>;
}

// ─── ZONE: TOWN ──────────────────────────────────────────────────────────────

const TOWN_NPCS = [
  {id:"intendente",x:50,y:45},{id:"minero",x:22,y:55},{id:"empresario",x:75,y:48},
  {id:"vecina",x:38,y:68},{id:"maestra",x:62,y:65},{id:"abuelo",x:18,y:72},
  {id:"nino",x:80,y:70},{id:"periodista",x:55,y:78},
];

function ZoneTown({ talked, onTalk, onBack }: { talked: Set<string>; onTalk: (id: string) => void; onBack: () => void }) {
  return <div className="flex-1 relative overflow-hidden">
    <div className="absolute inset-0" style={{ background:"linear-gradient(180deg,#74ACDF 0%,#90caf9 30%,#aed581 60%,#66bb6a 100%)" }}/>
    <div className="absolute" style={{ top:12, left:"50%", transform:"translateX(-50%)", zIndex:5 }}>
      <SolDeMayo size={42}/>
    </div>
    {[{x:15,y:9,w:85},{x:62,y:6,w:65},{x:84,y:13,w:52}].map((cl,i) => (
      <div key={i} className="absolute rounded-full bg-white opacity-80" style={{ left:`${cl.x}%`, top:`${cl.y}%`, width:cl.w, height:28, filter:"blur(3px)" }}/>
    ))}
    <div className="absolute bottom-0 left-0 right-0" style={{ height:"45%", background:"linear-gradient(180deg,#66bb6a 0%,#388e3c 100%)" }}/>
    <div className="absolute" style={{ top:"14%", left:"50%", transform:"translateX(-50%)", zIndex:6, textAlign:"center", background:C.blue, border:"3px solid white", borderRadius:10, padding:"5px 18px" }}>
      <div className="font-black text-white" style={{ fontFamily:"Montserrat", fontSize:16 }}>🏘️ VILLA VERDE</div>
      <div className="font-bold" style={{ fontFamily:"Montserrat", color:C.gold, fontSize:9, letterSpacing:".08em" }}>3.200 HABITANTES</div>
    </div>
    {TOWN_NPCS.map(n => {
      const npc = NPCS[n.id];
      const done = talked.has(n.id);
      return <button key={n.id} onClick={() => onTalk(n.id)}
        className="absolute group cursor-pointer select-none"
        style={{ left:`${n.x}%`, top:`${n.y}%`, transform:"translate(-50%,-50%)", zIndex:7 }}>
        <div className="relative flex flex-col items-center">
          {!done && <div className="absolute -top-7 text-xs font-black px-2 py-0.5 rounded-full text-white animate-bounce" style={{ background:C.gold, color:C.dark, fontFamily:"Montserrat", whiteSpace:"nowrap", fontSize:9 }}>¡Hablar!</div>}
          {done && <div className="absolute -top-5 text-xs font-black px-1.5 py-0.5 rounded-full text-white" style={{ background:C.green, fontSize:9 }}>✓</div>}
          <div className="rounded-full flex items-center justify-center text-2xl transition-transform group-hover:scale-110"
            style={{ width:46, height:46, background:done?`${C.blue}22`:`${C.gold}22`, border:`2px solid ${done?C.blue:C.gold}`, boxShadow:`0 3px 10px rgba(0,0,0,.15)` }}>
            {npc.emoji}
          </div>
          <div className="mt-1 text-center px-1 py-0.5 rounded-md" style={{ fontFamily:"Montserrat", fontWeight:700, background:"rgba(245,250,255,.9)", color:C.dark, maxWidth:72, fontSize:8, lineHeight:1.2 }}>{npc.name}</div>
        </div>
      </button>;
    })}
    <button onClick={onBack} className="absolute bottom-4 left-4 z-10 px-4 py-2 rounded-xl font-black text-white text-xs shadow-lg" style={{ fontFamily:"Montserrat", background:"rgba(13,42,74,.7)" }}>← Mapa</button>
  </div>;
}

// ─── ZONE: RIVER ─────────────────────────────────────────────────────────────

function ZoneRiver({ riverDone, talked, onTalk, onStartGame, onBack }: { riverDone: boolean; talked: Set<string>; onTalk: (id:string)=>void; onStartGame: ()=>void; onBack: ()=>void }) {
  return <div className="flex-1 relative overflow-hidden">
    <div className="absolute inset-0" style={{ background:"linear-gradient(180deg,#87ceeb 0%,#29b6f6 45%,#0288d1 100%)" }}/>
    <div className="absolute inset-0 opacity-25">{[20,40,60,80].map(y=><div key={y} className="absolute w-full" style={{top:`${y}%`,height:2,background:"rgba(255,255,255,.5)"}}/>)}</div>
    <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-xl font-black text-white text-sm" style={{ fontFamily:"Montserrat", background:"rgba(13,42,74,.65)" }}>💧 Río Salado</div>
    <button onClick={() => onTalk("ambientalista")}
      className="absolute cursor-pointer" style={{ left:"25%", top:"55%", transform:"translate(-50%,-50%)", zIndex:7 }}>
      <div className="relative flex flex-col items-center">
        {!talked.has("ambientalista") && <div className="absolute -top-7 text-xs font-black px-2 py-0.5 rounded-full animate-bounce" style={{ background:C.gold, color:C.dark, fontFamily:"Montserrat", whiteSpace:"nowrap", fontSize:9 }}>¡Hablar!</div>}
        {talked.has("ambientalista") && <div className="absolute -top-5 text-xs font-black px-1.5 py-0.5 rounded-full text-white" style={{ background:C.green, fontSize:9 }}>✓</div>}
        <div className="rounded-full flex items-center justify-center text-2xl" style={{ width:46,height:46,background:`${C.gold}22`,border:`2px solid ${C.gold}` }}>🌱</div>
        <div className="mt-1 text-center px-1 py-0.5 rounded-md text-white font-bold" style={{ fontFamily:"Montserrat", fontSize:8, background:"rgba(13,42,74,.6)" }}>L. Quiroga</div>
      </div>
    </button>
    {!riverDone && (
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10">
        <div className="text-center mb-2 text-white text-xs font-bold" style={{ fontFamily:"Nunito" }}>🗑 El río está lleno de basura</div>
        <button onClick={onStartGame} className="px-6 py-3 rounded-2xl font-black text-white shadow-xl transition-all hover:scale-105 active:scale-95"
          style={{ fontFamily:"Montserrat", fontSize:14, background:`linear-gradient(135deg,#0288d1,#01579b)`, boxShadow:"0 6px 20px rgba(2,136,209,.5)" }}>
          💧 ¡Limpiar el río!
        </button>
      </div>
    )}
    {riverDone && <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-xl text-white font-black text-sm" style={{ fontFamily:"Montserrat", background:"rgba(46,125,50,.8)" }}>✅ Río limpio</div>}
    <button onClick={onBack} className="absolute bottom-4 left-4 z-10 px-4 py-2 rounded-xl font-black text-white text-xs shadow-lg" style={{ fontFamily:"Montserrat", background:"rgba(13,42,74,.7)" }}>← Mapa</button>
  </div>;
}

// ─── ZONE: FOREST ────────────────────────────────────────────────────────────

function ZoneForest({ forestDone, onStartGame, onBack }: { forestDone: boolean; onStartGame: ()=>void; onBack: ()=>void }) {
  return <div className="flex-1 relative overflow-hidden">
    <div className="absolute inset-0" style={{ background:"linear-gradient(180deg,#87ceeb 0%,#aed581 40%,#388e3c 100%)" }}/>
    <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-xl font-black text-white text-sm" style={{ fontFamily:"Montserrat", background:"rgba(13,42,74,.65)" }}>🌳 Bosque Nativo</div>
    {[[10,35],[20,55],[35,42],[70,40],[82,58],[55,65],[15,70],[88,35]].map(([x,y],i) => (
      <div key={i} className="absolute pointer-events-none" style={{ left:`${x}%`, top:`${y}%`, transform:"translate(-50%,-50%)", fontSize:forestDone?32:24 }}>
        {forestDone?"🌳":"🪵"}
      </div>
    ))}
    {!forestDone && (
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10">
        <div className="text-center mb-2 text-white text-xs font-bold" style={{ fontFamily:"Nunito" }}>🌱 El bosque necesita árboles nuevos</div>
        <button onClick={onStartGame} className="px-6 py-3 rounded-2xl font-black text-white shadow-xl transition-all hover:scale-105 active:scale-95"
          style={{ fontFamily:"Montserrat", fontSize:14, background:`linear-gradient(135deg,${C.green},#1b5e20)`, boxShadow:"0 6px 20px rgba(46,125,50,.5)" }}>
          🌱 ¡Plantar árboles!
        </button>
      </div>
    )}
    {forestDone && (
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 text-center">
        <div className="px-4 py-2 rounded-xl text-white font-black text-sm mb-1" style={{ fontFamily:"Montserrat", background:"rgba(46,125,50,.8)" }}>✅ Bosque reforestado</div>
        <div className="text-white text-xs font-bold" style={{ fontFamily:"Nunito" }}>🐦🦋 ¡Los animales volvieron!</div>
      </div>
    )}
    <button onClick={onBack} className="absolute bottom-4 left-4 z-10 px-4 py-2 rounded-xl font-black text-white text-xs shadow-lg" style={{ fontFamily:"Montserrat", background:"rgba(13,42,74,.7)" }}>← Mapa</button>
  </div>;
}

// ─── ZONE: MINE ──────────────────────────────────────────────────────────────

function ZoneMine({ inv, talked, mineDone, onTalk, onCollect, onStartGame, onBack }: {
  inv: Set<string>; talked: Set<string>; mineDone: boolean;
  onTalk:(id:string)=>void; onCollect:(id:string)=>void; onStartGame:()=>void; onBack:()=>void;
}) {
  return <div className="flex-1 relative overflow-hidden">
    <div className="absolute inset-0" style={{ background:"linear-gradient(180deg,#546e7a 0%,#37474f 50%,#263238 100%)" }}/>
    <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-xl font-black text-white text-sm" style={{ fontFamily:"Montserrat", background:"rgba(0,0,0,.5)" }}>⛏ La Mina</div>
    {[[12,38],[28,52],[44,35],[60,50],[75,38],[88,54]].map(([x,y],i) => (
      <div key={i} className="absolute text-3xl pointer-events-none" style={{ left:`${x}%`, top:`${y}%`, transform:"translate(-50%,-50%)" }}>🪨</div>
    ))}
    <button onClick={() => onTalk("minero")}
      className="absolute cursor-pointer" style={{ left:"30%", top:"65%", transform:"translate(-50%,-50%)", zIndex:7 }}>
      <div className="relative flex flex-col items-center">
        {!talked.has("minero") && <div className="absolute -top-7 text-xs font-black px-2 py-0.5 rounded-full animate-bounce" style={{ background:C.gold, color:C.dark, fontFamily:"Montserrat", whiteSpace:"nowrap", fontSize:9 }}>¡Hablar!</div>}
        {talked.has("minero") && <div className="absolute -top-5 text-xs font-black px-1.5 py-0.5 rounded-full text-white" style={{ background:C.green, fontSize:9 }}>✓</div>}
        <div className="rounded-full flex items-center justify-center text-2xl" style={{ width:46,height:46,background:`${C.gold}22`,border:`2px solid ${C.gold}` }}>👷</div>
        <div className="mt-1 text-center px-1 py-0.5 rounded-md text-white font-bold" style={{ fontFamily:"Montserrat", fontSize:8, background:"rgba(0,0,0,.5)" }}>R. Sosa</div>
      </div>
    </button>
    {!inv.has("casco") && (
      <button onClick={() => onCollect("casco")} className="absolute z-8" style={{ left:"65%", top:"68%", transform:"translate(-50%,-50%)" }}>
        <div className="animate-bounce text-3xl" title="¡Recoger casco!">🪖</div>
      </button>
    )}
    {inv.has("casco") && <div className="absolute" style={{ left:"65%", top:"68%", transform:"translate(-50%,-50%)", opacity:.3, fontSize:28 }}>🪖</div>}
    {!mineDone && (
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10">
        <button onClick={onStartGame} className="px-6 py-3 rounded-2xl font-black text-white shadow-xl transition-all hover:scale-105 active:scale-95"
          style={{ fontFamily:"Montserrat", fontSize:14, background:"linear-gradient(135deg,#546e7a,#263238)", boxShadow:"0 6px 20px rgba(0,0,0,.4)" }}>
          ⛏ Explorar la mina
        </button>
      </div>
    )}
    {mineDone && <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-xl text-white font-black text-sm" style={{ fontFamily:"Montserrat", background:"rgba(0,0,0,.6)" }}>✅ Mina explorada · 💎 en inventario</div>}
    <button onClick={onBack} className="absolute bottom-4 left-4 z-10 px-4 py-2 rounded-xl font-black text-white text-xs shadow-lg" style={{ fontFamily:"Montserrat", background:"rgba(0,0,0,.5)" }}>← Mapa</button>
  </div>;
}

// ─── ZONE: LAB ───────────────────────────────────────────────────────────────

function ZoneLab({ inv, talked, labDone, onTalk, onCollect, onStartGame, onBack }: {
  inv:Set<string>; talked:Set<string>; labDone:boolean;
  onTalk:(id:string)=>void; onCollect:(id:string)=>void; onStartGame:()=>void; onBack:()=>void;
}) {
  return <div className="flex-1 relative overflow-hidden">
    <div className="absolute inset-0" style={{ background:"linear-gradient(180deg,#f3e5f5 0%,#ede7f6 50%,#e8eaf6 100%)" }}/>
    <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-xl font-black text-sm" style={{ fontFamily:"Montserrat", color:C.dark, background:"rgba(123,31,162,.15)" }}>🔬 Laboratorio del CONICET</div>
    {["🧪","⚗️","🔬","📊","🧫","💊"].map((ico,i)=>(
      <div key={i} className="absolute text-2xl pointer-events-none" style={{ left:`${[15,30,45,60,75,88][i]}%`, top:`${[40,55,38,52,42,58][i]}%`, transform:"translate(-50%,-50%)" }}>{ico}</div>
    ))}
    <button onClick={() => onTalk("cientifica")}
      className="absolute cursor-pointer" style={{ left:"55%", top:"68%", transform:"translate(-50%,-50%)", zIndex:7 }}>
      <div className="relative flex flex-col items-center">
        {!talked.has("cientifica") && <div className="absolute -top-7 text-xs font-black px-2 py-0.5 rounded-full animate-bounce" style={{ background:C.gold, color:C.dark, fontFamily:"Montserrat", whiteSpace:"nowrap", fontSize:9 }}>¡Hablar!</div>}
        {talked.has("cientifica") && <div className="absolute -top-5 text-xs font-black px-1.5 py-0.5 rounded-full text-white" style={{ background:C.green, fontSize:9 }}>✓</div>}
        <div className="rounded-full flex items-center justify-center text-2xl" style={{ width:46,height:46,background:"rgba(123,31,162,.15)",border:"2px solid #7b1fa2" }}>👩‍🔬</div>
        <div className="mt-1 text-center px-1 py-0.5 rounded-md font-bold" style={{ fontFamily:"Montserrat", fontSize:8, background:"rgba(245,245,255,.9)", color:C.dark }}>Dra. Fernández</div>
      </div>
    </button>
    {!inv.has("informe") && (
      <button onClick={() => onCollect("informe")} className="absolute z-8" style={{ left:"25%", top:"70%", transform:"translate(-50%,-50%)" }}>
        <div className="animate-bounce text-3xl" title="¡Recoger informe!">📄</div>
      </button>
    )}
    {inv.has("informe") && <div className="absolute" style={{ left:"25%", top:"70%", transform:"translate(-50%,-50%)", opacity:.3, fontSize:28 }}>📄</div>}
    {!labDone && inv.has("informe") && (
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10">
        <button onClick={onStartGame} className="px-6 py-3 rounded-2xl font-black text-white shadow-xl transition-all hover:scale-105 active:scale-95"
          style={{ fontFamily:"Montserrat", fontSize:14, background:"linear-gradient(135deg,#7b1fa2,#4a148c)", boxShadow:"0 6px 20px rgba(123,31,162,.4)" }}>
          🧪 Analizar la muestra
        </button>
      </div>
    )}
    {labDone && <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-xl text-white font-black text-sm" style={{ fontFamily:"Montserrat", background:"rgba(123,31,162,.7)" }}>✅ Análisis completado</div>}
    <button onClick={onBack} className="absolute bottom-4 left-4 z-10 px-4 py-2 rounded-xl font-black text-sm shadow-lg" style={{ fontFamily:"Montserrat", background:"rgba(123,31,162,.2)", color:"#7b1fa2" }}>← Mapa</button>
  </div>;
}

// ─── DECISION SCREEN ─────────────────────────────────────────────────────────

function DecisionScreen({ onDecide }: { onDecide: (eco: number, env: number, com: number) => void }) {
  const opts = [
    { label:"Aprobar con controles ambientales", icon:"🟢", tag:"Recomendado", tagC:C.green, bg:"#e8f5e9", border:C.green, eco:20, env:10, com:15 },
    { label:"Aprobar sin controles",             icon:"🟡", tag:"Arriesgado",  tagC:"#e6a800", bg:"#fffde7", border:C.gold, eco:30, env:-20, com:5 },
    { label:"Rechazar la mina",                  icon:"🔴", tag:"Conservador", tagC:C.red, bg:"#fce4ec", border:C.red, eco:-15, env:25, com:15 },
  ];
  return <div className="flex-1 flex flex-col overflow-auto">
    <FlagBar h={7}/>
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 gap-4" style={{ background:`linear-gradient(135deg,${C.blue}18 0%,white 50%,${C.gold}12 100%)` }}>
      <SolDeMayo size={54}/>
      <div className="font-black text-center" style={{ fontFamily:"Montserrat", fontSize:"clamp(1.3rem,5vw,1.8rem)", color:C.dark }}>Decisión Final</div>
      <div className="text-sm text-center max-w-xs" style={{ fontFamily:"Nunito", color:"#3a6080" }}>Ya exploraste Villa Verde. ¿Qué le recomendás al intendente?</div>
      {opts.map((o,i) => (
        <button key={i} onClick={() => onDecide(o.eco, o.env, o.com)}
          className="w-full max-w-sm rounded-2xl p-4 text-left shadow-md transition-all hover:shadow-xl hover:-translate-y-0.5 active:scale-98"
          style={{ background:o.bg, border:`2px solid ${o.border}` }}>
          <div className="flex items-start gap-3">
            <span className="text-2xl mt-0.5">{o.icon}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-sm" style={{ fontFamily:"Montserrat", color:C.dark }}>{o.label}</span>
                <span className="text-xs font-bold text-white px-2 py-0.5 rounded-full" style={{ background:o.tagC }}>{o.tag}</span>
              </div>
              <div className="text-xs mt-1" style={{ fontFamily:"Nunito", color:"#3a6080" }}>
                Economía {o.eco>0?"+":""}{o.eco} · Ambiente {o.env>0?"+":""}{o.env} · Comunidad {o.com>0?"+":""}{o.com}
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
    <FlagBar h={7}/>
  </div>;
}

// ─── ENDING SCREEN ───────────────────────────────────────────────────────────

function EndingScreen({ eco, env, com, xp, achs, onRestart }: { eco:number; env:number; com:number; xp:number; achs:Set<string>; onRestart:()=>void }) {
  const type = eco >= 60 && env >= 60 && com >= 60 ? "green" : eco >= 60 && env < 50 ? "industrial" : "crisis";
  const configs = {
    green:      { stars:"⭐⭐⭐⭐⭐", title:"¡Ciudad Verde!", subtitle:"Empleo · Bosque · Agua limpia", desc:"Lograste el equilibrio perfecto entre desarrollo económico y cuidado del ambiente. ¡Villa Verde es un ejemplo para el país!", bg:"#e8f5e9", border:C.green, emoji:"🏆🌳💧" },
    industrial: { stars:"⭐⭐⭐",     title:"Ciudad Industrial", subtitle:"Empleo · Contaminación",     desc:"La economía creció, pero la falta de controles generó conflictos ambientales. El municipio deberá resolver los daños.", bg:"#fff8e1", border:C.gold, emoji:"🏭⚠️" },
    crisis:     { stars:"⭐",         title:"Villa en Crisis",   subtitle:"Río contaminado · Protesta", desc:"Los vecinos protestan y el río está contaminado. La empresa amenaza con irse. Fue difícil, pero todavía hay tiempo para cambiar.", bg:"#fce4ec", border:C.red, emoji:"😔🌧" },
  };
  const cfg = configs[type];
  if (type === "green" && !achs.has("sostenible")) achs.add("sostenible");
  return <div className="flex-1 flex flex-col overflow-auto">
    <FlagBar h={7}/>
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 gap-4 text-center" style={{ background:`linear-gradient(135deg,${cfg.bg},white)` }}>
      <div className="text-5xl">{cfg.emoji}</div>
      <div className="text-3xl">{cfg.stars}</div>
      <div className="font-black" style={{ fontFamily:"Montserrat", fontSize:"clamp(1.4rem,6vw,2rem)", color:C.dark }}>{cfg.title}</div>
      <div className="font-bold text-sm" style={{ fontFamily:"Montserrat", color:"#3a6080" }}>{cfg.subtitle}</div>
      <div className="max-w-xs rounded-2xl p-4 shadow-lg" style={{ background:"rgba(255,255,255,.85)", border:`2px solid ${cfg.border}` }}>
        <div className="flex justify-around mb-3">
          <div className="text-center"><div className="font-black text-lg" style={{ color:C.gold }}>{eco}</div><div className="text-xs" style={{ fontFamily:"Nunito", color:"#3a6080" }}>💰 Economía</div></div>
          <div className="text-center"><div className="font-black text-lg" style={{ color:C.green }}>{env}</div><div className="text-xs" style={{ fontFamily:"Nunito", color:"#3a6080" }}>🌳 Ambiente</div></div>
          <div className="text-center"><div className="font-black text-lg" style={{ color:C.blue }}>{com}</div><div className="text-xs" style={{ fontFamily:"Nunito", color:"#3a6080" }}>👥 Comunidad</div></div>
        </div>
        <div className="font-black text-lg mb-1" style={{ color:C.gold }}>⭐ {xp} XP</div>
        <p className="text-sm leading-relaxed" style={{ fontFamily:"Nunito", color:"#3a6080" }}>{cfg.desc}</p>
      </div>
      {achs.size > 0 && (
        <div className="max-w-xs w-full">
          <div className="font-black text-sm mb-2" style={{ fontFamily:"Montserrat", color:C.dark }}>🏆 Logros obtenidos</div>
          <div className="flex flex-wrap justify-center gap-2">
            {[...achs].map(a => ACHS[a] && (
              <div key={a} className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold" style={{ background:`${C.gold}22`, color:C.dark, fontFamily:"Nunito" }}>
                {ACHS[a].icon} {ACHS[a].title}
              </div>
            ))}
          </div>
        </div>
      )}
      <button onClick={onRestart} className="font-black rounded-2xl px-8 py-3 shadow-xl transition-all hover:scale-105 active:scale-95"
        style={{ fontFamily:"Montserrat", fontSize:15, background:`linear-gradient(135deg,${C.blue},#5b93c7)`, color:"white", boxShadow:`0 6px 20px ${C.blue}55` }}>
        🔄 JUGAR DE NUEVO
      </button>
    </div>
    <FlagBar h={7}/>
  </div>;
}

// ─── APP ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [zone, setZone]         = useState<Zone>("intro");
  const [xp, setXp]             = useState(0);
  const [coins, setCoins]       = useState(50);
  const [eco, setEco]           = useState(35);
  const [env, setEnv]           = useState(35);
  const [com, setCom]           = useState(35);
  const [mission, setMission]   = useState(0);
  const [inv, setInv]           = useState<Set<string>>(new Set());
  const [talked, setTalked]     = useState<Set<string>>(new Set());
  const [bought, setBought]     = useState<Set<string>>(new Set());
  const [achs, setAchs]         = useState<Set<string>>(new Set());
  const [toast, setToast]       = useState<string | null>(null);
  const [activeNPC, setNPC]     = useState<string | null>(null);
  const [dialogLine, setDLine]  = useState(0);
  const [event, setEvent]       = useState<string | null>(null);
  const [shopOpen, setShop]     = useState(false);
  const [minigame, setMinigame] = useState<string | null>(null);
  const [riverDone, setRDone]   = useState(false);
  const [forestDone, setFDone]  = useState(false);
  const [mineDone, setMDone]    = useState(false);
  const [labDone, setLDone]     = useState(false);
  const [seenEvents, setSeen]   = useState<Set<string>>(new Set());

  const addXp = useCallback((n: number) => setXp(p => p + n), []);
  const addStats = useCallback((e: number, en: number, c: number, co = 0) => {
    setEco(p => clamp(p + e));
    setEnv(p => clamp(p + en));
    setCom(p => clamp(p + c));
    setCoins(p => Math.max(0, p + co));
  }, []);
  const unlockAch = useCallback((id: string) => {
    setAchs(prev => { if (prev.has(id)) return prev; const n = new Set(prev); n.add(id); setToast(id); return n; });
  }, []);
  const advanceMission = useCallback((to: number) => {
    setMission(m => Math.max(m, to));
  }, []);

  // Trigger random events based on progress
  useEffect(() => {
    if (mission >= 3 && !seenEvents.has("expansion")) {
      setSeen(p => new Set([...p, "expansion"]));
      setEvent("expansion");
    }
    if (riverDone && !seenEvents.has("lluvia")) {
      setSeen(p => new Set([...p, "lluvia"]));
      setEvent("lluvia");
    }
  }, [mission, riverDone, seenEvents]);

  // Check coleccionista
  useEffect(() => {
    if (inv.size >= 4) unlockAch("coleccionista");
  }, [inv, unlockAch]);

  const handleTalk = (npcId: string) => {
    setNPC(npcId);
    setDLine(0);
  };

  const handleDialogClose = () => {
    const id = activeNPC!;
    setTalked(prev => new Set([...prev, id]));
    setNPC(null);
    if (id === "intendente" && mission === 0) { advanceMission(1); addXp(50); addStats(5, 0, 5); unlockAch("primer_paso"); }
    if (id === "cientifica" && mission === 4)  { advanceMission(5); addXp(50); addStats(0, 5, 10); }
  };

  const handleCollect = (itemId: string) => {
    if (inv.has(itemId)) return;
    setInv(prev => new Set([...prev, itemId]));
    if (itemId === "casco") { addXp(30); addStats(5, 0, 5); advanceMission(Math.max(2, mission)); unlockAch("explorador"); }
    if (itemId === "informe") { addXp(40); addStats(0, 5, 5); advanceMission(Math.max(4, mission)); unlockAch("investigador"); }
    if (itemId === "mineral") { addXp(20); addStats(10, 0, 0); }
    if (itemId === "muestra") { addXp(20); addStats(0, 5, 5); }
    setToast(null);
  };

  const handleMineComplete = () => {
    setMinigame(null);
    setMDone(true);
    addXp(20); addStats(15, 0, 0);
    setInv(prev => new Set([...prev, "mineral"]));
    advanceMission(Math.max(2, mission));
  };

  const handleRiverComplete = () => {
    setMinigame(null);
    setRDone(true);
    addXp(80); addStats(0, 15, 10);
    setInv(prev => new Set([...prev, "agua_limpia"]));
    advanceMission(Math.max(6, mission));
    unlockAch("guardian");
  };

  const handleForestComplete = () => {
    setMinigame(null);
    setFDone(true);
    addXp(60); addStats(0, 15, 5);
    setInv(prev => new Set([...prev, "semillas"]));
    advanceMission(7);
    unlockAch("reforestador");
  };

  const handleLabComplete = (correct: boolean) => {
    setMinigame(null);
    setLDone(true);
    if (correct) { addXp(50); addStats(0, 10, 10); }
    else { addXp(20); }
    setInv(prev => new Set([...prev, "muestra"]));
    advanceMission(Math.max(5, mission));
  };

  const handleDecide = (de: number, dv: number, dc: number) => {
    addXp(200); addStats(de, dv, dc);
    setZone("ending");
  };

  const handleBuy = (id: string, e: number, v: number, c: number, cost: number) => {
    setBought(prev => new Set([...prev, id]));
    addStats(e, v, c, -cost);
  };

  const handleEvent = (e: number, v: number, c: number, co: number) => {
    addStats(e, v, c, co);
    setEvent(null);
  };

  const handleRestart = () => {
    setZone("intro"); setXp(0); setCoins(50); setEco(35); setEnv(35); setCom(35);
    setMission(0); setInv(new Set()); setTalked(new Set()); setBought(new Set());
    setAchs(new Set()); setToast(null); setNPC(null); setDLine(0); setEvent(null);
    setShop(false); setMinigame(null); setRDone(false); setFDone(false); setMDone(false); setLDone(false); setSeen(new Set());
  };

  const showHUD = zone !== "intro" && zone !== "ending";

  return (
    <div className="relative flex flex-col overflow-hidden" style={{ fontFamily:"Nunito", maxWidth:600, margin:"0 auto", height:"100dvh" }}>
      {zone === "intro" && <ZoneIntro onStart={() => setZone("map")}/>}

      {showHUD && (
        <HUD xp={xp} coins={coins} eco={eco} env={env} com={com} mission={mission}
          onMap={() => { if (!minigame) setZone("map"); }}
          onShop={() => setShop(true)}/>
      )}

      {zone === "map"      && <ZoneMap currentMission={mission} onGo={setZone} onDecide={() => setZone("decision")}/>}
      {zone === "town"     && <ZoneTown talked={talked} onTalk={handleTalk} onBack={() => setZone("map")}/>}
      {zone === "river"    && !minigame && <ZoneRiver riverDone={riverDone} talked={talked} onTalk={handleTalk} onStartGame={() => setMinigame("river")} onBack={() => setZone("map")}/>}
      {zone === "forest"   && !minigame && <ZoneForest forestDone={forestDone} onStartGame={() => setMinigame("forest")} onBack={() => setZone("map")}/>}
      {zone === "mine"     && !minigame && <ZoneMine inv={inv} talked={talked} mineDone={mineDone} onTalk={handleTalk} onCollect={handleCollect} onStartGame={() => setMinigame("mine")} onBack={() => setZone("map")}/>}
      {zone === "lab"      && !minigame && <ZoneLab inv={inv} talked={talked} labDone={labDone} onTalk={handleTalk} onCollect={handleCollect} onStartGame={() => setMinigame("lab")} onBack={() => setZone("map")}/>}
      {zone === "decision" && <DecisionScreen onDecide={handleDecide}/>}
      {zone === "ending"   && <EndingScreen eco={eco} env={env} com={com} xp={xp} achs={achs} onRestart={handleRestart}/>}

      {/* Minigames */}
      {minigame === "river"  && <div className="absolute inset-0 z-30"><RiverMinigame  onComplete={handleRiverComplete}/></div>}
      {minigame === "forest" && <div className="absolute inset-0 z-30"><ForestMinigame onComplete={handleForestComplete}/></div>}
      {minigame === "mine"   && <div className="absolute inset-0 z-30"><MineMinigame   onComplete={handleMineComplete}/></div>}
      {minigame === "lab"    && <div className="absolute inset-0 z-30"><LabMinigame    onComplete={handleLabComplete}/></div>}

      {/* Overlays */}
      {activeNPC && <DialogBox npcId={activeNPC} line={dialogLine} onNext={() => setDLine(l => l+1)} onClose={handleDialogClose}/>}
      {event && !activeNPC && <EventModal evId={event} onChoice={handleEvent}/>}
      {shopOpen && !activeNPC && !event && <ShopModal coins={coins} bought={bought} onBuy={handleBuy} onClose={() => setShop(false)}/>}
      {toast && <AchToast id={toast} onDone={() => setToast(null)}/>}
    </div>
  );
}
