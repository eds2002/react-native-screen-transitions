import { router } from "expo-router";
import { Button, Text, View } from "react-native";

export default function A() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>regular/a</Text>
      <Button title="Or back" onPress={router.back} />
    </View>
  );
}
