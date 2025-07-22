import {
  createNavigatorFactory,
  type EventListenerCallback,
  type NavigatorTypeBagBase,
  type ParamListBase,
  type RouteProp,
  type StackActionHelpers,
  type StackNavigationState,
  StackRouter,
  type StackRouterOptions,
  type TypedNavigator,
  useNavigationBuilder,
} from "@react-navigation/native";
import {
  type NativeStackNavigationEventMap,
  type NativeStackNavigationOptions,
  type NativeStackNavigationProp,
  type NativeStackNavigatorProps,
  NativeStackView,
} from "@react-navigation/native-stack";
import React, { Children, isValidElement, useMemo } from "react";
import type { Any, TransitionConfig } from "@/types";
import { createConfig } from "../utils";

export type TransitionStackNavigationEventMap = NativeStackNavigationEventMap;

export interface TransitionStackNavigationOptions
  extends Omit<NativeStackNavigationOptions, keyof TransitionConfig>,
    TransitionConfig {
  skipDefaultScreenOptions?: boolean;
}

export type TransitionStackNavigationProp<
  ParamList extends ParamListBase,
  RouteName extends keyof ParamList = string,
  NavigatorID extends string | undefined = undefined,
> = NativeStackNavigationProp<ParamList, RouteName, NavigatorID>;

export type TransitionStackNavigatorProps = NativeStackNavigatorProps;

export type TransitionStackScreenOptions<ParamList extends ParamListBase> =
  | TransitionStackNavigationOptions
  | ((props: {
      route: RouteProp<ParamList>;
      navigation: TransitionStackNavigationProp<ParamList>;
    }) => TransitionStackNavigationOptions);

export type TransitionStackScreenListeners<ParamList extends ParamListBase> =
  | Partial<{
      [EventName in keyof TransitionStackNavigationEventMap]: EventListenerCallback<
        TransitionStackNavigationEventMap,
        EventName
      >;
    }>
  | ((props: { route: RouteProp<ParamList>; navigation: TransitionStackNavigationProp<ParamList> }) => Partial<{
      [EventName in keyof TransitionStackNavigationEventMap]: EventListenerCallback<
        TransitionStackNavigationEventMap,
        EventName
      >;
    }>);

export interface TransitionStackScreenProps<ParamList extends ParamListBase> {
  name: string;
  component: React.ComponentType<Any>;
  options?: TransitionStackScreenOptions<ParamList>;
  listeners?: TransitionStackScreenListeners<ParamList>;
  initialParams?: ParamList[keyof ParamList];
  [key: string]: Any;
}

// Necessary screen options to ensure animations run smoothly
const DEFAULT_SCREEN_OPTIONS = {
  presentation: "containedTransparentModal",
  headerShown: false,
  animation: "none",
  /**
   * EXPERIMENTAL:
   When handling forward navigation, this would be the prop we would use to prevent the underlying screen from not being interactable.
    - pointerEvents: "box-none",
   */
} as const;

// Lib handles gestures. Default props to avoid conflicts with navigator
const CONFLICTING_SCREEN_OPTIONS = {
  gestureEnabled: false,
  gestureDirection: "horizontal",
} as const;

function TransitionableStackNavigator({
  id,
  initialRouteName,
  children,
  layout,
  screenListeners,
  screenOptions,
  screenLayout,
  UNSTABLE_router,
  ...rest
}: TransitionStackNavigatorProps) {
  // 1) Modify the screens first to adjust for our custom screen options, store these options for use later in the screenListeners.
  const screenProcessor = useMemo(() => {
    const childOptions = new Map<string, TransitionStackNavigationOptions>();

    const modifiedChildren = Children.toArray(children)
      .filter(isValidElement<TransitionStackScreenProps<ParamListBase>>)
      .map((child) => {
        const resolvedOptions =
          typeof child.props.options === "function"
            ? child.props.options({
                route: child.props.route,
                navigation: child.props.navigation,
              })
            : child.props.options || {};

        childOptions.set(child.props.name, resolvedOptions);

        const skipDefaultScreenOptions = resolvedOptions?.skipDefaultScreenOptions === true;

        return React.cloneElement(child, {
          ...child.props,

          options: {
            ...(skipDefaultScreenOptions ? {} : DEFAULT_SCREEN_OPTIONS),
            ...resolvedOptions,
            ...CONFLICTING_SCREEN_OPTIONS,
          },
        });
      });

    return {
      children: modifiedChildren,
      childOptions,
    };
  }, [children]);

  const screenListenersWithTransitions = useMemo(() => {
    return (props: { navigation: TransitionStackNavigationProp<ParamListBase>; route: RouteProp<ParamListBase> }) => {
      const resolvedNavigatorConfig =
        typeof screenOptions === "function"
          ? screenOptions({
              navigation: props.navigation,
              route: props.route,
              theme: {} as Any,
            })
          : screenOptions;

      const resolvedChildConfig = screenProcessor.childOptions.get(props.route.name);

      const mergedConfig = {
        ...resolvedNavigatorConfig,
        ...resolvedChildConfig, //Child should override navigator config
      };

      const transitionListeners = createConfig({
        navigation: props.navigation,
        route: props.route,
        screenStyleInterpolator: mergedConfig.screenStyleInterpolator,
        transitionSpec: mergedConfig.transitionSpec,
        gestureEnabled: mergedConfig.gestureEnabled,
        gestureDirection: mergedConfig.gestureDirection,
        gestureResponseDistance:
          typeof mergedConfig.gestureResponseDistance === "number" ? mergedConfig.gestureResponseDistance : undefined,
        gestureVelocityImpact: mergedConfig.gestureVelocityImpact,
      });

      const existingListeners = typeof screenListeners === "function" ? screenListeners(props) : screenListeners || {};

      return {
        ...existingListeners,
        ...transitionListeners,
      };
    };
  }, [screenListeners, screenOptions, screenProcessor.childOptions]);

  const buildingBlocks = {
    id,
    initialRouteName,
    children: screenProcessor.children,
    layout,
    screenListeners: screenListenersWithTransitions,
    screenOptions,
    screenLayout,
    UNSTABLE_router,
  };

  const { state, describe, descriptors, navigation, NavigationContent } = useNavigationBuilder<
    StackNavigationState<ParamListBase>,
    StackRouterOptions,
    StackActionHelpers<ParamListBase>,
    NativeStackNavigationOptions,
    TransitionStackNavigationEventMap
  >(StackRouter, buildingBlocks);

  return (
    <NavigationContent>
      <NativeStackView {...rest} state={state} navigation={navigation} descriptors={descriptors} describe={describe} />
    </NavigationContent>
  );
}

export function createTransitionableStackNavigator<
  const ParamList extends ParamListBase,
  const NavigatorID extends string | undefined = undefined,
  const TypeBag extends NavigatorTypeBagBase = {
    ParamList: ParamList;
    NavigatorID: NavigatorID;
    State: StackNavigationState<ParamList>;
    ScreenOptions: TransitionStackNavigationOptions;
    EventMap: TransitionStackNavigationEventMap;
    NavigationList: {
      [RouteName in keyof ParamList]: TransitionStackNavigationProp<ParamList, RouteName, NavigatorID>;
    };
    Navigator: typeof TransitionableStackNavigator;
  },
>(): TypedNavigator<TypeBag> {
  return createNavigatorFactory(TransitionableStackNavigator)();
}

export type TransitionStackNavigatorTypeBag<
  ScreenOptions = TransitionStackNavigationOptions,
  State = StackNavigationState<ParamListBase>,
  EventMap = TransitionStackNavigationEventMap,
> = {
  ScreenOptions: ScreenOptions;

  State: State;
  EventMap: EventMap;
};
