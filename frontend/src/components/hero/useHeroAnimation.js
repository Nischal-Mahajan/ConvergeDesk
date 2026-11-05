import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";
import { PANELS, CONNECTION_LINES } from "./heroConstants";

gsap.registerPlugin(ScrollTrigger);

/**
 * Calculates a natural spine turn angle facing a target in front of the character
 */
function getAngleToTarget(targetPos) {
  const [x, , z] = targetPos;
  const angle = Math.atan2(x, Math.abs(z) + 1.1) * 1.15;
  return THREE.MathUtils.clamp(angle, -1.1, 1.1);
}

/**
 * Computes world grab position given panel position, rotation, and grabOffset
 */
function computeGrabPoint(pos, rot, grabOffset) {
  const v = new THREE.Vector3(...grabOffset);
  const euler = new THREE.Euler(...rot);
  v.applyEuler(euler);
  v.add(new THREE.Vector3(...pos));
  return v;
}

export function useHeroAnimation({ containerRef, animState }) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !animState?.current) return;

    const ctx = gsap.context(() => {
      const state = animState.current;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: "bottom bottom",
          scrub: 1.2,
          invalidateOnRefresh: true,
        },
      });

      // ── Initial State Setup ──
      tl.set(".hero-phase-label.phase-1", { opacity: 1, y: 0 }, 0);
      tl.set(".hero-phase-label.phase-2", { opacity: 0, y: 6 }, 0);
      tl.set(".hero-phase-label.phase-3", { opacity: 0, y: 6 }, 0);

      // ── STAGE A: 0% → 12% — Fragmented Scattered Tools ──
      // Camera drift & initial atmosphere
      tl.to(
        state.camera,
        {
          z: 6.8,
          y: 1.35,
          duration: 0.12,
          ease: "none",
        },
        0
      );

      // Hero text subtle fade / position transition as user begins scrolling
      tl.to(".hero-copy", { opacity: 0.15, y: -25, duration: 0.1 }, 0.08);

      // Transition to Stage B phase indicator
      tl.to(".hero-phase-label.phase-1", { opacity: 0, y: -6, duration: 0.02 }, 0.11);
      tl.to(".hero-phase-label.phase-2", { opacity: 1, y: 0, duration: 0.02 }, 0.12);

      // ── STAGE B: 12% → 80% — Human Character Drags & Assembles All 8 Panels ──
      const totalAssemblyTime = 0.68; // 68% of scroll depth
      const panelDuration = totalAssemblyTime / PANELS.length; // 0.085 per panel

      PANELS.forEach((panel, i) => {
        const start = 0.12 + i * panelDuration;
        const contactTime = start + panelDuration * 0.28;
        const releaseTime = start + panelDuration * 0.88;

        const isLeft = panel.hand === "left";
        const handKey = isLeft ? "leftHandTarget" : "rightHandTarget";
        const graspKey = isLeft ? "leftGrasp" : "rightGrasp";

        const startGrabWorld = computeGrabPoint(
          panel.startPos,
          panel.startRot,
          panel.grabOffset
        );
        const destGrabWorld = computeGrabPoint(
          panel.destPos,
          panel.destRot,
          panel.grabOffset
        );

        const targetBodyAngle = getAngleToTarget(panel.startPos);

        // 1. Character turns body & focuses toward panel
        tl.to(
          state.char,
          {
            bodyRotY: targetBodyAngle,
            idleWeight: 0.2,
            duration: panelDuration * 0.26,
            ease: "power2.inOut",
          },
          start
        );

        // 2. Hand extends via IK directly to the panel's physical grab handle
        tl.to(
          state.char[handKey],
          {
            x: startGrabWorld.x,
            y: startGrabWorld.y,
            z: startGrabWorld.z,
            duration: panelDuration * 0.26,
            ease: "power2.out",
          },
          start + 0.002
        );

        // 3. Hand makes physical contact: fingers curl (grasp = 1.0) & grab flag lights up
        tl.to(
          state.char,
          {
            [graspKey]: 1.0,
            duration: 0.008,
            ease: "power1.in",
          },
          contactTime
        );

        tl.set(
          state.panels[i],
          { isGrabbed: true },
          contactTime
        );

        // 4. THE PHYSICAL DRAG: Hand pulls panel along 3D trajectory to central workspace
        tl.to(
          state.char[handKey],
          {
            x: destGrabWorld.x,
            y: destGrabWorld.y,
            z: destGrabWorld.z,
            duration: panelDuration * 0.58,
            ease: "power2.inOut",
          },
          contactTime
        );

        // Panel moves synchronously with hand
        tl.to(
          state.panels[i].pos,
          {
            0: panel.destPos[0],
            1: panel.destPos[1],
            2: panel.destPos[2],
            duration: panelDuration * 0.58,
            ease: "power2.inOut",
          },
          contactTime
        );

        // Panel banks & rotates smoothly into workspace alignment
        tl.to(
          state.panels[i].rot,
          {
            0: panel.destRot[0],
            1: panel.destRot[1],
            2: panel.destRot[2],
            duration: panelDuration * 0.58,
            ease: "power2.inOut",
          },
          contactTime
        );

        // 5. Release at destination: Hand opens (grasp = 0), panel releases & snaps with spring pulse
        tl.to(
          state.char,
          {
            [graspKey]: 0.0,
            duration: 0.012,
            ease: "power1.out",
          },
          releaseTime
        );

        tl.set(
          state.panels[i],
          { isGrabbed: false },
          releaseTime
        );

        // Magnetic snap scale bounce
        tl.fromTo(
          state.panels[i].scale,
          { 0: 1.06, 1: 1.06, 2: 1.06 },
          { 0: 1.0, 1: 1.0, 2: 1.0, duration: 0.016, ease: "back.out(2.2)" },
          releaseTime
        );

        // Retract arm back towards resting zone
        tl.to(
          state.char[handKey],
          {
            x: isLeft ? -0.45 : 0.45,
            y: 0.8,
            z: 0.1,
            duration: panelDuration * 0.12,
            ease: "power2.inOut",
          },
          releaseTime + 0.005
        );

        // Illuminate connection line if this panel completes a logical connection
        const connIndex = CONNECTION_LINES.findIndex(
          (c) => c.toId === panel.id || c.fromId === panel.id
        );
        if (connIndex >= 0 && state.lines[connIndex]) {
          tl.to(
            state.lines[connIndex],
            { opacity: 1.0, duration: 0.02, ease: "power1.in" },
            releaseTime
          );
        }
      });

      // ── STAGE C: 80% → 92% — Unified Workspace & Connection Matrix ──
      tl.to(".hero-phase-label.phase-2", { opacity: 0, y: -6, duration: 0.02 }, 0.79);
      tl.to(".hero-phase-label.phase-3", { opacity: 1, y: 0, duration: 0.02 }, 0.80);

      // Character recenters, stands proud behind unified workspace
      tl.to(
        state.char,
        {
          bodyRotY: 0,
          idleWeight: 0.8,
          duration: 0.08,
          ease: "power2.inOut",
        },
        0.80
      );

      // Hand targets rest naturally
      tl.to(
        state.char.leftHandTarget,
        { x: -0.48, y: 0.85, z: 0.05, duration: 0.06 },
        0.80
      );
      tl.to(
        state.char.rightHandTarget,
        { x: 0.48, y: 0.85, z: 0.05, duration: 0.06 },
        0.80
      );

      // Camera smoothly pushes in to frame the assembled command center
      tl.to(
        state.camera,
        {
          z: 5.2,
          y: 0.65,
          duration: 0.12,
          ease: "power2.inOut",
        },
        0.80
      );

      // Workspace subtle unified scale pulse
      tl.to(
        state,
        {
          workspaceScale: 1.025,
          duration: 0.04,
          yoyo: true,
          repeat: 1,
          ease: "sine.inOut",
        },
        0.84
      );

      // ── STAGE D: 92% → 100% — Final Brand Reveal ──
      tl.to(
        ".hero-reveal",
        {
          opacity: 1,
          y: 0,
          duration: 0.06,
          ease: "power2.out",
        },
        0.92
      );

      tl.to(
        ".hero-reveal-text",
        {
          opacity: 1,
          y: 0,
          duration: 0.05,
          stagger: 0.02,
          ease: "power2.out",
        },
        0.93
      );
    });

    return () => ctx.revert();
  }, [containerRef, animState]);
}
