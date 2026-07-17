import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Import team photos
import sumithImg from './assets/sumith.jpg';
import rajamaranImg from './assets/rajamaran.jpg';
import leharinImg from './assets/leharin.jpg';

// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

const logMessages = [
  "[BOOT] Initializing ESP32-S3 Core...",
  "[BOOT] Checking peripheral pin bindings...",
  "[HW] GPIO 16/17 not detected. Remapping bus to GPIO 21/22...",
  "[HW] Dual S3KM1110 24GHz mmWave Radar online.",
  "[BOOT] Opening Pi 5 UART link on GPIO 26/27 (115200 bps)...",
  "[VISION] Instantiating dual-model YOLOv8 inference engines...",
  "[FUSION] Multi-sensor AND logic activated. System status: OK."
];

// 1. F1 Start Lights Preloader Component with system logs
function Preloader({ onComplete }) {
  const [activeLights, setActiveLights] = useState(0);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // Light igniting loop
    const lightInterval = setInterval(() => {
      setActiveLights((prev) => {
        if (prev < 5) {
          // Add a log for each light
          setLogs((currLogs) => [...currLogs, logMessages[prev]]);
          return prev + 1;
        } else {
          clearInterval(lightInterval);
          // Show the final system ready logs
          setTimeout(() => {
            setLogs((currLogs) => [...currLogs, logMessages[5], logMessages[6]]);
          }, 200);

          setTimeout(() => {
            setActiveLights(0);
            // Trigger diagonal clip-path mask wipe animation
            gsap.to('#preloader', {
              duration: 0.8,
              clipPath: 'polygon(0% 0%, 100% 0%, 0% 0%, 0% 0%)',
              ease: 'power4.inOut',
              onComplete: onComplete,
            });
          }, 1200);
          return prev;
        }
      });
    }, 400);

    return () => clearInterval(lightInterval);
  }, [onComplete]);

  return (
    <div
      id="preloader"
      className="fixed inset-0 bg-[#0d0e10] z-[100] flex flex-col justify-center items-center font-mono"
      style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' }}
    >
      <div className="w-[500px] bg-[#16171a] border border-[#2e3238] p-6 rounded shadow-2xl flex flex-col gap-6 relative">
        <div className="absolute top-2 left-2 text-[8px] text-neutral-500 uppercase tracking-widest">BOOT SEQUENCE // GHOSTTRACK</div>
        
        {/* Lights Row */}
        <div className="flex gap-4 justify-between bg-[#121315] p-5 rounded border border-[#2e3238] mt-2">
          {[1, 2, 3, 4, 5].map((light) => (
            <div key={light} className="flex flex-col gap-1 items-center">
              <div
                className={`w-10 h-10 rounded-full border border-neutral-800 transition-all duration-300 ${
                  activeLights >= light
                    ? 'bg-[#d97706] shadow-[0_0_15px_#d97706]'
                    : 'bg-[#1a1c20]'
                }`}
              />
              <span className="text-[7px] text-neutral-600">0{light}</span>
            </div>
          ))}
        </div>

        {/* Diagnostic Logs Window */}
        <div className="bg-[#121315] border border-[#2e3238] p-4 rounded h-[120px] overflow-hidden flex flex-col justify-end text-[10px] text-neutral-450 leading-relaxed font-mono">
          <div className="overflow-y-auto space-y-1">
            {logs.map((log, idx) => (
              <div key={idx} className={log.includes('[!]') || log.includes('not detected') ? 'text-[#d97706]' : log.includes('online') || log.includes('OK') ? 'text-green-500' : 'text-neutral-400'}>
                {log}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center text-[9px] text-neutral-500 uppercase tracking-[0.2em] border-t border-[#2e3238] pt-3">
          <span>{activeLights < 5 ? 'GRID IGNITING SYSTEM' : 'SYSTEM DEPLOYED'}</span>
          <span>VAL_186</span>
        </div>
      </div>
    </div>
  );
}

// 2. Persistent Truck HUD Vector Component (Styled with dark-theme slate and amber warning strokes)
function TruckHUD() {
  return (
    <div
      id="fixed-truck-container"
      className="fixed left-[4vw] top-1/2 -translate-y-1/2 w-[34vw] h-[48vh] z-30 pointer-events-none flex items-center justify-center text-[#2e3238] transition-colors duration-500"
    >
      <svg
        id="truck-svg"
        className="w-full h-full max-w-lg"
        viewBox="0 0 420 220"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        {/* Haptic Wave Indicators (Steering wheel quadrant highlights) - Structural scale reveal */}
        <g id="haptic-waves" className="transition-transform duration-300" style={{ transform: 'scale(0)', transformOrigin: '245px 110px' }}>
          <path d="M 230,103 A 15,15 0 0,0 230,123" stroke="#d97706" strokeWidth="3" strokeLinecap="round" />
          <path d="M 235,100 A 20,20 0 0,0 235,126" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2,2" />
          <path d="M 260,103 A 15,15 0 0,1 260,123" stroke="#d97706" strokeWidth="3" strokeLinecap="round" />
          <path d="M 255,100 A 20,20 0 0,1 255,126" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2,2" />
        </g>

        {/* Radar Arcs - Structural scale reveal */}
        <g id="radar-arcs" className="transition-transform duration-300" style={{ transform: 'scale(0)', transformOrigin: '140px 110px' }}>
          <path d="M 140,40 A 50,50 0 0,0 90,110 A 50,50 0 0,0 140,180" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeDasharray="4,4" />
          <path d="M 140,40 A 50,50 0 0,1 190,110 A 50,50 0 0,1 140,180" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeDasharray="4,4" />
        </g>

        {/* Explodable truck parts */}
        <g id="truck-assembly" className="transition-colors duration-300 text-neutral-600">
          {/* Chassis base structure */}
          <g id="part-chassis">
            <rect x="80" y="95" width="260" height="30" rx="3" fill="none" strokeWidth="1.5" />
            <line x1="80" y1="110" x2="340" y2="110" strokeDasharray="3,3" />
          </g>
          
          {/* Large Indian Trailer bed */}
          <g id="part-trailer" className="transition-transform duration-300">
            <rect x="90" y="68" width="150" height="84" rx="2" fill="none" strokeWidth="2" />
            <line x1="120" y1="68" x2="120" y2="152" />
            <line x1="150" y1="68" x2="150" y2="152" />
            <line x1="180" y1="68" x2="180" y2="152" />
            <line x1="210" y1="68" x2="210" y2="152" />
            <text x="165" y="115" fontFamily="JetBrains Mono" fontSize="7" letterSpacing="1.5" stroke="none" fill="currentColor" textAnchor="middle" fontWeight="bold">CARGO BED</text>
          </g>

          {/* Driver Cab */}
          <g id="part-cab" className="transition-transform duration-300">
            <rect x="245" y="73" width="70" height="74" rx="6" fill="none" strokeWidth="2" />
            <path d="M 285,78 L 305,88 L 305,132 L 285,142 Z" />
            <circle id="part-steering" cx="265" cy="110" r="9" strokeWidth="1.8" />
            <line x1="265" y1="101" x2="265" y2="119" />
            <line x1="256" y1="110" x2="274" y2="110" />
          </g>

          {/* Wheels (Left) */}
          <g id="part-wheels-left" className="transition-transform duration-300">
            <rect x="110" y="58" width="28" height="10" rx="1" fill="none" />
            <rect x="150" y="58" width="28" height="10" rx="1" fill="none" />
            <rect x="270" y="58" width="24" height="10" rx="1" fill="none" />
          </g>
          
          {/* Wheels (Right) */}
          <g id="part-wheels-right" className="transition-transform duration-300">
            <rect x="110" y="152" width="28" height="10" rx="1" fill="none" />
            <rect x="150" y="152" width="28" height="10" rx="1" fill="none" />
            <rect x="270" y="152" width="24" height="10" rx="1" fill="none" />
          </g>
        </g>

        {/* Camera Module Points - Structural scale reveal */}
        <g id="camera-nodes" className="transition-transform duration-300" style={{ transform: 'scale(0)', transformOrigin: '248px 110px' }}>
          <circle id="cam-fl" cx="248" cy="70" r="5.5" fill="#d97706" stroke="none" />
          <line x1="248" y1="70" x2="228" y2="55" stroke="#d97706" strokeWidth="1.5" />
          <circle id="cam-fr" cx="248" cy="150" r="5.5" fill="#d97706" stroke="none" />
          <line x1="248" y1="150" x2="228" y2="165" stroke="#d97706" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

// 3. Main Application Component
export default function App() {
  const [showPreloader, setShowPreloader] = useState(true);
  const containerRef = useRef(null);
  const trackRef = useRef(null);

  useEffect(() => {
    if (showPreloader) return;

    const container = containerRef.current;
    const track = trackRef.current;
    
    // Core master ScrollTrigger timeline driven by natural vertical page scroll pinned at top
    const masterTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: 'top top',
        end: () => '+=' + (15 * window.innerWidth),
        pin: true,
        scrub: 0.5,
        invalidateOnRefresh: true,
      }
    });

    // 1. Horizontal track movement: translating full screen panels linearly
    masterTimeline.to(track, {
      xPercent: -1500, // Translates 15 panels left (16 screens total)
      ease: 'none',
      duration: 15,
    }, 0);

    // 2. Parallax background elements movement
    masterTimeline.to('.bg-grid-parallax', {
      x: '-35vw',
      ease: 'none',
      duration: 15,
    }, 0);

    // 3. Pinned Truck HUD Coordinated States
    // Screen 0 & 1: Sits on the right half
    masterTimeline.set('#fixed-truck-container', { x: 520, y: 0, scale: 0.95, rotation: 0, color: '#2e3238' }, 0);

    // Screen 2 (Phase 1): Scales up centrally; perimeter nodes flash amber to spotlight radar array
    masterTimeline.to('#fixed-truck-container', { x: 0, y: 0, scale: 1.35, rotation: 0, color: '#ffffff', ease: 'power2.inOut', duration: 1.0 }, 1.2);
    masterTimeline.to('#radar-arcs', { scale: 1, duration: 0.4, ease: 'back.out(1.7)' }, 1.4);
    masterTimeline.to('#radar-arcs', { strokeWidth: 4, repeat: 3, yoyo: true, duration: 0.2 }, 1.6);
    masterTimeline.to('#radar-arcs', { strokeWidth: 2, duration: 0.1 }, 2.2);

    // Screen 3 (Phase 2): Steps left, opening screen space for firmware remapping vector cards
    masterTimeline.to('#fixed-truck-container', { x: -180, y: 10, scale: 1.2, rotation: 8, color: '#475569', ease: 'power2.inOut', duration: 1.0 }, 2.4);
    masterTimeline.to('#radar-arcs', { scale: 0, duration: 0.3 }, 2.4);

    // Screen 4 & 5 (Phase 3 & 4): Context switches. Truck color becomes amber/white
    masterTimeline.to('#fixed-truck-container', { x: 280, y: -10, scale: 1.05, rotation: -5, color: '#ffffff', ease: 'power2.inOut', duration: 1.0 }, 3.8);

    // Screen 6 & 7 (Phase 5 & 6): Truck shows camera optical nodes and haptic waves
    masterTimeline.to('#fixed-truck-container', { x: -150, y: 20, scale: 1.3, rotation: -10, color: '#ffffff', ease: 'power2.inOut', duration: 1.2 }, 5.5);
    masterTimeline.to('#camera-nodes', { scale: 1, duration: 0.3, ease: 'back.out(1.7)' }, 5.8);
    masterTimeline.to('#haptic-waves', { scale: 1, duration: 0.3, ease: 'back.out(1.7)' }, 5.8);

    // Screen 8 & 9 (Phase 7 & 8): Truck minimizes slightly to let logic tables and UART diagrams frame columns
    masterTimeline.to('#fixed-truck-container', { x: 300, y: 80, scale: 0.75, rotation: 5, color: '#475569', ease: 'power2.inOut', duration: 1.0 }, 7.5);
    masterTimeline.to('#camera-nodes', { scale: 0, duration: 0.3 }, 7.5);
    masterTimeline.to('#haptic-waves', { scale: 0, duration: 0.3 }, 7.5);

    // Screen 10 (Phase 9): Truck structure executes an exploded layout shift (7 pieces)
    masterTimeline.to('#fixed-truck-container', { x: 0, y: 0, scale: 1.1, rotation: 0, color: '#d97706', ease: 'power2.inOut', duration: 1.0 }, 9.5);
    // Explode pieces
    masterTimeline.to('#part-cab', { x: 35, y: -20, duration: 0.8, ease: 'power2.out' }, 9.8);
    masterTimeline.to('#part-trailer', { x: -40, y: 15, duration: 0.8, ease: 'power2.out' }, 9.8);
    masterTimeline.to('#part-wheels-left', { y: -25, duration: 0.8, ease: 'power2.out' }, 9.8);
    masterTimeline.to('#part-wheels-right', { y: 25, duration: 0.8, ease: 'power2.out' }, 9.8);

    // Reset exploded pieces for the tables section
    masterTimeline.to('#part-cab', { x: 0, y: 0, duration: 0.6, ease: 'power2.inOut' }, 10.7);
    masterTimeline.to('#part-trailer', { x: 0, y: 0, duration: 0.6, ease: 'power2.inOut' }, 10.7);
    masterTimeline.to('#part-wheels-left', { y: 0, duration: 0.6, ease: 'power2.inOut' }, 10.7);
    masterTimeline.to('#part-wheels-right', { y: 0, duration: 0.6, ease: 'power2.inOut' }, 10.7);

    // Screen 11 to 14: Truck anchors uniformly as a technical blueprint icon (rotated -90 deg)
    masterTimeline.to('#fixed-truck-container', { x: -160, y: 120, scale: 0.65, rotation: -90, color: '#334155', ease: 'power2.inOut', duration: 0.8 }, 10.8);

    // Screen 15 (Quote): Pinned systems slide away cleanly to the left over the axis timeline
    masterTimeline.to('#fixed-truck-container', { x: -700, scale: 0.5, ease: 'power2.in', duration: 0.8 }, 14.8);

    // 4. Staggered Grid Card Physical Vertical Lift (Solid Lift, No Opacity Fades)
    for (let i = 1; i <= 15; i++) {
      const panel = document.getElementById(`panel-${i}`);
      if (panel) {
        const cards = panel.querySelectorAll('.card-reveal');
        cards.forEach((card, cardIdx) => {
          masterTimeline.fromTo(card,
            { y: 200 },
            { y: 0, ease: 'power2.out', duration: 0.8 },
            (i - 1) + cardIdx * 0.15
          );
        });

        // Staggered text reveals
        const textElements = panel.querySelectorAll('.text-reveal');
        if (textElements.length > 0) {
          masterTimeline.from(textElements, {
            y: 35,
            stagger: 0.1,
            duration: 0.8,
            ease: 'power2.out',
          }, (i - 1) + 0.15);
        }
      }
    }

    // 5. Special Stage-linked elements
    // Screen 1: Timeline axis amber progress bar
    const axis = document.getElementById('timeline-axis-container');
    if (axis) {
      masterTimeline.fromTo('#timeline-amber-progress',
        { width: '0%' },
        { width: '100%', ease: 'none', duration: 0.8 },
        1.0
      );
    }

    // Screen 2: Callout box border and size adjustments
    const callout1 = document.getElementById('callout-v1');
    if (callout1) {
      masterTimeline.to('#callout-v1', { borderStyle: 'dashed', borderColor: '#475569', duration: 0.4 }, 2.0);
      masterTimeline.to('#callout-v2', { borderColor: '#d97706', borderWidth: 2, duration: 0.4 }, 2.4);
    }

    // Screen 4: Rolling number dataset image counter
    const counter = document.getElementById('dataset-image-counter');
    if (counter) {
      const counterObj = { val: 46 };
      masterTimeline.to(counterObj, {
        val: 8570,
        roundProps: 'val',
        duration: 1.2,
        ease: 'power3.out',
        onUpdate: () => {
          const countEl = document.getElementById('dataset-image-counter');
          if (countEl) countEl.textContent = Math.round(counterObj.val).toLocaleString();
        }
      }, 4.0);
    }

    // Screen 11 & 12: Tables reveal
    const tableCols = gsap.utils.toArray('.table-col-anim');
    tableCols.forEach((col, idx) => {
      const parentPanel = col.closest('[id^="panel-"]');
      if (parentPanel) {
        const panelId = parentPanel.id;
        const panelNum = parseInt(panelId.split('-')[1]);
        masterTimeline.to(col, {
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
        }, (panelNum - 1) + idx * 0.12);
      }
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [showPreloader]);

  return (
    <div className="font-sans antialiased bg-[#121315] w-full min-h-screen relative text-white">
      
      {showPreloader && <Preloader onComplete={() => setShowPreloader(false)} />}
      
      {/* 2. System Canvas Wrapper (Pinned by ScrollTrigger) */}
      <div ref={containerRef} className="w-screen h-screen overflow-hidden relative bg-[#121315] z-10 flex flex-col justify-between">
        
        {/* Viewport Warning Borders - Asymmetrical Industrial Dashboard styling */}
        <div className="kerb-border h-[8px] w-full absolute top-0 left-0 z-50"></div>
        <div className="kerb-border h-[8px] w-full absolute bottom-0 left-0 z-50"></div>

        {/* Sticky Vector HUD Layer */}
        <TruckHUD />

        {/* Parallax background grid lines overlay */}
        <div className="bg-grid-parallax dot-grid absolute inset-0 pointer-events-none opacity-40 z-10 w-[200vw]"></div>

        {/* Horizontal Moving Track */}
        <div ref={trackRef} className="scroll-track flex h-full flex-row overflow-hidden w-fit relative bg-[#121315]">

          {/* STAGE 0: HERO SPLASH SCREEN */}
          <div id="panel-0" className="w-screen h-screen flex-shrink-0 relative box-border px-20 py-24 bg-[#121315] flex items-center justify-start border-r border-[#2e3238] tech-grid">
            <div className="w-[50vw] z-20 space-y-6">
              <span className="font-mono text-xs uppercase tracking-[0.32em] text-[#d97706] font-bold block bg-[#d97706]/10 border border-[#d97706]/30 px-3 py-1.5 w-fit rounded">
                AIS-186 SYSTEM REPORT
              </span>
              <div className="space-y-1">
                <h1 className="font-sans text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-none uppercase">
                  GhostTrack:<br /><span className="text-[#d97706]">The Journey</span>
                </h1>
                <p className="font-mono text-sm tracking-wider text-neutral-400 mt-4">
                  From a Problem Statement to a Working Blind-Spot Safety System
                </p>
              </div>

              {/* Launcher Button for Driver Companion App */}
              <div className="pt-2">
                <a 
                  href="?mode=companion" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.15em] bg-gradient-to-r from-[#d97706] to-[#b45309] hover:from-[#f59e0b] hover:to-[#d97706] text-black font-black px-5 py-3.5 rounded shadow-[0_0_15px_rgba(217,119,6,0.35)] transition-all group cursor-pointer border border-[#d97706]/40"
                >
                  <span>Launch Driver Companion App</span>
                  <svg className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </a>
              </div>

              <div className="border-t border-[#2e3238] pt-6 flex flex-col gap-2">
                <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">// DEVELOPMENT CREW</span>
                <p className="font-mono text-[11px] text-neutral-300">
                  Sumith, Rajamaran, Leharin
                </p>
                <p className="font-mono text-[10px] text-[#d97706] font-bold uppercase tracking-wider">
                  AMET UNIVERSITY, CHENNAI
                </p>
              </div>
            </div>
            
            {/* Architectural Grid Tag watermark */}
            <div className="absolute bottom-12 right-12 font-mono text-[9px] text-[#2e3238] border border-[#2e3238]/60 p-4 space-y-1 hidden md:block">
              <div>DOC_ID: GT-2026-X186</div>
              <div>SHEET: 00 // COVER PANEL</div>
              <div>SCALE: NOT TO SCALE</div>
            </div>
          </div>

          {/* STAGE 1: THE INITIAL CRITICAL CONTEXT */}
          <div id="panel-1" className="w-screen h-screen flex-shrink-0 relative box-border px-20 py-24 bg-[#121315] flex items-center justify-start border-r border-[#2e3238]">
            {/* Watermark Section Indicator */}
            <div className="absolute top-12 right-20 text-[120px] font-sans font-black text-neutral-800/10 select-none pointer-events-none">01</div>
            
            <div className="card-reveal w-[52vw] bg-[#16171a] border border-[#2e3238] p-10 shadow-2xl z-20 rounded relative">
              <div className="absolute top-0 left-6 -translate-y-1/2 bg-[#d97706] text-black font-mono text-[9px] px-2 py-0.5 uppercase tracking-wider font-bold">
                01 / The Problem We Started With
              </div>
              <div className="text-reveal font-mono text-xs text-neutral-300 space-y-4 leading-relaxed mt-2">
                <p>
                  Over 10 million heavy commercial vehicles operate on Indian roads with almost no blind-spot protection. Existing systems — proximity sensors, basic cameras — either lack intelligence or are too expensive for Indian fleet operators to adopt. With India's AIS-186 BSIS mandate approaching in April 2026, the timing created a real window to build something that could genuinely help.
                </p>
                <p>
                  We didn't start with a solution. We started with a technical concept document, three team members with basic Python knowledge, and no trained model, no dataset, no working hardware, and no certainty about which components we'd even be given. Everything else in this document is what happened between that starting point and a working system.
                </p>
              </div>
              
              {/* Horizontal Timeline Progress */}
              <div className="text-reveal w-full h-[1px] bg-[#2e3238] mt-8 relative flex items-center" id="timeline-axis-container">
                <div className="h-[6px] w-[6px] rounded-full bg-[#d97706] absolute left-0">
                  <span className="absolute top-3 left-0 font-mono text-[8px] font-bold text-neutral-500 whitespace-nowrap">START: CONCEPT DOCUMENT</span>
                </div>
                <div className="h-[6px] w-[6px] rounded-full bg-neutral-600 absolute right-0">
                  <span className="absolute bottom-3 right-0 font-mono text-[8px] font-bold text-[#d97706] whitespace-nowrap">MANDATE: APRIL 2026</span>
                </div>
                <div className="h-[1px] bg-[#d97706] w-0" id="timeline-amber-progress"></div>
              </div>
            </div>
          </div>

          {/* STAGE 2: PHASE 1 — THE COMPONENT MISMATCH */}
          <div id="panel-2" className="w-screen h-screen flex-shrink-0 relative box-border px-20 py-24 bg-[#121315] flex items-center justify-end border-r border-[#2e3238]">
            <div className="absolute top-12 left-20 text-[120px] font-sans font-black text-neutral-800/10 select-none pointer-events-none">02</div>
            
            <div className="card-reveal w-[52vw] bg-[#16171a] border border-[#2e3238] p-10 shadow-2xl z-20 rounded relative">
              <div className="absolute top-0 left-6 -translate-y-1/2 bg-[#d97706] text-black font-mono text-[9px] px-2 py-0.5 uppercase tracking-wider font-bold">
                02 / Phase 1 — Plan vs. Reality: Component Mismatch
              </div>
              <div className="text-reveal font-mono text-xs text-neutral-300 space-y-4 leading-relaxed mb-6">
                <p>
                  The original concept specified a 24GHz mmWave radar and LRA haptic motors, running on an ESP32-S3. What the organisation actually issued us at the start was an ultrasonic distance sensor and standard servo motors — components that are cheaper, easier to source, but fundamentally limited: ultrasonic sensors lose reliability above 30km/h and in rain, and servo motors are too bulky to embed in a steering wheel.
                </p>
                <p>
                  Rather than wait, we wrote two versions of the firmware in parallel: v1 targeted the components we actually had, so development could continue immediately; v2 was written against the specification we wanted to reach once better components arrived. We also submitted a formal request to our HOD with a technical justification. A ₹2,000 grant was approved, and we sourced two Waveshare S3KM1110 24GHz mmWave radar modules (LEFT + RIGHT coverage) and a MicroSD module.
                </p>
                <p>
                  This "build for what you have, design for what you need" approach meant the project never stalled waiting on procurement — and it's the reason the final system has real mmWave radar rather than the ultrasonic placeholder it started with.
                </p>
              </div>

              {/* Twin Callouts Panel with terminal styling and code brackets */}
              <div className="text-reveal grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div id="callout-v1" className="border border-[#2e3238] bg-[#121315] rounded overflow-hidden font-mono text-[9px] p-4 relative">
                  <div className="absolute top-1 right-2 text-[7px] text-neutral-600">v1_FIRMWARE</div>
                  <span className="text-[#888888] font-bold block mb-1">[v1 Ultrasonic Placeholder]</span>
                  <div className="text-neutral-500 space-y-0.5">
                    <div>#define TRIG_PIN 12</div>
                    <div>#define ECHO_PIN 13</div>
                    <div>float dist = readUltrasonic();</div>
                    <div className="text-red-500 mt-2 font-bold">// LIMIT: Max 30km/h & rain failure</div>
                  </div>
                </div>
                
                <div id="callout-v2" className="border border-[#2e3238] bg-[#121315] rounded overflow-hidden font-mono text-[9px] p-4 relative">
                  <div className="absolute top-1 right-2 text-[7px] text-[#d97706]">v2_FIRMWARE</div>
                  <span className="text-[#d97706] font-bold block mb-1">[v2 Dual Waveshare 24GHz]</span>
                  <div className="text-neutral-300 space-y-0.5">
                    <div>#define RADAR_RX 21</div>
                    <div>#define RADAR_TX 22</div>
                    <div>RadarFrame frame = readBinaryFrame();</div>
                    <div className="text-green-500 mt-2 font-bold">// STATUS: Active mmWave sensors</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* STAGE 3: PHASE 2 — HARDWARE VERIFICATION */}
          <div id="panel-3" className="w-screen h-screen flex-shrink-0 relative box-border px-20 py-24 bg-[#121315] flex items-center justify-end border-r border-[#2e3238]">
            <div className="absolute top-12 left-20 text-[120px] font-sans font-black text-neutral-800/10 select-none pointer-events-none">03</div>
            
            <div className="flex flex-row items-center justify-between w-full pr-[4vw] gap-8">
              
              {/* Wiring Pin Layout diagram - Left side */}
              <div className="card-reveal w-[34vw] border border-[#2e3238] p-6 bg-[#16171a] font-mono text-xs rounded shadow-2xl z-20 space-y-4">
                <span className="text-[#d97706] font-bold block">// ESP32-S3 BOARD PIN SCHEMATIC</span>
                
                <div className="space-y-3 bg-[#121315] p-4 rounded border border-[#2e3238]">
                  <div className="flex justify-between border-b border-[#2e3238] pb-1.5 font-bold text-neutral-400 text-[10px]">
                    <span>PERIPHERAL BUS</span>
                    <span>GPIO PINOUT</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-neutral-500">[Radar Stream]</span>
                    <span className="text-[#d97706] bg-[#d97706]/10 px-2 py-0.5 rounded border border-[#d97706]/20 font-bold">GPIO 21 / 22</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-neutral-500">[Pi Link UART]</span>
                    <span className="text-neutral-200 bg-[#2e3238] px-2 py-0.5 rounded border border-neutral-700 font-bold">GPIO 26 / 27</span>
                  </div>

                  <div className="flex justify-between items-center text-[11px] opacity-50">
                    <span className="text-neutral-500">[Old Pinout]</span>
                    <span className="text-red-500 line-through font-bold">GPIO 16 / 17</span>
                  </div>
                </div>

                <div className="text-[10px] text-neutral-500 leading-relaxed">
                  * Note: Multimeter confirmed split breadboard power rail. GPIO 16/17 physically absent from issued boards. Remapped in v2.
                </div>
              </div>

              {/* Text content - Right side */}
              <div className="card-reveal w-[48vw] bg-[#16171a] border border-[#2e3238] p-10 shadow-2xl z-20 rounded relative">
                <div className="absolute top-0 left-6 -translate-y-1/2 bg-[#d97706] text-black font-mono text-[9px] px-2 py-0.5 uppercase tracking-wider font-bold">
                  03 / Phase 2 — Hardware Verification
                </div>
                <div className="text-reveal font-mono text-xs text-neutral-300 space-y-3 leading-relaxed">
                  <p>
                    Firmware v2 was written assuming ESP32-S3 GPIO mapping. When we actually got hands-on with the board and started wiring the radar, the radar stayed silent. After checking code, baud rates, and swapping wires, we traced the real fault to a split breadboard power rail — the two halves weren't electrically connected, so half the circuit had no power at all. Confirmed with a multimeter, rail by rail.
                  </p>
                  <p>
                    Fixing the power issue exposed a second problem: GPIO 16 and 17 didn't physically exist on the header we were using — present on the datasheet, absent on the board. We remapped the radar's serial connection to GPIO 21/22 to keep moving.
                  </p>
                  <p>
                    Once we sourced the correct ESP32-S3 hardware through the grant, we retargeted the firmware properly: the Pi-facing UART link uses GPIO 26/27, while the radar keeps its own independent channel on GPIO 21/22 — two separate serial streams feeding into one fusion layer in software.
                  </p>
                  <p className="text-[#d97706] font-bold">
                    ➔ Verify every pin physically before trusting a diagram.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* STAGE 4: PHASE 3 — DATASET EXPANSION */}
          <div id="panel-4" className="w-screen h-screen flex-shrink-0 relative box-border px-20 py-24 bg-[#121315] flex items-center justify-start border-r border-[#2e3238]">
            <div className="absolute top-12 right-20 text-[120px] font-sans font-black text-neutral-800/10 select-none pointer-events-none">04</div>
            
            <div className="flex flex-row items-center justify-between w-full pl-[36vw] gap-8">
              
              {/* Text content - Left side */}
              <div className="card-reveal w-[48vw] bg-[#16171a] border border-[#2e3238] p-10 shadow-2xl z-20 rounded relative">
                <div className="absolute top-0 left-6 -translate-y-1/2 bg-[#d97706] text-black font-mono text-[9px] px-2 py-0.5 uppercase tracking-wider font-bold">
                  04 / Phase 3 — Dataset Expansion
                </div>
                <div className="text-reveal font-mono text-xs text-neutral-300 space-y-3 leading-relaxed">
                  <p>
                    Early modelling work was split across three separate, disconnected Colab notebooks — one team member each on different vehicle classes, with mismatched class names and no shared structure. We scrapped all three and rebuilt into a single unified 14-cell notebook covering the full pipeline, from dataset to a live Gradio demo.
                  </p>
                  <p>
                    The first real training run used a Kaggle "Indian Vehicle" dataset that turned out to contain only 46 usable images for our target classes — nowhere near enough. Instead of retraining on weak data, we rebuilt the dataset pipeline entirely: COCO 2017 (2,910 images) + Roboflow Indian-road datasets (1,829 images) + the original Kaggle images, totalling 8,570 images across 10 classes.
                  </p>
                  <p>
                    We experienced repeated Colab GPU resets, expired API keys, and lost one 3-5 hour training run outright. Switching to Kaggle's GPU introduced a new failure: data.yaml pointed to /content/... instead of /kaggle/working/..., so the model failed to save. We fixed this by adding an auto-save block directly inside the training cell.
                  </p>
                </div>
              </div>

              {/* Massive high-impact counter component - Right side */}
              <div className="card-reveal w-[34vw] border border-[#2e3238] p-6 bg-[#16171a] rounded shadow-2xl z-20 space-y-4">
                <span className="text-[#d97706] font-mono text-[9px] uppercase tracking-widest block">// IMAGE TELEMETRY</span>
                
                <div className="bg-[#121315] border border-[#2e3238] p-6 rounded flex flex-col justify-center items-center gap-1">
                  <div className="text-5xl font-sans font-black text-white tracking-tighter flex items-baseline">
                    <span id="dataset-image-counter">46</span>
                  </div>
                  <span className="font-mono text-[10px] text-neutral-450 uppercase tracking-widest mt-1">TOTAL TRAINING IMAGES</span>
                </div>

                <div className="space-y-2 font-mono text-[9px]">
                  <div className="flex justify-between border-b border-[#2e3238] pb-1 text-neutral-500">
                    <span>DATA SOURCE</span>
                    <span>VOLUME</span>
                  </div>
                  <div className="flex justify-between text-neutral-300">
                    <span>COCO 2017 dataset</span>
                    <span>2,910 images</span>
                  </div>
                  <div className="flex justify-between text-neutral-300">
                    <span>Roboflow Indian Road</span>
                    <span>1,829 images</span>
                  </div>
                  <div className="flex justify-between text-neutral-300">
                    <span>Kaggle & Custom Captures</span>
                    <span>3,831 images</span>
                  </div>
                  <div className="flex justify-between text-[#d97706] pt-1.5 border-t border-[#2e3238] font-bold">
                    <span>CLASSES COMPILED</span>
                    <span>10 classes</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* STAGE 5: PHASE 4 — DETECTION QUALITY */}
          <div id="panel-5" className="w-screen h-screen flex-shrink-0 relative box-border px-20 py-24 bg-[#121315] flex items-center justify-end border-r border-[#2e3238]">
            <div className="absolute top-12 left-20 text-[120px] font-sans font-black text-neutral-800/10 select-none pointer-events-none">05</div>
            
            <div className="flex flex-row items-center justify-between w-full pr-[4vw] gap-8">
              
              {/* Simulation Frame Mimicking Bounding-Box Overlay - Left side */}
              <div className="card-reveal w-[36vw] border border-[#2e3238] bg-[#16171a] rounded overflow-hidden shadow-2xl z-20 flex flex-col">
                <div className="bg-[#121315] border-b border-[#2e3238] px-4 py-2 flex items-center justify-between font-mono text-[8px] text-neutral-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                    <span>CAMERA FEED [SIMULATION]</span>
                  </div>
                  <span>1080P // 60 FPS</span>
                </div>
                
                {/* Visual Camera canvas */}
                <div className="bg-[#121315] h-[200px] relative border-b border-[#2e3238] flex items-center justify-center overflow-hidden">
                  
                  {/* Camera reticles */}
                  <div className="absolute inset-4 border border-dashed border-neutral-800/60 pointer-events-none"></div>
                  
                  {/* Visual simulated road lanes */}
                  <svg className="absolute inset-0 w-full h-full text-neutral-800/30" stroke="currentColor" strokeWidth="1">
                    <line x1="180" y1="200" x2="180" y2="0" strokeDasharray="4,4" />
                    <line x1="80" y1="200" x2="140" y2="0" />
                    <line x1="280" y1="200" x2="220" y2="0" />
                  </svg>
                  
                  {/* Amber bounding box (Custom GhostTrack Auto-Rickshaw) */}
                  <div className="absolute top-[60px] left-[40px] w-[140px] h-[100px] border-2 border-[#d97706] rounded flex flex-col justify-between p-1 z-15 bg-[#d97706]/5">
                    <span className="bg-[#d97706] text-black font-mono text-[7px] font-bold px-1 py-0.5 rounded w-fit leading-none">
                      GhostTrack: Auto-Rickshaw: 91.6%
                    </span>
                    <span className="text-[7px] text-[#d97706] font-mono text-right">[TRACKING]</span>
                  </div>

                  {/* Blue bounding box (COCO Person) */}
                  <div className="absolute top-[30px] right-[40px] w-[90px] h-[140px] border-2 border-blue-500 rounded flex flex-col justify-between p-1 z-15 bg-blue-500/5">
                    <span className="bg-blue-500 text-white font-mono text-[7px] font-bold px-1 py-0.5 rounded w-fit leading-none">
                      COCO: Person: 87%
                    </span>
                    <span className="text-[7px] text-blue-400 font-mono text-right">[TRACKING]</span>
                  </div>
                </div>

                <div className="p-3 bg-[#16171a] font-mono text-[8px] text-neutral-450 flex justify-between">
                  <span>LATENCY: 14.5ms</span>
                  <span>DUAL-MODEL INFERENCE LAYER</span>
                </div>
              </div>

              {/* Text content - Right side */}
              <div className="card-reveal w-[48vw] bg-[#16171a] border border-[#2e3238] p-10 shadow-2xl z-20 rounded relative">
                <div className="absolute top-0 left-6 -translate-y-1/2 bg-[#d97706] text-black font-mono text-[9px] px-2 py-0.5 uppercase tracking-wider font-bold">
                  05 / Phase 4 — Detection Quality
                </div>
                <div className="text-reveal font-mono text-xs text-neutral-300 space-y-3 leading-relaxed">
                  <p>
                    With a real dataset trained (YOLOv8n, 100 epochs, Kaggle T4 GPU, mAP@0.5 = 0.689), testing on actual Indian road images revealed the gap that mattered most: the model was missing persons, motorcycles, and bicycles — the exact vulnerable road users GhostTrack exists to protect. Cars and auto-rickshaws detected fine.
                  </p>
                  <p>
                    The cause was the data itself: COCO's person/cyclist images are front-facing, Western-context photos. A truck-mounted side camera sees people from a completely different angle.
                  </p>
                  <p>
                    Rather than spend more training cycles chasing this, we adopted a dual-model architecture: the pretrained COCO YOLOv8n handles person/bicycle/motorcycle at 83–87% confidence, while our custom GhostTrack model handles India-specific classes — auto-rickshaw (91.6%), tractor (90.6%), e-rickshaw, and LCVs.
                  </p>
                  <p className="text-[#d97706] font-bold">// Delivered better results in 10 minutes of integration work than another full training cycle.</p>
                </div>
              </div>

            </div>
          </div>

          {/* STAGE 6: PHASE 5 — THREE CAMERA GENERATIONS */}
          <div id="panel-6" className="w-screen h-screen flex-shrink-0 relative box-border px-20 py-24 bg-[#121315] flex items-center justify-start border-r border-[#2e3238]">
            <div className="absolute top-12 right-20 text-[120px] font-sans font-black text-neutral-800/10 select-none pointer-events-none">06</div>
            
            <div className="card-reveal w-[52vw] bg-[#16171a] border border-[#2e3238] p-10 shadow-2xl z-20 rounded relative ml-[36vw]">
              <div className="absolute top-0 left-6 -translate-y-1/2 bg-[#d97706] text-black font-mono text-[9px] px-2 py-0.5 uppercase tracking-wider font-bold">
                06 / Phase 5 — Three Camera Generations
              </div>
              
              <div className="text-reveal font-mono text-xs text-neutral-300 space-y-4 leading-relaxed mb-6">
                <p>
                  <strong>Gen 1 — USB webcam:</strong> Worked in Colab, but poor low-light performance and no wide-angle coverage.
                </p>
                <p>
                  <strong>Gen 2 — 160° fisheye USB camera:</strong> Better field of view, but USB bandwidth bottlenecked frame rate once real-time inference was running on the Pi.
                </p>
                <p>
                  <strong>Gen 3 — Raspberry Pi Camera Module (OV5647, CSI):</strong> Required a full rewrite from cv2.VideoCapture() to the Picamera2 API — different capture loop, different frame format, different everything downstream. Direct CSI bypassed the USB bottleneck entirely.
                </p>
                <p>
                  The hardware kept evolving after that: we moved from Raspberry Pi 4 to Raspberry Pi 5 with dual CSI cameras, which needed explicit dtoverlay entries in /boot/firmware/config.txt before both cameras would reliably enumerate. Rendering detection output over VNC was unreliable with cv2.imshow(), so we switched to a Flask MJPEG stream instead — solved it outright. Sustained inference also pushed the Pi 5 past 85°C and into thermal throttling, which we resolved with physical cooling.
                </p>
              </div>

              <div className="text-reveal border border-[#2e3238] bg-[#121315] p-3 rounded font-mono text-[9px] text-[#d97706]">
                * Hardware setup finalized: Raspberry Pi 5 Active Cooled + Dual CSI OV5647 modules + Flask Stream.
              </div>
            </div>
          </div>

          {/* STAGE 7: PHASE 6 — SERVO TO VIBRATION */}
          <div id="panel-7" className="w-screen h-screen flex-shrink-0 relative box-border px-20 py-24 bg-[#121315] flex items-center justify-end border-r border-[#2e3238]">
            <div className="absolute top-12 left-20 text-[120px] font-sans font-black text-neutral-800/10 select-none pointer-events-none">07</div>
            
            <div className="flex flex-row items-center justify-between w-full pr-[4vw] gap-8">
              
              {/* Steering wheel visual - Left side */}
              <div className="card-reveal w-[34vw] border border-[#2e3238] p-6 bg-[#16171a] font-mono text-[10px] rounded shadow-2xl z-20 space-y-4">
                <span className="text-[#d97706] font-bold block">// 3D STEERING WHEEL HAPTIC MOTOR PLACEMENT</span>
                
                <div className="flex items-center justify-center py-6">
                  {/* Wheel graphics */}
                  <div className="w-32 h-32 rounded-full border-4 border-neutral-700 flex items-center justify-between px-2 relative">
                    <div className="w-3.5 h-3.5 rounded-full bg-[#d97706] animate-ping absolute -left-1"></div>
                    <div className="w-4 h-4 rounded-full bg-[#d97706] absolute -left-1.5 flex items-center justify-center text-black font-bold text-[8px]">LH</div>
                    
                    <div className="w-3.5 h-3.5 rounded-full bg-[#d97706] animate-ping absolute -right-1"></div>
                    <div className="w-4 h-4 rounded-full bg-[#d97706] absolute -right-1.5 flex items-center justify-center text-black font-bold text-[8px]">RH</div>
                    
                    <div className="w-full h-1 bg-neutral-700 absolute left-0 top-1/2 -translate-y-1/2 z-0"></div>
                  </div>
                </div>

                <div className="bg-[#121315] p-3 rounded border border-[#2e3238] space-y-1.5 text-neutral-450">
                  <div className="flex justify-between">
                    <span>Actuator type:</span>
                    <span className="text-white">10mm ERM Coin Motors (&lt;2g)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Driver logic:</span>
                    <span className="text-white">BC547 NPN Transistors</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Firmware peripheral:</span>
                    <span className="text-white">ESP32 LEDC PWM Peripheral</span>
                  </div>
                </div>
              </div>

              {/* Text content - Right side */}
              <div className="card-reveal w-[52vw] bg-[#16171a] border border-[#2e3238] p-10 shadow-2xl z-20 rounded relative">
                <div className="absolute top-0 left-6 -translate-y-1/2 bg-[#d97706] text-black font-mono text-[9px] px-2 py-0.5 uppercase tracking-wider font-bold">
                  07 / Phase 6 — Servo to Vibration
                </div>
                <div className="text-reveal font-mono text-xs text-neutral-300 space-y-3 leading-relaxed">
                  <p>
                    The original haptic concept used two servo motors (via a PCA9685 driver) that would physically point toward the danger side. It worked, in a basic sense — but servos are large, current-hungry, and mechanically impractical to embed inside a steering wheel rim.
                  </p>
                  <p>
                    We pivoted to 10mm ERM coin vibration motors (under 2g each), driven through BC547 transistors and controlled via the ESP32's LEDC PWM peripheral, embedded in a custom 3D-printed 35cm three-spoke steering wheel at the 9 o'clock and 3 o'clock positions.
                  </p>
                  <p>
                    Two alert intensities were defined in firmware: **CRITICAL** as continuous full-power PWM, and **AWARENESS** as a pulsed partial-power pattern. The result is smaller, quieter, and maps directly to how a driver actually experiences danger — felt in the specific hand closest to the threat, not seen or heard.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* STAGE 8: PHASE 7 — FUSION LOGIC */}
          <div id="panel-8" className="w-screen h-screen flex-shrink-0 relative box-border px-20 py-24 bg-[#121315] flex items-center justify-start border-r border-[#2e3238]">
            <div className="absolute top-12 right-20 text-[120px] font-sans font-black text-neutral-800/10 select-none pointer-events-none">08</div>
            
            <div className="flex flex-row items-center justify-between w-full pl-[36vw] gap-8">
              
              {/* Text content - Left side */}
              <div className="card-reveal w-[48vw] bg-[#16171a] border border-[#2e3238] p-10 shadow-2xl z-20 rounded relative">
                <div className="absolute top-0 left-6 -translate-y-1/2 bg-[#d97706] text-black font-mono text-[9px] px-2 py-0.5 uppercase tracking-wider font-bold">
                  08 / Phase 7 — Fusion Logic
                </div>
                <div className="text-reveal font-mono text-xs text-neutral-300 space-y-3 leading-relaxed">
                  <p>
                    The first version of the alert logic was radar-only: anything closer than a fixed threshold triggered a warning. In practice, this meant walls, parked vehicles, and speed bumps all set off false alarms — a system that cries wolf isn't trustworthy in a cab.
                  </p>
                  <p>
                    We redesigned this in stages:
                  </p>
                  <p>
                    1. **Two-input AND logic**: an alert only escalates to CRITICAL if radar detects proximity and vision confirms a person, cyclist, or other vulnerable road user. A wall can be close; a wall doesn't classify as a person.
                  </p>
                  <p>
                    2. **Three-state machine**: SAFE / AWARENESS / CRITICAL, each with distinct LED and haptic behaviour, so the system communicates urgency, not just presence.
                  </p>
                  <p>
                    3. **Speed-adaptive thresholds**: roughly 1.5m in city conditions vs. 5.0m at highway speed, since a fixed distance threshold doesn't make sense across that range.
                  </p>
                  <p>
                    4. **Simulation mode & WiFi AP Dashboard**: pressing L or R toggles simulated LEFT/RIGHT detection for indoor testing. The ESP32 hosts its own local WiFi page to monitor target outputs from a phone without internet.
                  </p>
                </div>
              </div>

              {/* State Machine graphic - Right side */}
              <div className="card-reveal w-[34vw] border border-[#2e3238] p-6 bg-[#16171a] rounded shadow-2xl z-20 space-y-4">
                <span className="text-[#d97706] font-mono text-[9px] uppercase tracking-widest block">// STATE MACHINE DECISION TREE</span>
                
                <div className="space-y-3">
                  <div className="p-3 border border-[#2e3238] bg-[#121315] rounded flex items-center justify-between font-mono text-xs text-neutral-400">
                    <span>STATE: SAFE</span>
                    <span className="text-green-500 font-bold">● OK</span>
                  </div>
                  
                  <div className="p-3 border border-[#2e3238] bg-[#121315] rounded flex items-center justify-between font-mono text-xs text-neutral-300">
                    <span>STATE: AWARENESS</span>
                    <span className="text-[#d97706] font-bold">● Pulsing Haptics</span>
                  </div>

                  <div className="p-3 border-2 border-[#d97706] bg-[#d97706]/10 rounded flex items-center justify-between font-mono text-xs text-white">
                    <span>STATE: CRITICAL</span>
                    <span className="text-red-500 font-bold animate-pulse">● Continuous PWM</span>
                  </div>
                </div>

                <div className="p-3 border border-neutral-800 bg-[#121315] rounded text-[10px] text-neutral-500 font-mono">
                  <div>Fusion Rule:</div>
                  <div className="text-white mt-1">IF (Radar &lt; Range) AND (Vision == VRU) ➔ Trigger Alert</div>
                </div>
              </div>

            </div>
          </div>

          {/* STAGE 9: PHASE 8 — INTER-BOARD COMMUNICATIONS */}
          <div id="panel-9" className="w-screen h-screen flex-shrink-0 relative box-border px-20 py-24 bg-[#121315] flex items-center justify-start border-r border-[#2e3238]">
            <div className="absolute top-12 right-20 text-[120px] font-sans font-black text-neutral-800/10 select-none pointer-events-none">09</div>
            
            <div className="flex flex-row items-center justify-between w-full pl-[36vw] gap-8">
              
              {/* Text content - Left side */}
              <div className="card-reveal w-[48vw] bg-[#16171a] border border-[#2e3238] p-10 shadow-2xl z-20 rounded relative">
                <div className="absolute top-0 left-6 -translate-y-1/2 bg-[#d97706] text-black font-mono text-[9px] px-2 py-0.5 uppercase tracking-wider font-bold">
                  09 / Phase 8 — Inter-Board Communications
                </div>
                <div className="text-reveal font-mono text-xs text-neutral-300 space-y-3 leading-relaxed">
                  <p>
                    The Raspberry Pi 5 runs Linux and Python; the ESP32-S3 runs bare-metal C++. Bridging them meant defining a UART protocol from scratch: the Pi sends plain-text strings like `LEFT:person`, `RIGHT:bicycle`, or `CLEAR`, and the ESP32 parses these as one input into its fusion decision.
                  </p>
                  <p>
                    Getting the link working required mapping Pi 5 UART GPIOs correctly, enabling hardware UART through raspi-config, confirming /dev/ttyAMA0 existed after reboot, and matching that against the ESP32-S3's exposed UART pins (GPIO 26/27).
                  </p>
                  <p>
                    On the radar side, the initial ASCII parser didn't work at all with the Waveshare S3KM1110, which transmits structured binary frames (header, data, footer) rather than plain text. We researched the protocol and built a proper state-machine binary parser to extract moving- and stationary-target distance fields correctly.
                  </p>
                </div>
              </div>

              {/* Protocol schematic - Right side */}
              <div className="card-reveal w-[34vw] border border-[#2e3238] p-6 bg-[#16171a] rounded shadow-2xl z-20 space-y-4 font-mono text-[9px]">
                <span className="text-[#d97706] font-bold block">// UART PROTOCOL SCHEMA</span>
                
                <div className="space-y-2 bg-[#121315] p-4 rounded border border-[#2e3238]">
                  <div className="text-neutral-450 uppercase font-bold border-b border-[#2e3238] pb-1">Pi 5 to ESP32 payload</div>
                  <div className="text-[#d97706]">"LEFT:person\n" ➔ Left side alarm</div>
                  <div className="text-[#d97706]">"RIGHT:bicycle\n" ➔ Right side alarm</div>
                  <div className="text-neutral-500">"CLEAR\n" ➔ Reset haptic state</div>
                </div>

                <div className="space-y-2 bg-[#121315] p-4 rounded border border-[#2e3238]">
                  <div className="text-neutral-450 uppercase font-bold border-b border-[#2e3238] pb-1">Radar Binary Frame Parse</div>
                  <div className="text-neutral-400">Header: <span className="text-white">0xF4 0xF3 0xF2 0xF1</span></div>
                  <div className="text-neutral-400">Data payload: <span className="text-white">Distance + Target Type</span></div>
                  <div className="text-neutral-400">End frame: <span className="text-white">0xF8 0xF7 0xF6 0xF5</span></div>
                </div>
              </div>

            </div>
          </div>

          {/* STAGE 10: PHASE 9 — SCALE MODEL ASSEMBLY */}
          <div id="panel-10" className="w-screen h-screen flex-shrink-0 relative box-border px-20 py-24 bg-[#121315] flex items-center justify-start border-r border-[#2e3238]">
            <div className="absolute top-12 right-20 text-[120px] font-sans font-black text-neutral-800/10 select-none pointer-events-none">10</div>
            
            <div className="card-reveal w-[52vw] bg-[#16171a] border border-[#2e3238] p-10 shadow-2xl z-20 rounded relative ml-[36vw]">
              <div className="absolute top-0 left-6 -translate-y-1/2 bg-[#d97706] text-black font-mono text-[9px] px-2 py-0.5 uppercase tracking-wider font-bold">
                10 / Phase 9 — Scale Model Assembly
              </div>
              <div className="text-reveal font-mono text-xs text-neutral-300 space-y-4 leading-relaxed mb-6">
                <p>
                  Rather than demo the system on a bare breadboard, we designed and 3D-printed a 33×10×12cm scale model of an Indian HCV (Ashok Leyland/Tata style) — seven printed pieces, dovetail joints, internal chassis wire channels, and camera mounting points at front-left and front-right. Every wire is routed internally except the four coin-motor leads, which exit through the chassis floor by design.
                </p>
                <p>
                  That single decision changed what the project communicated. A working circuit on a table is a prototype; a scaled truck with cameras mounted where they'd actually sit is a use case anyone can understand at a glance.
                </p>
              </div>
              <div className="text-reveal border border-[#2e3238] bg-[#121315] p-4 rounded flex items-center justify-between font-mono text-[9px] text-neutral-400">
                <span className="font-bold text-[#d97706]">CHASSIS SCHEMATIC DESIGN</span>
                <span>7 Part Interlocking Assembly (Dovetail Joints)</span>
              </div>
            </div>
          </div>

          {/* STAGE 11: WHERE THINGS STAND NOW */}
          <div id="panel-11" className="w-screen h-screen flex-shrink-0 relative box-border px-20 py-24 bg-[#121315] flex items-center justify-end border-r border-[#2e3238] tech-grid">
            
            <div className="w-[58vw] text-white flex items-center mr-[4vw] z-10 relative">
              <div className="w-full py-6">
                <div className="table-col-anim translate-y-8 flex flex-col gap-5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[#d97706] text-sm">// telemetry log</span>
                    <h3 className="font-sans text-2xl font-bold uppercase tracking-tight text-white">WHERE THINGS STAND NOW</h3>
                  </div>
                  
                  {/* Highly scannable checklist grid */}
                  <div className="font-mono text-xs grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-[#2e3238] bg-[#16171a] p-4 rounded shadow-lg flex flex-col justify-between">
                      <span className="text-neutral-450 uppercase font-bold text-[9px] tracking-wider mb-2 block">Detection Pipeline</span>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] text-neutral-300">Pi 5 dual-camera (Picamera2 + YOLOv8n COCO + custom ONNX + MJPEG)</span>
                        <span className="text-green-500 font-bold bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded text-[10px]">FUNCTIONAL</span>
                      </div>
                    </div>

                    <div className="border border-[#2e3238] bg-[#16171a] p-4 rounded shadow-lg flex flex-col justify-between">
                      <span className="text-neutral-450 uppercase font-bold text-[9px] tracking-wider mb-2 block">Core Controller</span>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] text-neutral-300">ESP32-S3 Firmware (Live Radar &amp; Haptic alerts)</span>
                        <span className="text-green-500 font-bold bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded text-[10px]">OPERATIONAL</span>
                      </div>
                    </div>

                    <div className="border border-[#2e3238] bg-[#16171a] p-4 rounded shadow-lg flex flex-col justify-between">
                      <span className="text-neutral-450 uppercase font-bold text-[9px] tracking-wider mb-2 block">Interboard link</span>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] text-neutral-300">Pi ↔ ESP32 Physical UART link</span>
                        <span className="text-green-500 font-bold bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded text-[10px]">CONNECTED</span>
                      </div>
                    </div>

                    <div className="border border-[#2e3238] bg-[#16171a] p-4 rounded shadow-lg flex flex-col justify-between">
                      <span className="text-neutral-450 uppercase font-bold text-[9px] tracking-wider mb-2 block">Sensor range validation</span>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] text-neutral-300">Live Radar testing in integrated setup</span>
                        <span className="text-green-500 font-bold bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded text-[10px]">VERIFIED LIVE</span>
                      </div>
                    </div>

                    <div className="border border-[#2e3238] bg-[#16171a] p-4 rounded shadow-lg flex flex-col justify-between md:col-span-2">
                      <span className="text-neutral-450 uppercase font-bold text-[9px] tracking-wider mb-2 block">Thermal status</span>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] text-neutral-300">Active cooling system on Pi 5</span>
                        <span className="text-green-500 font-bold bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded text-[10px]">RESOLVED</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

          {/* STAGE 12: WHAT MEANINGFULLY IMPROVED */}
          <div id="panel-12" className="w-screen h-screen flex-shrink-0 bg-[#121315] flex items-center justify-end border-r border-[#2e3238] tech-grid">
            <div className="w-[58vw] text-white flex items-center mr-[4vw] z-10 relative">
              <div className="w-full py-6">
                <div className="table-col-anim translate-y-8 flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[#d97706] text-sm">// upgrade matrix</span>
                    <h3 className="font-sans text-2xl font-bold uppercase tracking-tight text-white">WHAT MEANINGFULLY IMPROVED</h3>
                  </div>

                  <div className="font-mono text-[9px] overflow-x-auto">
                    <table className="w-full text-left border-collapse border border-[#2e3238] bg-[#16171a] text-neutral-300">
                      <thead>
                        <tr className="border-b border-[#2e3238] bg-[#121315]">
                          <th className="p-3 font-bold text-[#d97706] text-[9px] uppercase tracking-wider w-1/5">Area</th>
                          <th className="p-3 font-bold text-neutral-400 text-[9px] uppercase tracking-wider w-2/5">Before</th>
                          <th className="p-3 font-bold text-white text-[9px] uppercase tracking-wider w-2/5">Now</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2e3238]">
                        <tr className="hover:bg-[#121315]/40 transition-colors">
                          <td className="p-3 font-semibold text-white">Dataset</td>
                          <td className="p-3 text-neutral-500">46 images, 3 disconnected notebooks</td>
                          <td className="p-3 text-[#d97706] font-bold">8,570 images, 10 classes, one unified pipeline</td>
                        </tr>
                        <tr className="hover:bg-[#121315]/40 transition-colors">
                          <td className="p-3 font-semibold text-white">Detection</td>
                          <td className="p-3 text-neutral-500">COCO-only, missed persons/motorcycles entirely</td>
                          <td className="p-3 text-[#d97706] font-bold">Dual-model system, 87% person confidence, 91.6% auto-rickshaw</td>
                        </tr>
                        <tr className="hover:bg-[#121315]/40 transition-colors">
                          <td className="p-3 font-semibold text-white">Ranging</td>
                          <td className="p-3 text-neutral-500">Ultrasonic (spec mismatch, weather/speed limited)</td>
                          <td className="p-3 text-[#d97706] font-bold">Dual Waveshare 24GHz mmWave radar</td>
                        </tr>
                        <tr className="hover:bg-[#121315]/40 transition-colors">
                          <td className="p-3 font-semibold text-white">Haptic alert</td>
                          <td className="p-3 text-neutral-500">Servo motors pointing toward danger</td>
                          <td className="p-3 text-[#d97706] font-bold">Directional coin vibration motors in a custom steering wheel</td>
                        </tr>
                        <tr className="hover:bg-[#121315]/40 transition-colors">
                          <td className="p-3 font-semibold text-white">Alert logic</td>
                          <td className="p-3 text-neutral-500">Radar-only, high false-positive rate</td>
                          <td className="p-3 text-[#d97706] font-bold">Radar + vision AND logic, 3-state, speed-adaptive</td>
                        </tr>
                        <tr className="hover:bg-[#121315]/40 transition-colors">
                          <td className="p-3 font-semibold text-white">Camera</td>
                          <td className="p-3 text-neutral-500">USB webcam, poor low-light, narrow FOV</td>
                          <td className="p-3 text-[#d97706] font-bold">Dual CSI cameras, Picamera2, MJPEG streaming</td>
                        </tr>
                        <tr className="hover:bg-[#121315]/40 transition-colors">
                          <td className="p-3 font-semibold text-white">Hardware form</td>
                          <td className="p-3 text-neutral-500">Breadboard and loose wires</td>
                          <td className="p-3 text-[#d97706] font-bold">Mounted inside a 3D-printed scale truck model</td>
                        </tr>
                        <tr className="hover:bg-[#121315]/40 transition-colors">
                          <td className="p-3 font-semibold text-white">Firmware target</td>
                          <td className="p-3 text-neutral-500">Assumed ESP32-S3 mapping that didn't match physical board</td>
                          <td className="p-3 text-[#d97706] font-bold">Verified and corrected ESP32-S3 pin mapping</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* STAGE 13: PROJECT SCOPE & OBJECTIVES */}
          <div id="panel-13" className="w-screen h-screen flex-shrink-0 bg-[#121315] flex items-center justify-end border-r border-[#2e3238] tech-grid">
            <div className="w-[58vw] text-white flex items-center mr-[4vw] z-10 relative">
              <div className="w-full py-6">
                <div className="table-col-anim translate-y-8 flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[#d97706] text-sm">// roadmap objectives</span>
                    <h3 className="font-sans text-2xl font-bold uppercase tracking-tight text-white">PROJECT SCOPE & OBJECTIVES</h3>
                  </div>

                  <div className="font-mono text-xs grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                    <div className="border border-[#2e3238] p-5 bg-[#16171a] rounded shadow-md flex flex-col justify-between">
                      <div>
                        <span className="text-green-500 font-bold block mb-3 uppercase text-[9px] tracking-wider">
                          ✓ Completed Milestones:
                        </span>
                        <ul className="list-inside space-y-2 text-neutral-300 leading-relaxed text-[11px]">
                          <li className="flex gap-2 items-start">
                            <span className="text-green-500">✔</span>
                            <span>Complete the Pi–ESP32 physical UART integration and run live radar tests in the combined system.</span>
                          </li>
                          <li className="flex gap-2 items-start">
                            <span className="text-green-500">✔</span>
                            <span>Add night-time and rain conditions to the training dataset.</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="border border-[#2e3238] p-5 bg-[#16171a] rounded shadow-md">
                      <span className="text-[#d97706] font-bold block mb-3 uppercase text-[9px] tracking-wider">
                        // Future Objectives:
                      </span>
                      <ul className="list-inside space-y-2 text-neutral-300 leading-relaxed text-[11px]">
                        <li className="flex gap-2 items-start">
                          <span className="text-[#d97706]">⬡</span>
                          <span>Test on a real 1:1-scale truck cabin mockup rather than the scale model.</span>
                        </li>
                        <li className="flex gap-2 items-start">
                          <span className="text-[#d97706]">⬡</span>
                          <span>Add GPS tagging so incidents can be logged for fleet-level analytics.</span>
                        </li>
                        <li className="flex gap-2 items-start">
                          <span className="text-[#d97706]">⬡</span>
                          <span>Re-enable and stress-test SD card logging under continuous operation.</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* STAGE 14: SUPPORTING MATERIALS */}
          <div id="panel-14" className="w-screen h-screen flex-shrink-0 bg-[#121315] flex items-center justify-end border-r border-[#2e3238] tech-grid">
            <div className="w-[58vw] text-white flex items-center mr-[4vw] z-10 relative font-mono">
              <div className="w-full py-6 table-col-anim translate-y-8 flex flex-col gap-4">
                <div className="border-b border-[#2e3238] pb-3 flex justify-between items-end">
                  <h3 className="font-sans text-2xl font-bold text-white uppercase">SUPPORTING MATERIALS</h3>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-neutral-500">PORTFOLIO INDEX v1.0</span>
                </div>
                
                {/* 4 Dashboard Resource Cards with custom inline SVG Lucide-style icons */}
                <div className="text-xs grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  
                  {/* GitHub Card */}
                  <a
                    href="https://github.com/leharinshainsha05-stack/GhostTruck"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex gap-4 border border-[#2e3238] p-4 bg-[#16171a] hover:border-[#d97706] transition-all duration-300 group rounded"
                  >
                    <div className="p-2.5 bg-[#121315] border border-[#2e3238] rounded group-hover:border-[#d97706]/40 transition-colors">
                      {/* GitHub logo SVG */}
                      <svg className="w-6 h-6 text-[#d97706]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path>
                        <path d="M9 18c-4.51 2-5-2-7-2"></path>
                      </svg>
                    </div>
                    <div className="flex-1 space-y-1">
                      <span className="text-white font-bold group-hover:text-[#d97706] transition-colors">GitHub Repository</span>
                      <p className="text-[10px] text-neutral-450 leading-normal">Access source code for firmware, models, and training logs at GhostTrack-Team.</p>
                    </div>
                  </a>

                  {/* Kaggle Card */}
                  <a
                    href="https://www.kaggle.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex gap-4 border border-[#2e3238] p-4 bg-[#16171a] hover:border-[#d97706] transition-all duration-300 group rounded"
                  >
                    <div className="p-2.5 bg-[#121315] border border-[#2e3238] rounded group-hover:border-[#d97706]/40 transition-colors">
                      {/* Database icon SVG */}
                      <svg className="w-6 h-6 text-[#d97706]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                        <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"></path>
                      </svg>
                    </div>
                    <div className="flex-1 space-y-1">
                      <span className="text-white font-bold group-hover:text-[#d97706] transition-colors">Kaggle Training Notebook</span>
                      <p className="text-[10px] text-neutral-450 leading-normal">Public, fully reproducible YOLOv8 training pipeline &amp; training logs.</p>
                    </div>
                  </a>

                  {/* Project Site Card */}
                  <a
                    href="https://ghosttruck.onrender.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex gap-4 border border-[#2e3238] p-4 bg-[#16171a] hover:border-[#d97706] transition-all duration-300 group rounded"
                  >
                    <div className="p-2.5 bg-[#121315] border border-[#2e3238] rounded group-hover:border-[#d97706]/40 transition-colors">
                      {/* Globe icon SVG */}
                      <svg className="w-6 h-6 text-[#d97706]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
                        <path d="M2 12h20"></path>
                      </svg>
                    </div>
                    <div className="flex-1 space-y-1">
                      <span className="text-white font-bold group-hover:text-[#d97706] transition-colors">Project Landing Site</span>
                      <p className="text-[10px] text-neutral-450 leading-normal">Live deployment demonstrating real-time telemetry stream.</p>
                    </div>
                  </a>

                  {/* 3D Model Viewer Card */}
                  <a
                    href="https://github.com/leharinshainsha05-stack/GhostTruck"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex gap-4 border border-[#2e3238] p-4 bg-[#16171a] hover:border-[#d97706] transition-all duration-300 group rounded"
                  >
                    <div className="p-2.5 bg-[#121315] border border-[#2e3238] rounded group-hover:border-[#d97706]/40 transition-colors">
                      {/* Layers icon SVG */}
                      <svg className="w-6 h-6 text-[#d97706]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m12 3-10 5 10 5 10-5-10-5Z"></path>
                        <path d="m2 17 10 5 10-5"></path>
                        <path d="m2 12 10 5 10-5"></path>
                      </svg>
                    </div>
                    <div className="flex-1 space-y-1">
                      <span className="text-white font-bold group-hover:text-[#d97706] transition-colors">3D Truck Model Viewer</span>
                      <p className="text-[10px] text-neutral-450 leading-normal">Interactive scale-truck viewer hosted using Three.js Cloud.</p>
                    </div>
                  </a>

                </div>

                {/* Team & BOM Footnote */}
                <div className="flex flex-col md:flex-row gap-4 border border-[#2e3238] p-4 bg-[#16171a] rounded mt-2 justify-between items-center text-[10px] text-neutral-400">
                  <div className="flex gap-4 items-center">
                    <div className="flex gap-2">
                      <img src={sumithImg} alt="SUMITH" className="w-6 h-6 rounded-full border border-neutral-700 object-cover filter grayscale" />
                      <img src={rajamaranImg} alt="RAJAMARAN" className="w-6 h-6 rounded-full border border-neutral-700 object-cover filter grayscale" />
                      <img src={leharinImg} alt="LEHARIN" className="w-6 h-6 rounded-full border border-neutral-700 object-cover filter grayscale" />
                    </div>
                    <span>Team GhostTrack: Chennai, India</span>
                  </div>
                  
                  <div className="font-bold border border-[#d97706]/30 bg-[#d97706]/10 px-3 py-1 rounded text-[#d97706]">
                    BOM SUMMARY: ≈ ₹5,050 total retrofit cost // Installed &lt; 2 hours
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* STAGE 15: EDITORIAL CLOSURE CLOSING QUOTE */}
          <div id="panel-15" className="w-screen h-screen flex-shrink-0 relative box-border px-20 py-24 bg-[#121315] flex items-center justify-center border-r border-[#2e3238] dot-grid">
            {/* Outline system frame design for the final canvas blockquote */}
            <div className="max-w-4xl py-14 px-10 bg-[#16171a] border border-[#2e3238] rounded-lg shadow-2xl relative" id="outro-quote-container">
              <div className="absolute top-4 left-4 font-mono text-[8px] text-[#d97706] tracking-[0.25em]">SYSTEM LOG // OUTRO STATUS</div>
              
              {/* Technical drawing corner notches */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#d97706]"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#d97706]"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#d97706]"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#d97706]"></div>
              <blockquote className="font-mono text-base md:text-lg text-white leading-relaxed text-center font-medium italic mt-2">
                "The hard part of this project was never the machine learning. It was a split breadboard rail, a chip that wasn't the variant we assumed, pins that existed on a datasheet but not on a physical header, and a haptic approach that had to be thrown out and rebuilt. Every one of those failures forced us to understand the system more deeply than we would have if things had worked the first time — which is, in the end, how the project actually got built."
              </blockquote>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
