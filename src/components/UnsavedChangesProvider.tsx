"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type UnsavedChangesContextType = {
  isDirty: boolean;
  setDirty: (dirty: boolean) => void;
};

const UnsavedChangesContext =
  createContext<UnsavedChangesContextType | undefined>(
    undefined
  );

export function UnsavedChangesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [isDirty, setIsDirty] = useState(false);

  // Stable identity: pages list setDirty in effect deps, and a new
  // function per render would re-run their data loads on every edit.
  const setDirty = useCallback((dirty: boolean) => {
    setIsDirty(dirty);
  }, []);

  const value = useMemo(
    () => ({ isDirty, setDirty }),
    [isDirty, setDirty]
  );

  useEffect(() => {
    const handleBeforeUnload = (
      event: BeforeUnloadEvent
    ) => {
      if (!isDirty) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener(
      "beforeunload",
      handleBeforeUnload
    );

    return () => {
      window.removeEventListener(
        "beforeunload",
        handleBeforeUnload
      );
    };
  }, [isDirty]);

  return (
    <UnsavedChangesContext.Provider
      value={value}
    >
      {children}
    </UnsavedChangesContext.Provider>
  );
}

export function useUnsavedChanges() {
  const context = useContext(
    UnsavedChangesContext
  );

  if (!context) {
    throw new Error(
      "useUnsavedChanges must be used inside UnsavedChangesProvider"
    );
  }

  return context;
}