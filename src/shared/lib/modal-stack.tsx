/**
 * ModalStack — manages z-index layering for nested modals.
 *
 * Each modal that mounts gets the next stack index. ESC only closes
 * the topmost modal. Overlay clicks only affect their own layer.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface ModalStackCtx {
  register: () => number;
  unregister: (idx: number) => void;
  topIndex: number;
}

const ModalStackContext = createContext<ModalStackCtx>({
  register: () => 0,
  unregister: () => {},
  topIndex: -1,
});

export function ModalStackProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<number[]>([]);
  const counterRef = useRef(0);

  const register = useCallback(() => {
    const idx = ++counterRef.current;
    setStack((prev) => [...prev, idx]);
    return idx;
  }, []);

  const unregister = useCallback((idx: number) => {
    setStack((prev) => prev.filter((i) => i !== idx));
  }, []);

  const topIndex = stack.length > 0 ? (stack[stack.length - 1] ?? -1) : -1;

  return (
    <ModalStackContext.Provider value={{ register, unregister, topIndex }}>
      {children}
    </ModalStackContext.Provider>
  );
}

/**
 * Hook for modals — returns { stackIndex, isTop, zIndex }.
 */
export function useModalStack(isOpen: boolean = true) {
  const { register, unregister, topIndex } = useContext(ModalStackContext);
  const indexRef = useRef<number | null>(null);
  const [stackIndex, setStackIndex] = useState<number>(0);

  useEffect(() => {
    if (!isOpen) return;
    const idx = register();
    indexRef.current = idx;
    setStackIndex(idx);
    return () => {
      unregister(idx);
      indexRef.current = null;
      setStackIndex(0);
    };
  }, [isOpen, register, unregister]);

  return {
    stackIndex,
    isTop: stackIndex === topIndex,
    zIndex: 50 + (stackIndex % 10) * 10,
  };
}
