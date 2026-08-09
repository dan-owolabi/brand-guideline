import { useRef, useEffect } from 'react';

export default function TiltCard({ children, className = '', onClick }) {
    const tiltRef = useRef(null);
    const cardRef = useRef(null);
    
    useEffect(() => {
        const tilt = tiltRef.current;
        const card = cardRef.current;
        if (!tilt || !card) return;
        
        const reduce = matchMedia("(prefers-reduced-motion: reduce)");
        const MAX = 14;

        function reset() {
            tilt.classList.remove("is-hover");
            card.classList.remove("is-tilting");
            card.style.setProperty("--tilt-rx", "0deg");
            card.style.setProperty("--tilt-ry", "0deg");
        }

        function track(e) {
            if (reduce.matches) return;
            const r = tilt.getBoundingClientRect();
            const px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
            const py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
            tilt.classList.add("is-hover");
            card.classList.add("is-tilting");
            card.style.setProperty("--tilt-ry", ((px - 0.5) * MAX).toFixed(2) + "deg");
            card.style.setProperty("--tilt-rx", ((0.5 - py) * MAX).toFixed(2) + "deg");
            card.style.setProperty("--tilt-gx", (px * 100).toFixed(1) + "%");
            card.style.setProperty("--tilt-gy", (py * 100).toFixed(1) + "%");
        }

        const handleDown = (e) => {
            if (e.pointerType !== "mouse") {
                try { tilt.setPointerCapture(e.pointerId); } catch { /* pointer capture unsupported — ignore */ }
            }
        };
        const handleLeave = (e) => {
            if (e.pointerType === "mouse") reset();
        };

        tilt.addEventListener("pointerdown", handleDown);
        tilt.addEventListener("pointermove", track);
        tilt.addEventListener("pointerup", reset);
        tilt.addEventListener("pointercancel", reset);
        tilt.addEventListener("pointerleave", handleLeave);
        
        return () => {
            tilt.removeEventListener("pointerdown", handleDown);
            tilt.removeEventListener("pointermove", track);
            tilt.removeEventListener("pointerup", reset);
            tilt.removeEventListener("pointercancel", reset);
            tilt.removeEventListener("pointerleave", handleLeave);
        }
    }, []);

    return (
        <div ref={tiltRef} className={`t-tilt cursor-pointer ${className}`} onClick={onClick}>
            <div ref={cardRef} className="t-tilt-card w-full h-full bg-white rounded-2xl shadow-soft border border-gray-100 flex flex-col items-center justify-center">
                {children}
                <div className="t-tilt-glare rounded-2xl"></div>
            </div>
        </div>
    );
}
