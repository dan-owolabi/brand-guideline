import { useEffect, useRef, useState } from 'react';

export default function AnimatedTabs({ tabs, activeTab, onChange }) {
    const barRef = useRef(null);
    const pillRef = useRef(null);
    const tabRefs = useRef([]);

    const moveTo = (tabElement, animate) => {
        if (!pillRef.current || !tabElement) return;
        
        if (!animate) {
            const prev = pillRef.current.style.transition;
            pillRef.current.style.transition = "none";
            pillRef.current.style.transform = `translateX(${tabElement.offsetLeft}px)`;
            pillRef.current.style.width = `${tabElement.offsetWidth}px`;
            void pillRef.current.offsetWidth;
            pillRef.current.style.transition = prev;
        } else {
            pillRef.current.style.transform = `translateX(${tabElement.offsetLeft}px)`;
            pillRef.current.style.width = `${tabElement.offsetWidth}px`;
        }
    };

    useEffect(() => {
        const activeIndex = tabs.findIndex(t => t.id === activeTab);
        if (activeIndex >= 0 && tabRefs.current[activeIndex]) {
            moveTo(tabRefs.current[activeIndex], true);
        }
    }, [activeTab]);

    useEffect(() => {
        const activeIndex = tabs.findIndex(t => t.id === activeTab);
        if (activeIndex >= 0 && tabRefs.current[activeIndex]) {
            requestAnimationFrame(() => moveTo(tabRefs.current[activeIndex], false));
        }

        const handleResize = () => {
            const currentActiveIndex = tabs.findIndex(t => t.id === activeTab);
            if (currentActiveIndex >= 0 && tabRefs.current[currentActiveIndex]) {
                moveTo(tabRefs.current[currentActiveIndex], false);
            }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <div ref={barRef} className="t-tabs bg-gray-100/50 p-1 rounded-full inline-flex items-center" role="tablist">
            <span ref={pillRef} className="t-tabs-pill" aria-hidden="true"></span>
            {tabs.map((tab, i) => (
                <button
                    key={tab.id}
                    ref={el => tabRefs.current[i] = el}
                    onClick={() => onChange(tab.id)}
                    className="t-tab px-4 py-2"
                    role="tab"
                    aria-selected={activeTab === tab.id ? "true" : "false"}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
