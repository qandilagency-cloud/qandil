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
  const [open, setOpen] = useState(false);
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

        <nav id="main-navigation" className={open ? "open" : ""} aria-label="التنقل الرئيسي">
          {links.map(([label, href]) => (
            <a key={href} href={href} onClick={() => setOpen(false)}>
              {label}
            </a>
          ))}
          <div className="mobileCtaCluster">
            <a className="mobileCta" href="#contact" onClick={() => setOpen(false)}>
              ابدأ مشروعك
            </a>
            <span className="ctaMarks" aria-hidden="true"><i /><i /><i /></span>
          </div>
        </nav>

        <div className="ctaCluster">
          <a className="cta" href="#contact">ابدأ مشروعك</a>
          <span className="ctaMarks" aria-hidden="true"><i /><i /><i /></span>
        </div>

        <button
          className={open ? "menu open" : "menu"}
          type="button"
          aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
          aria-expanded={open}
          aria-controls="main-navigation"
          onClick={() => setOpen((value) => !value)}
        >
          <i />
          <i />
          <i />
        </button>
      </div>

      <style jsx>{`
        .navbar {
          position: fixed !important;
          top: 0 !important;
          right: 0 !important;
          left: 0 !important;
          z-index: 1000 !important;
          width: 100%;
          height: 72px !important;
          min-height: 72px !important;
          max-height: 72px !important;
          padding-top: 0 !important;
          padding-bottom: 0 !important;
          margin: 0 !important;
          transform: none !important;
          box-sizing: border-box !important;
          border-top: 0 !important;
          outline: none;
          background: rgba(255, 255, 255, 0.42) !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.62) !important;
          box-shadow:
            0 8px 30px rgba(5, 25, 50, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.7) !important;
          -webkit-backdrop-filter: blur(20px) saturate(145%) !important;
          backdrop-filter: blur(20px) saturate(145%) !important;
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
          background: rgba(255, 255, 255, 0.68) !important;
          border-bottom-color: rgba(255, 255, 255, 0.78) !important;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85);
          -webkit-backdrop-filter: blur(24px) saturate(155%);
          backdrop-filter: blur(24px) saturate(155%);
        }
        .inner {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: min(calc(100% - 48px), 1200px);
          height: 100% !important;
          min-height: 0 !important;
          max-height: 72px !important;
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
        nav > a:not(.mobileCta),
        nav > a:not(.mobileCta):visited {
          position: relative;
          padding-block: 14px;
          color: #5f6875;
          font-size: 0.94rem;
          font-weight: 500;
          text-shadow: none;
          white-space: nowrap;
          transition: color 0.22s ease;
        }
        nav > a:not(.mobileCta):hover,
        nav > a:not(.mobileCta):focus-visible {
          color: #1450ff;
        }
        nav > a:not(.mobileCta).active,
        nav > a:not(.mobileCta)[aria-current="page"] {
          color: #1450ff;
        }
        .cta,
        .cta:visited,
        .mobileCta,
        .mobileCta:visited {
          border: 1px solid #1450ff;
          border-radius: 999px;
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
          height: 42px !important;
          min-height: 42px !important;
          padding: 0 24px !important;
          white-space: nowrap;
        }
        .ctaCluster,
        .mobileCtaCluster {
          display: flex;
          direction: rtl;
          align-items: center;
          gap: 12px;
        }
        .ctaMarks {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          flex: 0 0 auto;
          width: 22px;
          height: 18px;
          color: #1450ff;
          pointer-events: none;
        }
        .ctaMarks i {
          display: block;
          width: 18px;
          height: 2px;
          border-radius: 999px;
          background: currentColor;
        }
        .cta:hover,
        .mobileCta:hover,
        .cta:focus-visible,
        .mobileCta:focus-visible {
          border-color: #063ee6;
          background: #063ee6;
          color: #ffffff;
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(20, 80, 255, 0.35);
        }
        .cta:active,
        .mobileCta:active {
          transform: translateY(0) scale(0.98);
        }
        .cta:focus-visible,
        .mobileCta:focus-visible {
          outline: 3px solid rgba(20, 80, 255, 0.35);
          outline-offset: 3px;
        }
        .mobileCtaCluster,
        .menu {
          display: none;
        }
        a:focus-visible,
        button:focus-visible {
          outline: 2px solid #19a4c2;
          outline-offset: 4px;
        }
        @media (max-width: 900px) {
          .inner {
            display: flex;
            justify-content: space-between;
            width: calc(100% - 32px);
            height: 100%;
            min-height: 0;
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
          .ctaCluster { display: none; }
          .menu {
            display: grid;
            place-content: center;
            gap: 5px;
            width: 44px;
            height: 44px;
            border: 1px solid rgba(20, 80, 255, 0.32);
            border-radius: 50%;
            background: transparent;
            cursor: pointer;
          }
          .menu i {
            width: 20px;
            height: 2px;
            border-radius: 2px;
            background: #1450ff;
            transition: transform 180ms ease, opacity 180ms ease;
          }
          .menu.open i:first-child { transform: translateY(7px) rotate(45deg); }
          .menu.open i:nth-child(2) { opacity: 0; }
          .menu.open i:last-child { transform: translateY(-7px) rotate(-45deg); }
          nav {
            position: absolute;
            top: calc(100% + 1px);
            right: -16px;
            left: -16px;
            flex-direction: column;
            align-items: stretch;
            gap: 0;
            padding: 10px 16px 22px;
            background: rgba(255, 255, 255, 0.82);
            border-bottom: 1px solid rgba(255, 255, 255, 0.78);
            box-shadow: 0 18px 30px rgba(5, 25, 50, 0.12);
            -webkit-backdrop-filter: blur(26px) saturate(150%);
            backdrop-filter: blur(26px) saturate(150%);
            opacity: 0;
            visibility: hidden;
            transform: translateY(-8px);
            transition: opacity 180ms ease, transform 180ms ease, visibility 180ms ease;
          }
          nav.open {
            opacity: 1;
            visibility: visible;
            transform: none;
          }
          nav > a:not(.mobileCta) {
            padding: 15px 8px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            color: #5f6875;
            text-shadow: none;
          }
          .mobileCta {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 13px 22px;
            text-align: center;
          }
          .mobileCtaCluster {
            display: flex;
            justify-content: center;
            margin-top: 18px;
          }
        }
        @media (max-width: 768px) {
          .navbar {
            height: 62px !important;
            min-height: 62px !important;
            max-height: 62px !important;
          }
          .inner {
            max-height: 62px !important;
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
          .cta,
          .mobileCta {
            min-height: 42px;
            padding: 9px 18px;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          * { transition-duration: 0.01ms !important; }
        }
      `}</style>
    </header>
  );
}
