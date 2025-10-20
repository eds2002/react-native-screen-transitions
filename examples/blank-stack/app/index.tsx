import { router } from "expo-router";
import { Button, View } from "react-native";

export default function Layout() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Button
        title="Go to Blank Stack"
        onPress={() => router.push("/blank/a")}
      />
    </View>
  );
}
