import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, ImageBackground, Alert } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import dayjs from 'dayjs';
import { getDatabase, ref, onValue, set, get, update } from 'firebase/database';
import { app } from "../../fireConfig";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { send, EmailJSResponseStatus } from '@emailjs/react-native';

export default function UpcomingAppointments() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [initialAppointments, setInitialAppointments] = useState([]);
   const [isChanged, setChanged] = useState(true);
   const [doctorName, setDoctorName] = useState("");
  const db = getDatabase(app);
 
  

  const sendEmail = async (appointmentData) => {
    try {

      await send(
        'service_ccfpwho',
        'template_q53jmoe',
        {
          patientEmail: appointmentData.email,
          doctorName: appointmentData.DoctorName,
          date: appointmentData.Date + " at " + appointmentData.Time,
        },
        {
          publicKey: 'bMdnixLkFGvDAK0SE',
          privateKey: '7zzwpg77N5Ed12mzuA5Pf',
        },
      );

      console.log('SUCCESS!');
    } catch (err) {
      if (err instanceof EmailJSResponseStatus) {
        console.log('EmailJS Request Failed...', err);
      }

      console.log('ERROR', err);
    }
  };

  function formatEmail(email) {
    const [emailName, domain] = email.split('@');
    const formattedDomain = domain.replace('.com', '');
    const formattedEmail = `${emailName.toLowerCase()}@${formattedDomain}`;
    return formattedEmail;
  }

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const doctorEmail = await AsyncStorage.getItem('doctorEmail');
        if (!doctorEmail) {
          return;
        }

        const appointmentsRef = ref(db, `appointments/${formatEmail(doctorEmail)}`);
        onValue(appointmentsRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const appointmentList = Object.keys(data).flatMap(patientID => 
              Object.keys(data[patientID]).map(appointmentID => ({
                PatientID: patientID,
                AppointmentID: appointmentID,
                DoctorName: data[patientID][appointmentID].DoctorName,
                PatientName: data[patientID][appointmentID].PatientName,
                email: data[patientID][appointmentID].email,
                Date: dayjs(data[patientID][appointmentID].DateTime).format('MM/DD/YYYY'),
                Time: dayjs(data[patientID][appointmentID].DateTime).format('HH:mm'),
                Note:data[patientID][appointmentID].Note,
                Status: data[patientID][appointmentID].Status,
              }))
            );
            const appointmentList2 = Object.keys(data).flatMap(patientID => 
              Object.keys(data[patientID]).map(appointmentID => ({
                PatientID: patientID,
                AppointmentID: appointmentID,
                DoctorName: data[patientID][appointmentID].DoctorName,
                PatientName: data[patientID][appointmentID].PatientName,
                email: data[patientID][appointmentID].email,
                Date: dayjs(data[patientID][appointmentID].DateTime).format('MM/DD/YYYY'),
                Time: dayjs(data[patientID][appointmentID].DateTime).format('HH:mm'),
                Note:data[patientID][appointmentID].Note,
                Status: data[patientID][appointmentID].Status,
              })).filter(key => {return key.Status==="Pending"?true: false}));
            console.log(appointmentList);
            setAppointments(appointmentList);
            setInitialAppointments(appointmentList2);
          } else {
            setAppointments([]);
          }
        });
      } catch (error) {
        console.error(error);
      }
    };

    fetchAppointments();
  }, [isDatePickerVisible]);

  const filteredAppointments = appointments.filter(
    (appointment) => {
      
      return appointment.Date === dayjs(selectedDate).format('MM/DD/YYYY');
    }
  );  
  console.log(filteredAppointments)

  const handleStatusChange = async (patientId, appointmentId, newStatus) => {
    try {
      const updatedAppointments = appointments.map((appointment) =>
        appointment.PatientID === patientId && appointment.AppointmentID === appointmentId 
          ? { ...appointment, Status: newStatus } 
          : appointment
      );
      setAppointments(updatedAppointments);
      const doctorEmail = await AsyncStorage.getItem('doctorEmail');

      const appointmentToUpdate = appointments.find((appointment) => appointment.PatientID === patientId && appointment.AppointmentID === appointmentId);
  
      if (!appointmentToUpdate) {
        throw new Error('Appointment not found');
      }

      const appointmentRef = ref(db, `appointments/${formatEmail(doctorEmail)}/${patientId}/${appointmentId}`);
      await update(appointmentRef, {
        Status: newStatus,
      });

      if (newStatus === 'Confirmed') {
        sendEmail(appointmentToUpdate);
      }

      Alert.alert('Success', 'Appointment status updated successfully');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', error.message);
    }
  };
  
  const showDatePicker = () => {

    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirm = (date) => {
   setChanged(false);
    setSelectedDate(date);
    hideDatePicker();
  };

  const renderItem = ({ item }) => (
    <View style={styles.appointmentItem}>
      <Text style={styles.patientName}>{item.PatientName}</Text>
      <View style={styles.detailsContainer}>
        <Text style={styles.details}>Date: {item.Date}</Text>
        <Text style={styles.details}>Time: {item.Time}</Text>
      </View>
      <View style={styles.detailsContainer}>
        <Text style={styles.details}>Note: {item.Note}</Text>
      </View>
      <View style={[styles.statusContainer, statusStyles[item.Status.toLowerCase()]]}>
        <Text style={styles.status}>{item.Status}</Text>
      </View>
      {item.Status === 'Pending' && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.actionButton, styles.confirmButton]} onPress={() => handleStatusChange(item.PatientID, item.AppointmentID, 'Confirmed')}>
            <Text style={styles.actionButtonText}>Confirm</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={() => handleStatusChange(item.PatientID, item.AppointmentID, 'Cancelled')}>
            <Text style={styles.actionButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <ImageBackground
      source={require('./../../assets/images/background.jpeg')}
      style={styles.backgroundImage}
    >
      <View style={styles.container}>
        <Text style={styles.heading}>Upcoming Appointments</Text>
        <TouchableOpacity style={styles.dateButton} onPress={showDatePicker}>
          <Text style={styles.dateButtonText}>Select Date</Text>
        </TouchableOpacity>
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleConfirm}
          onCancel={hideDatePicker}
        />
        {isChanged ? (
          <FlatList
            data={initialAppointments}
            renderItem={renderItem}
            keyExtractor={(item) => item.AppointmentID}
            contentContainerStyle={styles.listContainer}
          />
        ) : filteredAppointments.length>0 ? (
          <FlatList
            data={filteredAppointments}
            renderItem={renderItem}
            keyExtractor={(item) => item.AppointmentID}
            contentContainerStyle={styles.listContainer}
          />
        ) : (
          <View style={styles.noResults}>
            <Text style={styles.noResultsText}>No appointments found</Text>
          </View>
        )}
      </View>
    </ImageBackground>
  );
}

const statusStyles = {
  confirmed: {
    backgroundColor: '#1abc9c',
  },
  pending: {
    backgroundColor: '#f1c40f',
  },
  cancelled: {
    backgroundColor: '#e74c3c',
  },
};

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
    marginBottom: 30,
    textAlign: 'center',
    color: '#333333',
  },
  dateButton: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: 'center',
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  dateButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  listContainer: {
    paddingBottom: 20,
  },
  appointmentItem: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  patientName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333333',
  },
  detailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  details: {
    fontSize: 16,
    marginRight: 10,
    color: '#666666',
  },
  statusContainer: {
    marginTop: 10,
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  status: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  actionButton: {
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginHorizontal: 5,
  },
  confirmButton: {
    backgroundColor: '#1abc9c',
  },
  cancelButton: {
    backgroundColor: '#e74c3c',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  noResults: {
    alignItems: 'center',
    marginTop: 20,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
});
