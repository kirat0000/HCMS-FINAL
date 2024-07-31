import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, Alert, Modal, Linking } from 'react-native';
import { getDatabase, ref, onValue, get } from '@firebase/database';
import { app } from "../../../fireConfig";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStorage, ref as ref_storage, getDownloadURL } from 'firebase/storage';

export default function MedicalHistory() {
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [isModalVisible, setModalVisible] = useState(false);

  const db = getDatabase(app);
  const storage = getStorage(app);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const userUid = await AsyncStorage.getItem('userUid');
        if (!userUid) {
          return;
        }

        const prescriptionsRef = ref(db, 'prescriptions');
        onValue(prescriptionsRef, async (snapshot) => {
          const data = snapshot.val();
          const userPrescriptions = [];

          for (const doctorEmail in data) {
            if (data[doctorEmail][userUid]) {
              for (const prescriptionId in data[doctorEmail][userUid]) {
                const prescription = data[doctorEmail][userUid][prescriptionId];
                userPrescriptions.push({
                  ...prescription,
                  doctorEmail,
                });
              }
            }
          }
          setPrescriptions(userPrescriptions);
        });
      } catch (error) {
        console.error(error);
      }
    };

    fetchPrescriptions();
  }, []);

  const handlePrescriptionPress = async (prescription) => {
    try {
      if (prescription.fileUrl) {
        const fileRef = ref_storage(storage, prescription.fileUrl);
        const downloadURL = await getDownloadURL(fileRef);
        await Linking.openURL(downloadURL);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open file.');
      console.error('Error opening file:', error);
    }
  };

  const renderPrescription = ({ item }) => (
    <TouchableOpacity style={styles.prescriptionItem} onPress={() => handlePrescriptionPress(item)}>
      <Text>Prescription: {item.prescription}</Text>
      <Text>Date: {new Date(item.date).toLocaleString()}</Text>
      {item.fileUrl ? <Text>File is Attached</Text> : ""}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Medical History</Text>
      {prescriptions.length > 0 ? (
        <FlatList
          data={prescriptions}
          renderItem={renderPrescription}
          keyExtractor={(item, index) => index.toString()}
          style={styles.list}
        />
      ) : (
        <Text style={styles.noAppointments}>No prescriptions found.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333333',
  },
  list: {
    marginBottom: 20,
  },
  prescriptionItem: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  noAppointments: {
    fontSize: 18,
    color: '#666666',
    textAlign: 'center',
  },
});
