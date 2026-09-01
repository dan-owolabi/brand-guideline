'use client'

import { useEffect, useRef, useState } from 'react';

/**
 * Modal with an enter/exit transition.
 *
 * Same mount-order constraint as AnimatedDropdown: `.t-modal` is invisible
 * until `is-open` is set on the element, and that cannot be done in the effect
 * that calls setMounted(true) because the element does not exist yet — the ref
 * is null, the class is dropped, and the modal renders as a permanently
 * invisible overlay that still swallows clicks on the page behind it. The
 * second effect below runs only once `mounted` is true, so the ref is real.
 */
export default function AnimatedModal({ isOpen, onClose, children, maxWidth = "max-w-lg" }) {
    const [mounted, setMounted] = useState(false);
    const modalRef = useRef(null);
    const backdropRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setMounted(true);
            return;
        }
        const el = modalRef.current;
        if (!el) return;

        el.classList.remove("is-open");
        el.classList.add("is-closing");

        if (backdropRef.current) {
            backdropRef.current.classList.remove("opacity-100");
            backdropRef.current.classList.add("opacity-0");
        }

        const closeMs = parseFloat(
            getComputedStyle(document.documentElement).getPropertyValue("--modal-close-dur")
        ) || 150;

        const timer = setTimeout(() => setMounted(false), closeMs);
        return () => clearTimeout(timer);
    }, [isOpen]);

    useEffect(() => {
        if (!mounted || !isOpen) return;
        const frame = requestAnimationFrame(() => {
            const el = modalRef.current;
            if (el) {
                el.classList.remove("is-closing");
                el.classList.add("is-open");
            }
            if (backdropRef.current) {
                backdropRef.current.classList.add("opacity-100");
                backdropRef.current.classList.remove("opacity-0");
            }
        });
        return () => cancelAnimationFrame(frame);
    }, [mounted, isOpen]);

    if (!mounted) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                ref={backdropRef}
                className="absolute inset-0 bg-black/20 backdrop-blur-[2px] opacity-0 transition-opacity duration-200"
                onClick={onClose}
            ></div>
            <div ref={modalRef} className={`t-modal relative z-10 w-full ${maxWidth}`}>
                {children}
            </div>
        </div>
    );
}
