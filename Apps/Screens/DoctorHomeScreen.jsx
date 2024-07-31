import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ImageBackground, Alert , ScrollView} from 'react-native';
import { useNavigation ,useFocusEffect} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DoctorHomeScreen() {
  const navigation = useNavigation();
  const [doctorName, setDoctorName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [image, setImage] = useState(null);
  const logOut=()=>{
    Alert.alert("Sucessfully logout")
  navigation.navigate('ChooseLogin')
  }

    const fetchDoctorData = async () => {
      try {
        const storedDoctorName = await AsyncStorage.getItem('doctorName');
        const storedSpecialty = await AsyncStorage.getItem('doctorSpecialty');
        const storedImage = await AsyncStorage.getItem('doctorImage');
        if (storedDoctorName && storedSpecialty) {
          setDoctorName(storedDoctorName);
          setSpecialty(storedSpecialty);
          setImage(storedImage);
        }
      } catch (error) {
        console.error('Error fetching doctor data:', error);
      }
    };

    fetchDoctorData();


  
  useFocusEffect(
    useCallback(() => {
      fetchDoctorData();
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
                    <Image source={require('./../../assets/images/doctoranimate.jpeg')} style={styles.optionImage} />
                  )}
          </View>
        </View>
        <View style={styles.header}>
          <View style={styles.headerContainer}>
            <Text style={styles.doctorName}>{doctorName}</Text>
            <Text style={styles.specialty}>{specialty}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.navigate('UpcomingAppointments')}
        >
          <Text style={styles.buttonText}>Upcoming Appointments</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.navigate('PatientSearch')}
        >
          <Text style={styles.buttonText}>Patient Profile View</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.navigate('UpdateMedicalRecord')}
        >
          <Text style={styles.buttonText}>Update Medical Record</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.navigate('EditPersonalInformation')}
        >
          <Text style={styles.buttonText}>Edit Personal Information</Text>
        </TouchableOpacity>



        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.navigate('Reports')}
        >
          <Text style={styles.buttonText}>Report</Text>
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
  doctorName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  specialty: {
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
