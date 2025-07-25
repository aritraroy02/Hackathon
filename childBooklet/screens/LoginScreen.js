import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Keyboard, TouchableWithoutFeedback } from "react-native";

export default function LoginScreen({ navigation }) {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    navigation.navigate("Home");
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <LinearGradient
        colors={["#F7A250", "#727CDC"]}
        style={styles.gradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        {/* <View style={styles.topBar}>
        <Text style={styles.loginText}>Login</Text>
      </View> */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={80}
        >
          <View style={styles.centeredContainer}>
            <BlurView
              intensity={Platform.OS === "ios" ? 60 : 90}
              tint="default"
              style={styles.glassCard}
            >
              <Text style={styles.title}>Transforming Healthcare</Text>
              <TextInput
                placeholder="User ID"
                style={styles.input}
                value={userId}
                placeholderTextColor="#fff"
                onChangeText={setUserId}
              />
              <TextInput
                placeholder="Password"
                style={styles.input}
                value={password}
                placeholderTextColor="#fff"
                onChangeText={setPassword}
                secureTextEntry
              />
              <TouchableOpacity
                style={styles.signInButton}
                onPress={handleLogin}
              >
                <Text style={styles.signInButtonText}>Sign In</Text>
              </TouchableOpacity>
            </BlurView>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
}

// styles object continues unchanged, as previously given

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    paddingTop: 50, // Space for the top bar
  },
  // topBar: {
  //   paddingHorizontal: 20,
  //   position: "absolute",
  //   top: 50,
  //   left: 0,
  //   right: 0,
  // },
  // loginText: {
  //   color: "#222",
  //   fontSize: 18,
  //   fontWeight: "600",
  //   alignSelf: "flex-start",
  // },
  centeredContainer: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    marginTop: 100,
  },
  glassCard: {
    width: 320,
    padding: 24,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    backgroundColor: "rgba(86, 85, 85, 0)",
    shadowColor: "rgba(168, 33, 33, 0.03)",
    shadowOpacity: 0.09,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 6,
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    color: "white",
    fontWeight: "600",
    marginBottom: 26,
    alignSelf: "center",
  },
  input: {
    width: 260,
    backgroundColor: "rgba(255, 255, 255, 0.27)",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 16,
    marginBottom: 16,
    color: "#fff",
    borderWidth: 0,
  },
  signInButton: {
    marginTop: 8,
    backgroundColor: "rgba(114,124,220,0.92)",
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.32)",
  },
  signInButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});
