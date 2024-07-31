import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, FlatList, TouchableOpacity, ImageBackground } from 'react-native';
import { getDatabase, ref, onValue } from '@firebase/database';
import { app } from "../../fireConfig";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function UpdateMedicalRecord({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [patients, setPatients] = useState([]);
  const db = getDatabase(app);


  const formatDate = (isoString) => {
    if(isoString===undefined)
      return null
    const date = new Date(isoString);
    const options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    };
    return date.toLocaleDateString(undefined, options);
  };

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const usersRef = ref(db, 'users');
        onValue(usersRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const patientList = Object.keys(data).map(key => ({
              PatientID: key,
              PatientName: data[key].name || '',
              PatientAge: data[key].age || '',
              email: data[key].email || '',
              healthNumber: data[key].healthNumber || '',
              lastVisit: formatDate(data[key].lastVisit),
            }));
            setPatients(patientList);
            setFilteredPatients(patientList);
          } else {
            setPatients([]);
            setFilteredPatients([]);
          }
        });
      } catch (error) {
        console.error(error);
      }
    };

    fetchPatients();
  }, []);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query) {
      const filtered = patients.filter(patient =>
        patient.PatientName.toLowerCase().includes(query.toLowerCase()) ||
        patient.healthNumber.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients(patients);
    }
  };

  const handlePatientPress = (patient) => {
    navigation.navigate('EnterPrescription', { patient });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.patientItem} onPress={() => handlePatientPress(item)}>
      <View style={styles.patientDetails}>
        <Text style={styles.patientName}>Name: {item.PatientName}</Text>
        <Text style={styles.details}>Age: {item.PatientAge}</Text>
        <Text style={styles.details}>Health Care Number: {item.healthNumber}</Text>
        {item.lastVisit &&  <Text style={styles.details}>Last Visit: {item.lastVisit}</Text> }
      </View>
    </TouchableOpacity>
  );

  return (
    <ImageBackground
      source={require('./../../assets/images/background.jpeg')}
      style={styles.backgroundImage}
    >
      <View style={styles.container}>
        <View style={styles.headingContainer}>
          <Text style={styles.heading}>Medical Records</Text>
        </View>
        <TextInput
          style={styles.searchBar}
          placeholder="Search by patient name or health number"
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor="#999999"
        />
        <FlatList
          data={filteredPatients}
          renderItem={renderItem}
          keyExtractor={item => item.PatientID}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={() => (
            <View style={styles.noResults}>
              <Text style={styles.notFound}>No patients found</Text>
            </View>
          )}
        />
      </View>
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
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
  },
  headingContainer: {
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  searchBar: {
    height: 50,
    borderColor: '#cccccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
    fontSize: 16,
    color: '#333333',
  },
  listContainer: {
    paddingBottom: 20,
  },
  patientItem: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  patientDetails: {
    marginBottom: 10,
  },
  patientName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  details: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 4,
  },
  noResults: {
    alignItems: 'center',
    marginTop: 20,
  },
  notFound: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
});
