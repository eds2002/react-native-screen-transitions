import { router } from "expo-router";
import { Button, Text, View } from "react-native";

export default function A() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>blank/b</Text>
      <Button title="To blank/c" onPress={() => router.push("/blank/c")} />
      <Button
        title="or  regular/a"
        onPress={() => {
          router.push("/regular/a");
        }}
      />
      <Button title="Or back" onPress={router.back} />
    </View>
  );
}
