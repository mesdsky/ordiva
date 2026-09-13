"use client";

import {
  createContext,
  useContext,
  useEffect,
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

  const setDirty = (dirty: boolean) => {
    setIsDirty(dirty);
  };

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
      value={{
        isDirty,
        setDirty,
      }}
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