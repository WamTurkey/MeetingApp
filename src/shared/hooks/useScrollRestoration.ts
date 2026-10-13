import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/** location.key → scrollTop (oturum boyunca bellekte) */
const positions = new Map<string, number>();

/**
 * Kaydırılabilir bir kapsayıcı (AppLayout `<main>`) için kaydırma konumu yönetimi.
 * React Router'ın `<ScrollRestoration />` bileşeni yalnızca `window` kaydırmasını yönetir; uygulamada
 * kaydırma `<main overflow-y-auto>` içinde olduğu için bu hook kullanılır.
 *
 * - PUSH (yeni sayfa)      → en üste
 * - POP (geri / ileri)     → o kayda ait konuma dön (içerik geç render olursa birkaç kare tekrar dener)
 * - REPLACE (filtre/modal) → konuma dokunma (URL parametresi değişimi kaydırmayı sıfırlamaz)
 */
export function useScrollRestoration(ref: RefObject<HTMLElement | null>) {
  const location = useLocation();
  const navigationType = useNavigationType();
  const keyRef = useRef(location.key);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => positions.set(keyRef.current, el.scrollTop);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [ref]);

  useLayoutEffect(() => {
    const el = ref.current;
    keyRef.current = location.key;
    if (!el) return;

    if (navigationType === "REPLACE") {
      positions.set(location.key, el.scrollTop);
      return;
    }
    if (navigationType === "PUSH") {
      el.scrollTop = 0;
      return;
    }

    const target = positions.get(location.key) ?? 0;
    el.scrollTop = target;
    let tries = 0;
    let frame = 0;
    const retry = () => {
      if (Math.abs(el.scrollTop - target) < 2 || tries++ > 15) return;
      el.scrollTop = target;
      frame = requestAnimationFrame(retry);
    };
    frame = requestAnimationFrame(retry);
    return () => cancelAnimationFrame(frame);
  }, [location.key, navigationType, ref]);
}
