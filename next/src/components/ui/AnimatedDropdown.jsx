'use client'

import { useEffect, useRef, useState } from 'react';

export default function AnimatedDropdown({ isOpen, onClose, children, origin = "top-right", className = "" }) {
    const [mounted, setMounted] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setMounted(true);
            requestAnimationFrame(() => {
                if (dropdownRef.current) dropdownRef.current.classList.add("is-open");
            });
        } else if (mounted && dropdownRef.current) {
            dropdownRef.current.classList.remove("is-open");
            dropdownRef.current.classList.add("is-closing");
            
            const closeMs = parseFloat(
                getComputedStyle(document.documentElement).getPropertyValue("--dropdown-close-dur")
            ) || 150;
            
            setTimeout(() => {
                setMounted(false);
            }, closeMs);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (isOpen && dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                // Ensure we don't close if clicking the trigger button
                // The parent should handle trigger clicks, but just in case:
                onClose();
            }
        };

        // Delay attaching to avoid immediate close on open click
        const timeoutId = setTimeout(() => {
            if (isOpen) {
                document.addEventListener('click', handleClickOutside);
            }
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