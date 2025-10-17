import type React from "react";
import type { Descriptor } from "@react-navigation/native";
import { RootTransitionAware } from "../components/root-transition-aware";
import { ScreenGestureProvider } from "./gestures";
import { KeysProvider } from "./keys";
import { TransitionStylesProvider } from "./transition-styles";

type AnyDescriptor = Descriptor<any, any, any>;

type ScreenLifecycleComponent = React.ComponentType<{
  children: React.ReactNode;
}>;

type ScreenTransitionProviderProps<DescriptorType extends AnyDescriptor> = {
  previous?: DescriptorType;
  current: DescriptorType;
  next?: DescriptorType;
  children: React.ReactNode;
};

type CreateScreenTransitionProviderOptions = {
  defaultEnableTransitions?: boolean;
};

export function createScreenTransitionProvider<
  DescriptorType extends AnyDescriptor
>(
  ScreenLifecycleComponent: ScreenLifecycleComponent,
  { defaultEnableTransitions = false }: CreateScreenTransitionProviderOptions = {}
) {
  return function ScreenTransitionProvider({
    previous,
    current,
    next,
    children,
  }: ScreenTransitionProviderProps<DescriptorType>) {
    return (
      <KeysProvider<DescriptorType>
        previous={previous}
        current={current}
        next={next}
      >
        <ScreenGestureProvider>
          <ScreenLifecycleComponent>
            <TransitionStylesProvider
              defaultEnableTransitions={defaultEnableTransitions}
            >
              <RootTransitionAware>{children}</RootTransitionAware>
            </TransitionStylesProvider>
          </ScreenLifecycleComponent>
        </ScreenGestureProvider>
      </KeysProvider>
    );
  };
}
