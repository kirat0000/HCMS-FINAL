import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Image, Alert, ImageBackground, KeyboardAvoidingView, ScrollView, Platform,Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { getDatabase, ref, get, update } from '@firebase/database';
import { Dropdown } from 'react-native-element-dropdown';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from '@firebase/storage';
import { useNavigation } from '@react-navigation/native';
import { getAuth, reauthenticateWithCredential, updatePassword, EmailAuthProvider } from 'firebase/auth';
import Icon from 'react-native-vector-icons/FontAwesome';

export default function EditPatientDetails() {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [image, setImage] = useState(null);
  const [userId, setUserId] = useState(null);
  const [healthNumber, setHealthNumber] = useState('');
  const navigation = useNavigation();
  const [isPasswordModalVisible, setPasswordModalVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [oldPasswordVisible, setOldPasswordVisible] = useState(false);
const [newPasswordVisible, setNewPasswordVisible] = useState(false);
const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const data = [
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'Not To Say', value: 'Not To Say' },
  ];

  const bloodGroupdata = [
    { label: 'A+', value: 'A+' },
    { label: 'A-', value: 'A-' },
    { label: 'B+', value: 'B+' },
    { label: 'B-', value: 'B-' },
    { label: 'AB+', value: 'AB+' },
    { label: 'AB-', value: 'AB-' },
    { label: 'O+', value: 'O+' },
    { label: 'O-', value: 'O-' },
  ];

  useEffect(() => {
    const fetchUserId = async () => {
      const id = await AsyncStorage.getItem('userUid');
      if (id) {
        setUserId(id);
        fetchUserData(id);


      }
    };
    fetchUserId();
  }, []);

  const fetchUserData = async (id) => {
    const db = getDatabase();
    const userRef = ref(db, `users/${id}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      setName(data.name);
      setAge(data.age);
      setGender(data.gender);
      setBloodGroup(data.bloodGroup);
      setHeight(data.height);
      setWeight(data.weight);
      setImage(data.image);
      setHealthNumber(data.healthNumber);
    } else {
      Alert.alert('Error', 'No user data found');
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission to access camera roll is required!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    } else {
      Alert.alert('Error', 'No image selected');
    }
  };

  const uploadImage = async (uri) => {
    if (!userId) {
      Alert.alert('Error', 'User ID not found');
      return null;
    }

    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const storage = getStorage();
      const imageRef = storageRef(storage, `users/${userId}/profile.jpg`);
      await uploadBytes(imageRef, blob);
      const downloadURL = await getDownloadURL(imageRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image');
      return null;
    }
  };

  const deleteImage = () => {
    setImage(null);
    Alert.alert('Image Deleted', 'Your profile image has been deleted.');
  };

  const handleSave = async () => {
    if (!userId) {
      Alert.alert('Error', 'User ID not found');
      return;
    }

    let imageUrl = image;

    if (image && !image.startsWith('http')) {
      imageUrl = await uploadImage(image);
    }

    const db = getDatabase();
    const userRef = ref(db, `users/${userId}`);

    const userData = {
      name,
      age,
      gender,
      bloodGroup,
      height,
      weight,
      image: imageUrl,
      healthNumber,
    };

    try {
      await update(userRef, userData);
      navigation.navigate('PHomeScreen');
      Alert.alert('Information Saved', 'Your information has been updated.');
    } catch (error) {
      Alert.alert('Error', 'Failed to update information');
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New Password and Confirm Password do not match');
      return;
    }
  
    const auth = getAuth();
    const user = auth.currentUser;
  
    if (!user) {
      Alert.alert('Error', 'No user is signed in');
      return;
    }
  
    try {

      const credential = EmailAuthProvider.credential(user.email, oldPassword);
      await reauthenticateWithCredential(user, credential);
 
      await updatePassword(user, newPassword);
  
      Alert.alert('Success', 'Password changed successfully');
      setPasswordModalVisible(false);
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert('Error', error.message || 'Failed to change password');
    }
  };

  return (
    <ImageBackground
      source={require('./../../../assets/images/background.jpeg')}
      style={styles.backgroundImage}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <View style={styles.imageContainer}>
              <TouchableOpacity onPress={pickImage}>
                <View style={styles.circleContainer}>
                  {image ? (
                    <Image source={{ uri: image }} style={styles.profileImage} />
                  ) : (
                    <Image source={require('./../../../assets/images/patientanimate.jpeg')} style={styles.profileImage} />
                  )}
                </View>
              </TouchableOpacity>
              {image && (
                <TouchableOpacity onPress={deleteImage} style={styles.deleteButton}>
                  <Text style={styles.deleteButtonText}>Remove Image</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.editContainer}>
              <Text style={styles.label}>Name</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} />

              <Text style={styles.label}>Health Care Number</Text>
              <TextInput style={styles.input} value={healthNumber} onChangeText={setHealthNumber} />

              <Text style={styles.label}>Age</Text>
              <TextInput style={styles.input} value={age} onChangeText={setAge} keyboardType="numeric" />

              <Text style={styles.label}>Gender</Text>
              <Dropdown
                style={styles.input}
                data={data}
                search
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder="Gender"
                searchPlaceholder="Search..."
                value={gender}
                onChange={item => {
                  setGender(item.value);
                }}
              />

             <Text style={styles.label}>Blood Group</Text>
              <Dropdown
                style={styles.input}
                data={bloodGroupdata}
                search
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder="Blood Group"
                searchPlaceholder="Search..."
                value={bloodGroup}
                onChange={item => {
                  setBloodGroup(item.value);
                }}
              />

              <Text style={styles.label}>Height (cm) </Text>
              <TextInput style={styles.input} value={height} onChangeText={setHeight} keyboardType="numeric" />

              <Text style={styles.label}>Weight (lbs)</Text>
              <TextInput style={styles.input} value={weight} onChangeText={setWeight} keyboardType="numeric" />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleSave}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={() => setPasswordModalVisible(true)}>
              <Text style={styles.buttonText}>Change Password</Text>
            </TouchableOpacity>

          </ScrollView>

          <Modal
  visible={isPasswordModalVisible}
  animationType="slide"
  transparent={true}
  onRequestClose={() => setPasswordModalVisible(false)}
>
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Change Password</Text>

      <View style={styles.passwordContainer}>
  <TextInput
    style={styles.inputmpo}
    placeholderTextColor={"black"}
    placeholder="Old Password"
    value={oldPassword}
    onChangeText={setOldPassword}
    secureTextEntry={!oldPasswordVisible}
  />
  <TouchableOpacity onPress={() => setOldPasswordVisible(!oldPasswordVisible)}>
    <Icon name={oldPasswordVisible ? "eye" : "eye-slash"} size={20} />
  </TouchableOpacity>
</View>


<View style={styles.passwordContainer}>
  <TextInput
    style={styles.inputmpo}
    placeholderTextColor={"black"}
    placeholder="New Password"
    value={newPassword}
    onChangeText={setNewPassword}
    secureTextEntry={!newPasswordVisible}
  />
  <TouchableOpacity onPress={() => setNewPasswordVisible(!newPasswordVisible)}>
    <Icon name={newPasswordVisible ? "eye" : "eye-slash"} size={20} />
  </TouchableOpacity>
</View>

<View style={styles.passwordContainer}>
  <TextInput
    style={styles.inputmpo}
    placeholderTextColor={"black"}
    placeholder="Confirm Password"
    value={confirmPassword}
    onChangeText={setConfirmPassword}
    secureTextEntry={!confirmPasswordVisible}
  />
  <TouchableOpacity onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}>
    <Icon name={confirmPasswordVisible ? "eye" : "eye-slash"} size={20} />
  </TouchableOpacity>
</View>


      <TouchableOpacity style={styles.button} onPress={handleChangePassword}>
        <Text style={styles.buttonText}>Submit</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setPasswordModalVisible(false)}>
        <Text style={styles.buttonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>




        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  circleContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#333',
    backgroundColor: 'rgba(255, 255, 255, 1)',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  editContainer: {
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  inputmpo: {
    height: 40,
    borderColor: '#ccc',

    borderRadius: 5,
    width:200,
    paddingHorizontal: 10,
   
    fontSize: 16,
    backgroundColor: '#fff',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    backgroundColor: '#fff',
    width: 235,
  }
  
  
});
