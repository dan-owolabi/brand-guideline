'use client'

import { useEffect, useRef, useState } from 'react';

export default function AnimatedModal({ isOpen, onClose, children, maxWidth = "max-w-lg" }) {
    const [mounted, setMounted] = useState(false);
    const modalRef = useRef(null);
    const backdropRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setMounted(true);
            requestAnimationFrame(() => {
                if (modalRef.current) modalRef.current.classList.add("is-open");
                if (backdropRef.current) {
                    backdropRef.current.classList.add("opacity-100");
                    backdropRef.current.classList.remove("opacity-0");
                }
            });
        } else if (mounted && modalRef.current) {
            modalRef.current.classList.remove("is-open");
            modalRef.current.classList.add("is-closing");
            
            if (backdropRef.current) {
                backdropRef.current.classList.remove("opacity-100");
                backdropRef.current.classList.add("opacity-0");
            }
            
            const closeMs = parseFloat(
                getComputedStyle(document.documentElement).getPropertyValue("--modal-close-dur")
            ) || 150;
            
            setTimeout(() => {
                setMounted(false);
            }, closeMs);
        }
    }, [isOpen]);

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