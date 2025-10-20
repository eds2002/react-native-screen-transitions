import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BlankStackHeaderProps } from "react-native-screen-transitions";
import { BlankStack } from "@/blank-stack";

const ProgressPill = ({
  animation,
  index,
}: {
  animation: BlankStackHeaderProps["animation"];
  index: number;
}) => {
  const fillStyle = useAnimatedStyle(() => {
    "worklet";
    const total = animation.value.progress;
    const localProgress = Math.min(Math.max(total - index, 0), 1);

    return {
      flex: Math.max(localProgress, 0),
      backgroundColor: "#000",
      borderRadius: 999,
    };
  });

  return (
    <Animated.View style={styles.progressPillContainer}>
      <Animated.View style={fillStyle} />
    </Animated.View>
  );
};

const CustomHeader = (props: BlankStackHeaderProps) => {
  const { top, bottom } = useSafeAreaInsets();

  return (
    <Animated.View
      style={[styles.headerWrapper, StyleSheet.absoluteFill]}
      pointerEvents="box-none"
    >
      <View style={[styles.topBar, { marginTop: top }]}>
        <View style={styles.iconWrapper}>
          <FontAwesome6 name="chevron-left" size={16} color="black" />
        </View>

        <View style={styles.progressContainer}>
          {Array.from({ length: 3 }).map((_, index) => (
            <ProgressPill
              key={index.toString()}
              animation={props.animation}
              index={index}
            />
          ))}
        </View>

        <View style={styles.iconWrapper} />
      </View>

      <View style={[styles.footer, { paddingBottom: bottom }]}>
        <Pressable style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>{props.route.name}</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
};

export default function Layout() {
  return (
    <BlankStack>
      <BlankStack.Screen
        name="a"
        options={{
          headerShown: true,
          headerMode: "float",
          header: CustomHeader,
        }}
      />
      <BlankStack.Screen
        name="b"
        options={{
          headerShown: true,
          gestureEnabled: true,
          gestureDirection: "horizontal",
          screenStyleInterpolator: ({
            progress,
            layouts: {
              screen: { width },
            },
          }) => {
            "worklet";
            const x = interpolate(progress, [0, 1, 2], [width, 0, -width]);
            return {
              contentStyle: {
                transform: [{ translateX: x }],
              },
            };
          },
          transitionSpec: {
            open: {
              mass: 3,
              damping: 500,
              stiffness: 1000,
            },
            close: {
              mass: 3,
              damping: 500,
              stiffness: 1000,
            },
          },
        }}
      />
      <BlankStack.Screen
        name="c"
        options={{
          headerShown: true,
          gestureEnabled: true,
          gestureDirection: "horizontal",
          screenStyleInterpolator: ({
            progress,
            layouts: {
              screen: { width },
            },
          }) => {
            "worklet";
            const x = interpolate(progress, [0, 1, 2], [width, 0, -width]);
            return {
              contentStyle: {
                transform: [{ translateX: x }],
              },
            };
          },
          transitionSpec: {
            open: {
              mass: 3,
              damping: 500,
              stiffness: 1000,
            },
            close: {
              mass: 3,
              damping: 500,
              stiffness: 1000,
            },
          },
        }}
      />
    </BlankStack>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {
    justifyContent: "space-between",
  },
  topBar: {
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "space-between",
    height: 50,
    flexDirection: "row",
    gap: 82,
  },
  iconWrapper: {
    width: 50,
    height: 50,
    justifyContent: "center",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    gap: 6,
  },
  progressPillContainer: {
    flex: 1,
    height: 5,
    borderRadius: 999,
    justifyContent: "flex-start",
    backgroundColor: "#d4d4d4",
    flexDirection: "row",
    overflow: "hidden",
  },
  footer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  primaryButton: {
    height: 65,
    backgroundColor: "#000",
    width: "100%",
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    fontSize: 20,
    fontWeight: "600",
    color: "white",
  },
});
