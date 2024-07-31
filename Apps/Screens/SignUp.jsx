import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Keyboard , ScrollView} from 'react-native';
import { app } from "../../fireConfig"
import { Dropdown } from 'react-native-element-dropdown';
import { getAuth, createUserWithEmailAndPassword,sendEmailVerification  } from '@firebase/auth';
import { getDatabase, ref, set } from '@firebase/database';
import { useNavigation } from '@react-navigation/native';

const SignUpPage = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [healthNumber, setHealthNumber] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');

  const auth = getAuth(app);
  const database = getDatabase(app);

  const data = [
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'NotSay', value: 'Not To Say' },
  ];

  const bloodGroupdata=[
    { label: 'A+', value: 'A+' },
    { label: 'A-', value: 'A-' },
    { label: 'B+', value: 'B+' },
    { label: 'B-', value: 'B-' },
    { label: 'AB+', value: 'AB+' },
    { label: 'AB-', value: 'AB-' },
    { label: 'O+', value: 'O+' },
    { label: 'O-', value: 'O-' },
  ];

  const handleSignUp = async () => {
    if (!email || !password || !name || !age || !gender || !bloodGroup  || !healthNumber) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;
      const user = userCredential.user;

      await sendEmailVerification(user);

      const userData = {
        email,
        name,
        age,
        gender,
        bloodGroup,
        height,
        weight,
        healthNumber
      };

      await set(ref(database, `users/${userId}`), userData);
      Alert.alert('Verification email sent! Please verify your email before logging in.');
      navigation.navigate('PatientLogin');
   
    } catch (error) {
      console.error('Error creating user account:', error);
      Alert.alert('Error', error.message);
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollViewContent}>
    <TouchableOpacity style={styles.container} activeOpacity={1} onPress={dismissKeyboard}>
      <View style={styles.innerContainer}>
        <Text style={styles.heading}>Sign Up</Text>
        <TextInput
          style={styles.input}
          placeholder="Email*"
          placeholderTextColor={"black"}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password*"
          placeholderTextColor={"black"}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TextInput
          style={styles.input}
          placeholderTextColor={"black"}
          placeholder="Name*"
          value={name}
          onChangeText={setName}
        />
         <TextInput
          style={styles.input}
          placeholderTextColor={"black"}
          placeholder="Health Care Number*"
          value={healthNumber}
          onChangeText={setHealthNumber}
        />
        <TextInput
          style={styles.input}
          placeholder="Age*"
          placeholderTextColor={"black"}
          keyboardType="numeric"
          value={age}
          onChangeText={setAge}
        />

        <Dropdown
          style={styles.input}
          data={data}
          search
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder="Gender*"
          searchPlaceholder="Search..."
          value={gender}
          onChange={item => {
            setGender(item.value);
          }}
        />

        <Dropdown
          style={styles.input}
          data={bloodGroupdata}
          search
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder="Blood Group*"
          searchPlaceholder="Search..."
          value={bloodGroup}
          onChange={item => {
            setBloodGroup(item.value);
          }}
        />
        <TextInput
          style={styles.input}
          placeholderTextColor={"black"}
          placeholder="Height (cm)"
          keyboardType="numeric"
          value={height}
          onChangeText={setHeight}
        />
        <TextInput
          style={styles.input}
          placeholder="Weight (lbs)"
          keyboardType="numeric"
          placeholderTextColor={"black"}
          value={weight}
          onChangeText={setWeight}
        />
        <TouchableOpacity style={styles.button} onPress={handleSignUp}>
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  innerContainer: {
    width: '100%',
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333333',
    textAlign: 'center',
  },
  dropdown: {
    margin: 16,
    height: 50,
    borderBottomColor: 'gray',
    borderBottomWidth: 0.5,
  },
  icon: {
    marginRight: 5,
  },
  placeholderStyle: {
    fontSize: 16,
  },
  selectedTextStyle: {
    fontSize: 16,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
  
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    color: '#000000',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 5,
    marginBottom: 10,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#333333',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default SignUpPage;