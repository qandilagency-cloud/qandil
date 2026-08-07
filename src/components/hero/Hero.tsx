import Scene from "@/components/scene/Scene";
import BouncingProgress from "@/components/progress/BouncingProgress";
import HeroBackground from "./HeroBackground";
import OceanEffects from "./OceanEffects";
import styles from "./Hero.module.css";

export default function Hero() {
  return (
    <section className={styles.hero}>
      <HeroBackground />
      <OceanEffects />
      <div className={styles.oceanVignette} aria-hidden="true" />

      <div className={styles.heroContent} dir="rtl">
        <p className={styles.heroEyebrow}>وكالة إبداعية متكاملة</p>

        <h1 className={styles.heroTitle}>
          <span>نحوّل طموحك</span>
          <span>إلى علامة تقود النمو.</span>
        </h1>

        <p className={styles.heroDescription}>
          في قنديل، نجمع الاستراتيجية والإبداع والتصميم والمحتوى والتقنية لبناء
          علامات مميّزة وتجارب متكاملة، تصنع أثرًا حقيقيًا وتنمو مع أعمالك.
        </p>

        <div className={styles.heroActions}>
          <a href="#contact" className={styles.heroPrimaryButton}>
            ابدأ مشروعك
          </a>
          <a href="#works" className={styles.heroSecondaryButton}>
            استكشف أعمالنا
          </a>
        </div>
      </div>

      <BouncingProgress />

      <div className={styles.canvasLayer}>
        <Scene />
      </div>
    </section>
  );
}
