"use client";

import React, { useEffect, useState } from "react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check local storage or system preference
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = savedTheme === "dark" || (!savedTheme && systemPrefersDark);
    
    if (shouldBeDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Safely update state on mount outside the main render/effect stack
    const frameId = requestAnimationFrame(() => {
      setIsDark(shouldBeDark);
    });

    return () => cancelAnimationFrame(frameId);
  }, []);

  const handleToggle = (e) => {
    const checked = e.target.checked;
    
    const updateTheme = () => {
      setIsDark(checked);
      if (checked) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
    };

    if (typeof window !== "undefined" && document.startViewTransition) {
      // Determine direction and set transitional classes on documentElement
      const transitionClass = checked ? "theme-transition-to-dark" : "theme-transition-to-light";
      document.documentElement.classList.add(transitionClass);

      // Add a sweeping vertical glowing neon line overlay
      const sweepLine = document.createElement("div");
      sweepLine.style.position = "fixed";
      sweepLine.style.top = "0";
      sweepLine.style.bottom = "0";
      sweepLine.style.width = "4px";
      // Glowing neon gradient that matches the theme transition direction
      sweepLine.style.background = checked 
        ? "linear-gradient(to bottom, #66f4ff, #007399, #a855f7)" 
        : "linear-gradient(to bottom, #007399, #66c4ff, #facc15)";
      sweepLine.style.boxShadow = checked
        ? "0 0 25px 6px rgba(102, 244, 255, 0.7), 0 0 10px 2px rgba(168, 85, 247, 0.4)"
        : "0 0 25px 6px rgba(102, 196, 255, 0.7), 0 0 10px 2px rgba(250, 204, 21, 0.4)";
      sweepLine.style.zIndex = "999999";
      sweepLine.style.pointerEvents = "none";
      
      // Set start position based on transition direction
      sweepLine.style.left = checked ? "0%" : "100%";
      sweepLine.style.transition = "left 0.8s cubic-bezier(0.4, 0, 0.2, 1)";
      document.body.appendChild(sweepLine);

      // Start the view transition and update DOM
      const transition = document.startViewTransition(() => {
        updateTheme();
      });

      // Remove transition classes when completed
      transition.finished.then(() => {
        document.documentElement.classList.remove("theme-transition-to-dark", "theme-transition-to-light");
      });

      // Animate the line to target position immediately
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          sweepLine.style.left = checked ? "100%" : "0%";
        });
      });

      // Remove the line once completed
      setTimeout(() => {
        sweepLine.remove();
      }, 850);
    } else {
      updateTheme();
    }
  };

  return (
    <div className="theme-switch-wrapper mr-1">
      <label className="switch" htmlFor="theme-input">
        <span className="sr-only">Toggle dark mode</span>
        <input
          id="theme-input"
          type="checkbox"
          checked={isDark}
          onChange={handleToggle}
        />
        <div className="slider round">
          <div className="sun-moon">
            <svg id="moon-dot-1" className="moon-dot" viewBox="0 0 100 100">
              <circle cx={50} cy={50} r={50} />
            </svg>
            <svg id="moon-dot-2" className="moon-dot" viewBox="0 0 100 100">
              <circle cx={50} cy={50} r={50} />
            </svg>
            <svg id="moon-dot-3" className="moon-dot" viewBox="0 0 100 100">
              <circle cx={50} cy={50} r={50} />
            </svg>
            <svg id="light-ray-1" className="light-ray" viewBox="0 0 100 100">
              <circle cx={50} cy={50} r={50} />
            </svg>
            <svg id="light-ray-2" className="light-ray" viewBox="0 0 100 100">
              <circle cx={50} cy={50} r={50} />
            </svg>
            <svg id="light-ray-3" className="light-ray" viewBox="0 0 100 100">
              <circle cx={50} cy={50} r={50} />
            </svg>
            <svg id="cloud-1" className="cloud-dark" viewBox="0 0 100 100">
              <circle cx={50} cy={50} r={50} />
            </svg>
            <svg id="cloud-2" className="cloud-dark" viewBox="0 0 100 100">
              <circle cx={50} cy={50} r={50} />
            </svg>
            <svg id="cloud-3" className="cloud-dark" viewBox="0 0 100 100">
              <circle cx={50} cy={50} r={50} />
            </svg>
            <svg id="cloud-4" className="cloud-light" viewBox="0 0 100 100">
              <circle cx={50} cy={50} r={50} />
            </svg>
            <svg id="cloud-5" className="cloud-light" viewBox="0 0 100 100">
              <circle cx={50} cy={50} r={50} />
            </svg>
            <svg id="cloud-6" className="cloud-light" viewBox="0 0 100 100">
              <circle cx={50} cy={50} r={50} />
            </svg>
          </div>
          <div className="stars">
            <svg id="star-1" className="star" viewBox="0 0 20 20">
              <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z" />
            </svg>
            <svg id="star-2" className="star" viewBox="0 0 20 20">
              <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z" />
            </svg>
            <svg id="star-3" className="star" viewBox="0 0 20 20">
              <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z" />
            </svg>
            <svg id="star-4" className="star" viewBox="0 0 20 20">
              <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z" />
            </svg>
          </div>
        </div>
      </label>
    </div>
  );
}
