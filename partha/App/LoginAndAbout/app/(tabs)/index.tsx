import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
} from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import LoginScreen from '../../../../Backend/project/app/(auth)/login'; // Adjust the import path as necessary

export default function App() {
  // const [username, setUsername] = useState('');
  // const [email, setEmail] = useState('');
  // const [password, setPassword] = useState('');
  // const [showPassword, setShowPassword] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      {/* Logo */}
      <Image
        source={require('@/assets/images/doklink-image.jpg')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Doklink</Text>

      {/* Username */}
      {/* <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#aaa"
        value={username}
        onChangeText={setUsername}
      /> */}

      {/* Email */}
      {/* <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#aaa"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      /> */}

      {/* Password */}
      {/* <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          placeholderTextColor="#aaa"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Text style={styles.showText}>{showPassword ? 'Hide' : 'Show'}</Text>
        </TouchableOpacity>
      </View> */}

      {/* Remember Me and Forgot Password */}
      {/* <View style={styles.rememberForgot}>
        <View style={styles.checkboxContainer}>
          <View style={styles.checkbox} />
          <Text style={styles.checkboxLabel}>Remember me</Text>
        </View>
        <Text style={styles.forgotText}>Forgot password?</Text>
      </View> */}

      {/* Login Button */}
      <TouchableOpacity
        style={{
          backgroundColor: '#00aaff',
          padding: 10,
          width: '100%',
          borderWidth: 1,
          borderRadius: 8,
          alignItems: 'center',
          marginBottom: 15,
        }}
        onPress={() => {
          LoginScreen(); // Call the login function from the imported module
        }}
      >
        <Text style={styles.loginText}>Log in</Text>
      </TouchableOpacity>

      {/* Google Login */}
      <TouchableOpacity style={styles.googleButton}>
        <AntDesign name="google" size={20} color="white" />
        <Text style={styles.googleText}>Log in with Google</Text>
      </TouchableOpacity>

      {/* Signup */}
      <Text style={styles.signupText}>
        Do not have an account? <Text style={styles.signupLink}>Sign up</Text>
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    height: 100,
    width: 100,
    marginBottom: 10,
  },
  title: {
    color: '#ccc',
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    backgroundColor: '#111',
    color: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderColor: '#333',
    borderWidth: 1,
  },
  passwordContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderColor: '#333',
    borderWidth: 1,
  },
  passwordInput: {
    flex: 1,
    color: 'white',
    paddingVertical: 12,
  },
  showText: {
    color: '#00aaff',
    fontWeight: 'bold',
  },
  rememberForgot: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: '#555',
    marginRight: 8,
  },
  checkboxLabel: {
    color: '#aaa',
  },
  forgotText: {
    color: '#00aaff',
  },
  loginButton: {
    width: '100%',
    backgroundColor: '#222',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  loginText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  googleButton: {
    width: '100%',
    backgroundColor: '#444',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  googleText: {
    color: '#fff',
  },
  signupText: {
    color: '#aaa',
  },
  signupLink: {
    color: '#00aaff',
    fontWeight: 'bold',
  },
});