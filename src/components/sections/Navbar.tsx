"use client";

import { useEffect, useState } from "react";

const links = [
  ["الرئيسية", "#home"],
  ["خدماتنا", "#services"],
  ["أعمالنا", "#work"],
  ["من نحن", "#about"],
  ["تواصل معنا", "#contact"],
] as const;

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`navbar ${scrolled ? "header-scrolled" : ""}`}
      dir="rtl"
    >
      <div className="inner">
        <a
          className="header-logo"
          href="/"
          aria-label="العودة إلى الصفحة الرئيسية"
        >
          <span className="header-logo-word">قنديل</span>
          <img
            src="/qandil-logo.png"
            alt="شعار قنديل"
            className="header-logo-image"
          />
        </a>

        <nav id="main-navigation" aria-label="التنقل الرئيسي">
          {links.map(([label, href], index) => (
            <a
              key={href}
              href={href}
              className={`navLink ${index === 0 ? "navLinkActive" : ""}`}
              aria-current={index === 0 ? "page" : undefined}
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="ctaCluster">
          <a className="cta header-cta" href="#contact">
            <span>ابدأ مشروعك</span>
            <svg
              className="header-chevron"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </a>
        </div>

      </div>

      <style jsx>{`
        .navbar {
          position: fixed !important;
          top: 16px !important;
          right: auto !important;
          left: 50% !important;
          z-index: 100 !important;
          width: calc(100% - 72px);
          max-width: 1760px;
          height: 76px !important;
          min-height: 76px !important;
          max-height: 76px !important;
          padding-top: 0 !important;
          padding-bottom: 0 !important;
          margin: 0 !important;
          transform: translateX(-50%) !important;
          box-sizing: border-box !important;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.55) !important;
          border-radius: 22px;
          outline: none;
          background: rgba(235, 250, 250, 0.3) !important;
          box-shadow:
            0 12px 36px rgba(0, 19, 39, 0.12),
            inset 0 1px 0 rgba(255, 255, 255, 0.45) !important;
          -webkit-backdrop-filter: blur(20px) saturate(135%) !important;
          backdrop-filter: blur(20px) saturate(135%) !important;
          transition:
            background-color 0.35s ease,
            backdrop-filter 0.35s ease,
            border-color 0.35s ease,
            box-shadow 0.35s ease;
        }
        .navbar::before,
        .navbar::after {
          border-top: 0 !important;
        }
        .navbar.header-scrolled {
          background: rgba(235, 250, 250, 0.4) !important;
          border-color: rgba(255, 255, 255, 0.62) !important;
          box-shadow:
            0 14px 40px rgba(0, 19, 39, 0.14),
            inset 0 1px 0 rgba(255, 255, 255, 0.5) !important;
          -webkit-backdrop-filter: blur(22px) saturate(140%);
          backdrop-filter: blur(22px) saturate(140%);
        }
        .inner {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: min(calc(100% - 48px), 1200px);
          height: 100% !important;
          min-height: 0 !important;
          max-height: 76px !important;
          margin-inline: auto;
          padding-top: 0 !important;
          padding-bottom: 0 !important;
          border-top: 0 !important;
          outline: none;
          background: transparent;
        }
        .header-logo {
          display: inline-flex;
          direction: rtl;
          justify-self: start;
          align-items: center;
          justify-content: center;
          gap: 10px;
          flex-shrink: 0;
          padding: 0 8px;
          color: #6f7884;
          line-height: 1;
          text-decoration: none;
        }
        .header-logo-word {
          display: block;
          color: #6f7884;
          font-family: var(--font-cairo), "Cairo", Tahoma, sans-serif;
          font-size: 1.65rem;
          font-weight: 700;
          line-height: 1;
          letter-spacing: -0.035em;
          white-space: nowrap;
        }
        .header-logo-image {
          display: block;
          width: auto;
          height: 36px !important;
          max-height: 36px !important;
          max-width: 42px;
          object-fit: contain;
        }
        nav {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: clamp(18px, 2.2vw, 34px);
        }
        .navLink,
        .navLink:visited,
        .navLinkActive {
          position: relative;
          padding-block: 14px;
          color: #5f6875;
          font-size: 0.94rem;
          font-weight: 500;
          text-decoration: none;
          border-bottom: 0;
          box-shadow: none;
          text-shadow: none;
          white-space: nowrap;
          transition: color 200ms ease;
        }
        .navLink::after,
        .navLinkActive::after {
          display: none;
          content: none;
        }
        .navLink:hover,
        .navLink:focus-visible {
          color: #1450ff;
          text-decoration: none;
        }
        .cta,
        .cta:visited {
          border: 1px solid #1450ff;
          border-radius: 14px;
          background: #1450ff;
          color: #ffffff;
          font-weight: 700;
          box-shadow: 0 8px 24px rgba(20, 80, 255, 0.25);
          transition:
            background-color 0.25s ease,
            border-color 0.25s ease,
            transform 0.25s ease,
            box-shadow 0.25s ease;
        }
        .cta {
          display: inline-flex;
          justify-self: end;
          align-items: center;
          justify-content: center;
          gap: 14px;
          min-width: 190px;
          width: auto;
          height: 58px !important;
          min-height: 58px !important;
          max-height: 58px !important;
          padding-inline: 24px !important;
          box-sizing: border-box;
          line-height: 1;
          white-space: nowrap;
        }
        .header-chevron {
          width: 18px;
          height: 18px;
          flex: 0 0 auto;
          fill: none;
          stroke: currentColor;
          stroke-width: 2.5;
          stroke-linecap: round;
          stroke-linejoin: round;
          color: #ffffff;
          transition: transform 220ms ease;
        }
        .cta:hover .header-chevron,
        .cta:focus-visible .header-chevron {
          transform: translateX(-4px);
        }
        .ctaCluster {
          display: flex;
          direction: rtl;
          align-items: center;
          gap: 12px;
        }
        .cta:hover,
        .cta:focus-visible {
          border-color: #063ee6;
          background: #063ee6;
          color: #ffffff;
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(20, 80, 255, 0.35);
        }
        .cta:active {
          transform: translateY(0) scale(0.98);
        }
        .cta:focus-visible {
          outline: 3px solid rgba(20, 80, 255, 0.35);
          outline-offset: 3px;
        }
        a:focus-visible,
        button:focus-visible {
          outline: 2px solid #19a4c2;
          outline-offset: 4px;
        }
        @media (max-width: 900px) {
          .navbar {
            top: 10px !important;
            width: calc(100% - 20px);
            height: 68px !important;
            min-height: 68px !important;
            max-height: 68px !important;
            border-radius: 18px;
          }
          .inner {
            display: flex;
            justify-content: space-between;
            width: calc(100% - 32px);
            height: 100%;
            min-height: 0;
            max-height: 68px !important;
          }
          .header-logo {
            gap: 8px;
            padding-block: 0;
          }
          .header-logo-word {
            font-size: 1.4rem;
          }
          .header-logo-image {
            height: 32px !important;
            max-height: 32px !important;
            max-width: 36px;
          }
          nav {
            display: none;
          }
        }
        @media (max-width: 768px) {
          .inner {
            max-height: 68px !important;
            padding-top: 0;
            padding-bottom: 0;
          }
          .header-logo-image {
            height: 30px !important;
            max-height: 30px !important;
          }
          .header-logo-word {
            font-size: 1.3rem;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          * { transition-duration: 0.01ms !important; }
        }
      `}</style>
    </header>
  );
}
