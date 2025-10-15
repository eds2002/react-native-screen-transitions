import { createContext, useContext, useMemo } from "react";
import type { Descriptor } from "@react-navigation/native";
import type { NativeStackDescriptor } from "../types/native-stack.navigator";

type AnyDescriptor = Descriptor<any, any, any>;

type KeysContextValue = {
  previous?: AnyDescriptor;
  current: AnyDescriptor;
  next?: AnyDescriptor;
};

type KeysProviderProps<DescriptorType extends AnyDescriptor> = {
  children: React.ReactNode;
  previous?: DescriptorType;
  current: DescriptorType;
  next?: DescriptorType;
};

type KeysContextType<DescriptorType extends AnyDescriptor> = {
  previous?: DescriptorType;
  current: DescriptorType;
  next?: DescriptorType;
};

const KeysContext = createContext<KeysContextValue | undefined>(undefined);

export const KeysProvider = <DescriptorType extends AnyDescriptor>({
  children,
  previous,
  current,
  next,
}: KeysProviderProps<DescriptorType>) => {
  const value = useMemo(
    () => ({ previous, current, next }),
    [previous, current, next]
  ) as KeysContextValue;

  return <KeysContext.Provider value={value}>{children}</KeysContext.Provider>;
};

export const useKeys = <
  DescriptorType extends AnyDescriptor = NativeStackDescriptor
>(): KeysContextType<DescriptorType> => {
  const context = useContext(KeysContext);
  if (context === undefined) {
    throw new Error("useKeys must be used within a KeysProvider");
  }
  return context as KeysContextType<DescriptorType>;
};
