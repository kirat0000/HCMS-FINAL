import React, { useState, useCallback  } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ImageBackground , Alert, ScrollView} from 'react-native';
import { useNavigation,useFocusEffect  } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase, ref, get } from '@firebase/database';
import { app } from "../../fireConfig";

export default function PatientHomeScreen() {
  const navigation = useNavigation();
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('');
  const [image, setImage] = useState(null);
  const logOut=()=>{
    Alert.alert("Sucessfully logout")
    navigation.navigate('ChooseLogin')
  }


    const fetchPatientData = async () => {
      try {
        const userUid = await AsyncStorage.getItem('userUid');
        if (userUid) {
          const database = getDatabase(app);
          const userRef = ref(database, `users/${userUid}`);
          const snapshot = await get(userRef);
          if (snapshot.exists()) {
            const userData = snapshot.val();
            setPatientName(userData.name || 'Unknown');
            setAge(userData.age || 'Unknown');
            if (userData.image) {
              setImage(userData.image);
            }
          } else {
            console.log('No user data found');
          }
        }
      } catch (error) {
        console.error('Error fetching patient data:', error);
      }
    };

    fetchPatientData();


    useFocusEffect(
      useCallback(() => {
        fetchPatientData();
      }, [])
    );
  

  return (
    <ImageBackground 
      source={require('./../../assets/images/background.jpeg')} 
      style={styles.backgroundImage}
    >
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
      <View style={styles.container}>  
        <View style={styles.imageContainer}>
          <View style={styles.circleContainer}>
            {image ? (
                    <Image source={{ uri: image }} style={styles.optionImage} />
                  ) : (
                    <Image source={require('./../../assets/images/patientanimate.jpeg')} style={styles.optionImage} />
                  )}
          </View>
        </View>
        <View style={styles.header}>
          <View style={styles.headerContainer}>
            <Text style={styles.patientName}>{patientName}</Text>
            <Text style={styles.age}>Age: {age}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.navigate('MedicalHistory')}
        >
          <Text style={styles.buttonText}>Medical History</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.navigate('AppointmentRecords')}
        >
          <Text style={styles.buttonText}>Appointment Records</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.navigate('BookAppointment')}
        >
          <Text style={styles.buttonText}>Book An Appointment</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.navigate('EditPatientDetails')}
        >
          <Text style={styles.buttonText}>Edit Personal Information</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button} 
          onPress={logOut}
        >
          <Text style={styles.buttonText}>Log out</Text>
        </TouchableOpacity>

      </View>
      </ScrollView>
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
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  optionImage: {
    width: '100%',
    height: '100%',
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
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
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  headerContainer: {
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  patientName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  age: {
    fontSize: 18,
    color: '#666',
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    alignItems: 'center',
    width: '80%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
