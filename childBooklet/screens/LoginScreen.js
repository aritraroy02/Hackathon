// screens/LoginScreen.js
import React, { useState, useEffect, useRef } from 'react';
import healthIcon from '../assets/logo.png';
import {
  Image,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialIcons, Feather, FontAwesome, Octicons} from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const floatingAnim1 = useRef(new Animated.Value(0)).current;
  const floatingAnim2 = useRef(new Animated.Value(0)).current;
  const floatingAnim3 = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const modalScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Floating animations
    const startFloating = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatingAnim1, {
            toValue: 1,
            duration: 4000,
            useNativeDriver: true,
          }),
          Animated.timing(floatingAnim1, {
            toValue: 0,
            duration: 4000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(floatingAnim2, {
            toValue: 1,
            duration: 6000,
            useNativeDriver: true,
          }),
          Animated.timing(floatingAnim2, {
            toValue: 0,
            duration: 6000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(floatingAnim3, {
            toValue: 1,
            duration: 8000,
            useNativeDriver: true,
          }),
          Animated.timing(floatingAnim3, {
            toValue: 0,
            duration: 8000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startFloating();
  }, []);

  const handleLogin = async () => {
    // Basic validation
    if (!userId.trim()) {
      Alert.alert('Error', 'Please enter your User ID');
      return;
    }
    
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }
    
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setShowSuccessModal(true);
    }, 2000);
  };

  const handleBiometricLogin = () => {
    Alert.alert('Biometric Login', 'Face ID / Touch ID authentication would be implemented here');
  };

  const handleContinue = () => {
    setShowSuccessModal(false);
    navigation.navigate('Home');
  };

  const animateButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const showSuccessModalAnimation = () => {
    Animated.spring(modalScale, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const FloatingShape = ({ style, animValue, size = 60 }) => (
    <Animated.View
      style={[
        styles.floatingShape,
        {
          width: size,
          height: size,
          opacity: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0.1, 0.3],
          }),
          transform: [
            {
              translateY: animValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -30],
              }),
            },
          ],
        },
        style,
      ]}
    />
  );

  return (
    <View style={{ flex: 1, position: 'relative' }}>
      <LinearGradient
        colors={['#3E8EDE', '#89CFF0']}
        style={styles.gradientBg}
      ></LinearGradient>
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background Gradient */}
      
        {/* Floating Shapes */}
        <FloatingShape
          style={[styles.circle1, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}
          animValue={floatingAnim1}
          size={80}
        />
        <FloatingShape
          style={[styles.circle2, { backgroundColor: 'rgba(255, 255, 255, 0.03)' }]}
          animValue={floatingAnim2}
          size={120}
        />
        <FloatingShape
          style={[styles.circle3, { backgroundColor: 'rgba(255, 255, 255, 0.04)' }]}
          animValue={floatingAnim3}
          size={100}
        />
        <View style={styles.content}>
        {/* Main Content */}
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.cardGlass,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {/* Healthcare Icon and Title */}
            <View style={styles.titleContainer}>
             <View style={styles.iconContainer}>
              <Image source={healthIcon} style={styles.healthcareIcon} />
             </View>
            <Text style={styles.heading}>Transforming Healthcare</Text>
            <Text style={styles.subtitle}>Secure access to your health data</Text>
            </View>


            {/* Input Fields */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <FontAwesome name="user-md" size={24} color="white" />
                <TextInput
                  placeholder="  User ID"
                  style={styles.input}
                  value={userId}
                  onChangeText={setUserId}
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputWrapper}>
                <MaterialIcons name="password" size={24} color="white" />
                <TextInput
                  placeholder="  Password"
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons 
                    name={showPassword ? "eye-off" : "eye"} 
                    size={20} 
                    color="rgba(255, 255, 255, 0.7)" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign In Button */}
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                onPress={() => {
                  animateButtonPress();
                  handleLogin();
                }}
                activeOpacity={0.9}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={['#6A11CB', '#2575FC']}
                  style={styles.signInButton}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Octicons name="sign-in" size={24} color="white" />
                      <Text style={styles.signInText}>  Sign In</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Biometric Login */}
            <TouchableOpacity style={styles.biometricButton} onPress={handleBiometricLogin}>
              <Ionicons name="finger-print" size={24} color="rgba(255, 255, 255, 0.8)" />
              <Text style={styles.biometricText}>Face ID / Touch ID</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>We care about your health data.</Text>
        </View>
      </View>
      {/* </LinearGradient> */}

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onShow={showSuccessModalAnimation}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.modalContent,
              { transform: [{ scale: modalScale }] }
            ]}
          >
            <View style={styles.successIconContainer}>
              <Text style={styles.successIcon}>✅</Text>
            </View>
            <Text style={styles.modalTitle}>Login Successful</Text>
            <Text style={styles.modalSubtitle}>Welcome back! 👋</Text>
            <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBg: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    position: 'absolute',
  },
  content: {
    flex: 1,
    position: 'relative',
    zIndex: 1,
  },
  
  floatingShape: {
    position: 'absolute',
    borderRadius: 50,
  },
  circle1: {
    top: height * 0.15,
    left: width * 0.1,
  },
  circle2: {
    top: height * 0.4,
    right: width * 0.08,
  },
  circle3: {
    bottom: height * 0.25,
    left: width * 0.15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  cardGlass: {
    width: '100%',
    maxWidth: 400,
    padding: 32,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.25)",
    backgroundColor: "rgba(8, 8, 8, 0.2)",
    shadowColor: "rgba(70, 52, 52, 0.03)",
    shadowOpacity: 0.09,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 24,
    elevation: 10,
    alignItems: "center",
    marginTop: 50,
  },

  titleContainer: {
    alignItems: 'center',
    marginBottom: 32,
    
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  healthcareIcon: {
  width: 80,
  height: 80,
  borderRadius: 40, // half of width/height to make it a perfect circle
  resizeMode: 'cover',
  overflow: 'hidden',
  backgroundColor: '#fff', // optional if your image has transparency
},


  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Sora',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Poppins',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Poppins',
  },
  eyeIcon: {
    padding: 4,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    width: '100%',
    shadowColor: '#6A11CB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  signInText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Sora',
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 12,
  },
  biometricText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginLeft: 8,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Poppins',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    alignItems: 'center'
    
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Poppins',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successIcon: {
    fontSize: 40,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Sora',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Poppins',
  },
  continueButton: {
    backgroundColor: '#6A11CB',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 20,
  },
  continueButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Sora',
  },
});
