import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, Alert, Modal, Linking, Button, TextInput, ImageBackground } from 'react-native';
import { getDatabase, ref, onValue, get } from '@firebase/database';
import { app } from "../../fireConfig";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStorage, ref as ref_storage, getDownloadURL } from 'firebase/storage';

export default function MedicalHistory() {
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isPrescriptionsModalVisible, setPrescriptionsModalVisible] = useState(false);
  const [doctors, setDoctors] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const db = getDatabase(app);
  const storage = getStorage(app);

  const formatDate = (isoString) => {
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
            const patientList = [];
            for (const patientID in data) {
              const { name, age, healthNumber,lastVisit } = data[patientID];
              patientList.push({
                PatientID: patientID,
                PatientName: name || '',
                PatientAge: age || '',
                healthNumber: healthNumber || '',
                lastVisit: formatDate(lastVisit)
              });
            }
            setPatients(patientList);
            setFilteredPatients(patientList);
          } else {
            setPatients([]);
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
  

  const handlePatientPress = async (patient) => {
    try {
      const userRef = ref(db, `users/${patient.PatientID}`);
      const userSnapshot = await get(userRef);
      const patientDetails = userSnapshot.val();

      const prescriptionsRef = ref(db, `prescriptions`);
      const prescriptionsSnapshot = await get(prescriptionsRef);
      const prescriptionsData = prescriptionsSnapshot.val();
      const prescriptionsList = [];

      if (prescriptionsData) {
        for (const doctorEmail in prescriptionsData) {
          const doctorPrescriptions = prescriptionsData[doctorEmail][patient.PatientID];
          if (doctorPrescriptions) {
            for (const prescriptionID in doctorPrescriptions) {
              prescriptionsList.push({
                id: prescriptionID,
                ...doctorPrescriptions[prescriptionID],
                doctorEmail: doctorEmail.replace('-', '.')
              });
            }
          }
        }
      }
      setPrescriptions(prescriptionsList);
      setSelectedPatient({ ...patient, ...patientDetails });
      setModalVisible(true);
    } catch (error) {
      console.error('Error fetching patient details:', error);
      Alert.alert('Error', 'Failed to fetch patient details.');
    }
  };

  const renderPatientItem = ({ item }) => (
   
    <TouchableOpacity style={styles.patientItem} onPress={() => handlePatientPress(item)}>
      <View style={styles.patientDetails}>
        <Text style={styles.patientName}>Name: {item.PatientName}</Text>
        <Text style={styles.details}>Age: {item.PatientAge}</Text>
        <Text style={styles.details}>Health Care Number: {item.healthNumber}</Text>
      {item.lastVisit &&  <Text style={styles.details}>Last Visit: {item.lastVisit}</Text> }
      </View>
    </TouchableOpacity>
  );

  const renderPrescriptionItem = ({ item }) => {
    const openFile = async () => {
      if (item.fileUrl) {
        try {
          const fileRef = ref_storage(storage, item.fileUrl);
          const downloadURL = await getDownloadURL(fileRef);
          await Linking.openURL(downloadURL);
        } catch (error) {
          Alert.alert('Error', 'Failed to open file.');
          console.error('Error opening file:', error);
        }
      }
    };

    return (
      <TouchableOpacity style={styles.prescriptionItem} onPress={openFile}>
        <Text>Prescription: {item.prescription}</Text>
        <Text>Date: {new Date(item.date).toLocaleString()}</Text>
        {item.fileUrl && <Text>File is Attached</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <ImageBackground
      source={require('./../../assets/images/background.jpeg')}
      style={styles.backgroundImage}
    >
      <View style={styles.container}>
        <View style={styles.headingContainer}>
          <Text style={styles.heading}>Patient Search</Text>
        </View>
        <TextInput
          style={styles.searchBar}
          placeholder="Search by patient name"
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor="#999999"
        />
        <FlatList
          data={filteredPatients}
          renderItem={renderPatientItem}
          keyExtractor={item => item.PatientID}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={() => (
            <View style={styles.noResults}>
              <Text style={styles.notFound}>No patients found</Text>
            </View>
          )}
        />
        <Modal
          visible={isModalVisible}
          onRequestClose={() => setModalVisible(false)}
          transparent
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              {selectedPatient && (
                <>
                  <Text style={styles.modalTitle}>Patient Details</Text>
                  <Text style={styles.modalText}>Name: {selectedPatient.name}</Text>
                  <Text style={styles.modalText}>Age: {selectedPatient.age}</Text>
                  <Text style={styles.modalText}>Gender {selectedPatient.gender}</Text>
                  <Text style={styles.modalText}>Health Care Number: {selectedPatient.healthNumber}</Text>
                  <Text style={styles.modalText}>Blood Group: {selectedPatient.bloodGroup}</Text>
                  <Text style={styles.modalText}>Weight: {selectedPatient.weight} lbs</Text>
                  <Text style={styles.modalText}>Height: {selectedPatient.height} cm</Text>
                  
                </>
              )}

              <TouchableOpacity style={styles.closeButton} onPress={() => {setPrescriptionsModalVisible(true)}}>
                <Text style={styles.closeButtonText}>View Prescriptions</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Modal
          visible={isPrescriptionsModalVisible}
          onRequestClose={() => setPrescriptionsModalVisible(false)}
          transparent
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <FlatList
                data={prescriptions}
                renderItem={renderPrescriptionItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={() => (
                  <View style={styles.noResults}>
                    <Text style={styles.notFound}>No prescriptions found</Text>
                  </View>
                )}
              />
              <TouchableOpacity style={styles.closeButton} onPress={() => setPrescriptionsModalVisible(false)}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        </Modal>
   
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
    justifyContent: 'center',
    padding: 20,
  },
  notFound: {
    fontSize: 18,
    color: '#999999',
  },
  modalContainer: {
    flex: 1,

    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    marginVertical:80,
    width: '90%',
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#333333',
  },
  modalText: {
    fontSize: 18,
    color: '#333333',
    marginBottom: 10,
  },
  prescriptionItem: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  closeButton: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
