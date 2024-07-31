import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, ImageBackground, SafeAreaView,Platform,KeyboardAvoidingView,TouchableWithoutFeedback } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { getDatabase, ref, onValue, update, get } from '@firebase/database';
import { app } from "../../../fireConfig";
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import { Modal, ModalContent } from 'react-native-modals';
export default function AppointmentRecords() {
  const [appointments, setAppointments] = useState([]);
  const [patientId, setPatientId] = useState(null);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [isTimeSlotsVisible, setTimeSlotsVisibility] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);

  const db = getDatabase(app);

  const isWithin30Minutes = (date1, date2) => {
    const diffInMinutes = Math.abs(date1 - date2) / (1000 * 60);
    return diffInMinutes <= 15;
  };

  useEffect(() => {
    const fetchAppointments = async () => {
      const savedPatientId = await AsyncStorage.getItem('userUid');
      setPatientId(savedPatientId);

      const doctorsRef = ref(db, 'doctors');
      const appointmentsRef = ref(db, 'appointments');

      const doctorsSnapshot = await new Promise((resolve) => onValue(doctorsRef, resolve));
      const appointmentsSnapshot = await new Promise((resolve) => onValue(appointmentsRef, resolve));

      const doctorsData = doctorsSnapshot.val();
      const appointmentsData = appointmentsSnapshot.val();
      const patientAppointments = [];

      for (const doctorEmail in appointmentsData) {
        const doctorAppointments = appointmentsData[doctorEmail];
        for (const patientIdKey in doctorAppointments) {
          if (patientIdKey === savedPatientId) {
            for (const appointmentId in doctorAppointments[patientIdKey]) {
              const appointment = doctorAppointments[patientIdKey][appointmentId];
              patientAppointments.push({
                id: appointmentId,
                doctorEmail,
                doctorName: doctorsData[doctorEmail]?.Name || 'Unknown Doctor',
                ...appointment
              });
            }
          }
        }
      }

      setAppointments(patientAppointments);
    };

    fetchAppointments();
  }, []);

  const handleConfirmDate = async(date) => {
    setSelectedDate(date);
    hideDatePicker();
    await generateTimeSlots(date);
    setTimeSlotsVisibility(true);
  };

  const showDatePicker = (appointment) => {
    setSelectedAppointment(appointment);
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const hideTimeSlots = () => {
    setTimeSlotsVisibility(false);
  };

  const generateTimeSlots = async (date) => {
    const slots = [];
    const startTime = moment(date).set({ hour: 9, minute: 0 });
    const endTime = moment(date).set({ hour: 17, minute: 0 });

    const appointmentsRef = ref(db, `appointments/${selectedAppointment.doctorEmail}`);
    const appointmentsSnapshot = await get(appointmentsRef);
    const appointments = appointmentsSnapshot.val() || {};

    while (startTime.isBefore(endTime)) {
      const slot = startTime.format('hh:mm A');
      let isDisabled = false;

      Object.values(appointments).forEach(patientAppointments => {
        Object.values(patientAppointments).forEach(appointment => {
          const appointmentDateTime = new Date(appointment.DateTime);
          const selectedDateTime = moment(`${date.toLocaleDateString()} ${slot}`, 'MM/DD/YYYY hh:mm A').toDate();
          if (isWithin30Minutes(selectedDateTime, appointmentDateTime)) {
            isDisabled = true;
          }
        });
      });

      slots.push({ time: slot, isDisabled });
      startTime.add(30, 'minutes');
    }
    setTimeSlots(slots);
  };

  const rescheduleAppointment = async () => {
    if (!selectedTimeSlot || !selectedAppointment) return;

    try {
      const updatedAppointment = {
        ...selectedAppointment,
        DateTime: moment(`${selectedDate.toLocaleDateString()} ${selectedTimeSlot}`, 'MM/DD/YYYY hh:mm A').toISOString(),
      };

      const updates = {};
      updates[`appointments/${selectedAppointment.doctorEmail}/${patientId}/${selectedAppointment.id}`] = updatedAppointment;

      await update(ref(db), updates);

      setAppointments((prevAppointments) =>
        prevAppointments.map((appt) =>
          appt.id === selectedAppointment.id ? { ...appt, DateTime: updatedAppointment.DateTime } : appt
        )
      );

      Alert.alert('Success', 'Appointment rescheduled successfully.');
      setSelectedAppointment(null);
      setSelectedDate(null);
      setSelectedTimeSlot(null);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const cancelAppointment = async (appointment) => {
    try {
      const updates = {};
      updates[`appointments/${appointment.doctorEmail}/${patientId}/${appointment.id}/Status`] = 'Cancelled';

      await update(ref(db), updates);

      setAppointments((prevAppointments) =>
        prevAppointments.map((appt) =>
          appt.id === appointment.id ? { ...appt, Status: 'Cancelled' } : appt
        )
      );

      Alert.alert('Success', 'Appointment cancelled successfully.');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.recordItem}>
      <Text style={styles.doctorName}>Doctor: {item.doctorName}</Text>
      <Text style={styles.patientName}>Patient: {item.PatientName}</Text>
      <Text style={styles.details}>Date: {new Date(item.DateTime).toLocaleDateString()}</Text>
      <Text style={styles.details}>Time: {new Date(item.DateTime).toLocaleTimeString()}</Text>
      <Text style={[styles.status, item.Status === 'Confirmed' ? styles.completed : item.Status === 'Cancelled' ? styles.cancelled : styles.pending]}>
        {item.Status}
      </Text>
      {item.Status !== 'Cancelled' && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.rescheduleButton} onPress={() => showDatePicker(item)}>
            <Text style={styles.buttonText}>Reschedule</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={() => cancelAppointment(item)}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderTimeSlotItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.timeSlotItem, selectedTimeSlot === item.time && styles.selectedTimeSlotItem, item.isDisabled && styles.disabledTimeSlotItem]}
      onPress={() => {
        if (!item.isDisabled) {
          setSelectedTimeSlot(item.time);
          hideTimeSlots();
        }
      }}
      disabled={item.isDisabled}
    >
      <Text style={[styles.timeSlotText, item.isDisabled && styles.disabledTimeSlotText]}>{item.time}</Text>
    </TouchableOpacity>
  );

  return (
    <ImageBackground 
      source={require('./../../../assets/images/background.jpeg')} 
      style={styles.backgroundImage}
    >
      <View style={styles.container}>
        <Text style={styles.heading}>Appointment Records</Text>
        <FlatList
          data={appointments}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleConfirmDate}
          onCancel={hideDatePicker}
        />
        {selectedAppointment && (
          <>
            <TouchableOpacity style={styles.bookButton} onPress={rescheduleAppointment}>
              <Text style={styles.bookButtonText}>Confirm Reschedule</Text>
            </TouchableOpacity>
            <Modal
        visible={isTimeSlotsVisible}
        modalStyle={{minWidth:"100%", }}
        onRequestClose={hideTimeSlots}
      >
        <TouchableWithoutFeedback onPress={hideTimeSlots}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalContainer}
          >
            <TouchableWithoutFeedback>
              <SafeAreaView style={styles.safeArea}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalHeading}>Select a Time Slot</Text>
                  <FlatList
                    data={timeSlots}
                    renderItem={renderTimeSlotItem}
                    keyExtractor={(item) => item.time}
                    style={styles.timeSlotList}
                    contentContainerStyle={styles.lp}
                  />
                  <TouchableOpacity style={styles.closeButton} onPress={hideTimeSlots}>
                    <Text style={styles.closeButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </SafeAreaView>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>

            {selectedDate && (
              <Text style={styles.selectedDateTime}>
                Selected Date: {selectedDate.toLocaleDateString()} {selectedTimeSlot}
              </Text>
            )}
          </>
        )}
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
    marginBottom: 30,
    textAlign: 'center',
    color: '#333333',
  },
  listContainer: {
    paddingBottom: 20,
  },
  recordItem: {
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
  doctorName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333333',
  },
  patientName: {
    fontSize: 16,
    marginBottom: 5,
    color: '#666666',
  },
  details: {
    fontSize: 16,
    marginBottom: 5,
    color: '#666666',
  },
  status: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  completed: {
    color: '#1abc9c',
  },
  cancelled: {
    color: '#e74c3c',
  },
  pending: {
    color: '#f1c40f',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  rescheduleButton: {
    backgroundColor: '#f1c40f',
    padding: 10,
    borderRadius: 5,
  },
  cancelButton: {
    backgroundColor: '#e74c3c',
    padding: 10,
    borderRadius: 5,
  },
  bookButton: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
  safeArea: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent:'center',
    zIndex:100
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
   zIndex:100,
    width: '90%',
    maxHeight: '80%',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  modalHeading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  timeSlotList: {
   

    marginBottom: 20,
  },
  timeSlotItem: {
    padding: 10,
    width:100,
    backgroundColor: '#f8f8f8',
    borderRadius: 5,
    marginBottom: 10,
  },
  selectedTimeSlotItem: {
    backgroundColor: '#cce5ff',
  },
  disabledTimeSlotItem: {
    backgroundColor: '#e0e0e0',
  },
  timeSlotText: {
    fontSize: 16,
  },
  disabledTimeSlotText: {
    color: '#a0a0a0',
  },
  closeButton: {
    backgroundColor: '#ff4444',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  closeButtonText: {
    color: '#fff',
    textAlign: 'center',
  },
  selectedDateTime: {
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  }, lp:{
    flexDirection: 'row',
     justifyContent:"space-around",

    flexWrap:"wrap"
  }
});
