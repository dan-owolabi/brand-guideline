'use client'

import { useEffect, useRef, useState } from 'react';

/**
 * Dropdown with an enter/exit transition.
 *
 * `.t-dropdown` is `opacity: 0; pointer-events: none` in CSS and only becomes
 * visible once `is-open` is added to the element. That class is applied here
 * imperatively rather than through React, so the browser gets a frame with the
 * closed styles before the open ones and actually animates the transition.
 *
 * The subtle part is WHEN it can be applied. Adding it in the same effect that
 * calls setMounted(true) does not work: at that point the element has not been
 * rendered yet, so the ref is still null and the class silently goes nowhere —
 * leaving a dropdown that is mounted, occupies layout, and is invisible
 * forever, because the effect never runs again. Splitting it into a second
 * effect keyed on `mounted` guarantees the element exists first.
 */
export default function AnimatedDropdown({ isOpen, onClose, children, origin = "top-right", className = "" }) {
    const [mounted, setMounted] = useState(false);
    const dropdownRef = useRef(null);

    // Mount on open; delay unmount until the close transition has run.
    useEffect(() => {
        if (isOpen) {
            setMounted(true);
            return;
        }
        const el = dropdownRef.current;
        if (!el) return;

        el.classList.remove("is-open");
        el.classList.add("is-closing");

        const closeMs = parseFloat(
            getComputedStyle(document.documentElement).getPropertyValue("--dropdown-close-dur")
        ) || 150;

        const timer = setTimeout(() => setMounted(false), closeMs);
        return () => clearTimeout(timer);
    }, [isOpen]);

    // Runs only after the element is in the DOM, so the ref is guaranteed.
    useEffect(() => {
        if (!mounted || !isOpen) return;
        const frame = requestAnimationFrame(() => {
            const el = dropdownRef.current;
            if (!el) return;
            el.classList.remove("is-closing");
            el.classList.add("is-open");
        });
        return () => cancelAnimationFrame(frame);
    }, [mounted, isOpen]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (isOpen && dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                onClose();
            }
        };

        // Attached on the next tick so the click that opened the menu does not
        // immediately close it again.
        const timeoutId = setTimeout(() => {
            if (isOpen) document.addEventListener('click', handleClickOutside);
        }, 0);

        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener('click', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!mounted) return null;

    return (
        <div
            ref={dropdownRef}
            className={`t-dropdown absolute z-50 ${className}`}
            data-origin={origin}
            onClick={(e) => e.stopPropagation()}
        >
            {children}
        </div>
    );
}
