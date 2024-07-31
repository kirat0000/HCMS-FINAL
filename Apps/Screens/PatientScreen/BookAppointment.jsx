import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, SafeAreaView, ScrollView, Platform, TextInput, Alert, TouchableWithoutFeedback, KeyboardAvoidingView } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { getDatabase, ref, onValue, set, get, push, update } from '@firebase/database';
import { app } from "../../../fireConfig";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { send, EmailJSResponseStatus } from '@emailjs/react-native';
import moment from 'moment';
import { Modal, ModalContent } from 'react-native-modals';

export default function BookAppointment() {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [note, setNote] = useState('');
  const [isTimeSlotsVisible, setTimeSlotsVisibility] = useState(false);
  const modalRef = useRef(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [op, setOP] = useState(false);
  const db = getDatabase(app);

  const isWithin30Minutes = (date1, date2) => {
    const diffInMinutes = Math.abs(date1 - date2) / (1000 * 60);
    return diffInMinutes <= 15;
  };

  useEffect(() => {
    const doctorsRef = ref(db, 'doctors');
    onValue(doctorsRef, (snapshot) => {
      const data = snapshot.val();
      const doctorList = data ? Object.keys(data).map(key => ({
        id: key,
        name: data[key].Name,
        specialty: data[key].Spl,
      })) : [];
      setDoctors(doctorList);
    });
  }, []);

  useEffect(() => {
    console.log(isTimeSlotsVisible);
  }, [isTimeSlotsVisible, op]);

  const formatDateTime = (date) => {
    if (!date) return '';
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
  };

  const handleConfirmDate = async (date) => {
    setSelectedDate(date);
    hideDatePicker();
    await generateTimeSlots(date);
  };

  const showDatePicker = () => {
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

    const appointmentsRef = ref(db, `appointments/${selectedDoctor.id}`);
    const appointmentsSnapshot = await get(appointmentsRef);
    const appointments = appointmentsSnapshot.val() || {};

    while (startTime.isBefore(endTime)) {
      const slot = startTime.format('hh:mm A');
      let isDisabled = false;

      Object.values(appointments).forEach(patientAppointments => {
        Object.values(patientAppointments).forEach(appointment => {
          const appointmentDateTime = new Date(appointment.DateTime);
          const selectedDateTime = moment(`${moment(date).format('MM/DD/YYYY')} ${slot}`, 'MM/DD/YYYY hh:mm A').toDate();
          if (isWithin30Minutes(selectedDateTime, appointmentDateTime)) {
            isDisabled = true;
          }
        });
      });

      slots.push({ time: slot, isDisabled });
      startTime.add(30, 'minutes');
    }
    setTimeSlots(slots);
    setTimeSlotsVisibility(true);
    setOP(true);
  };

  const sendEmail = async (doctorEmail, appointmentData, patientAge, healthNumber) => {
    try {
      await send(
        'service_845yia8',
        'template_f5jnrfc',
        {
          doctorEmail: doctorEmail + ".com",
          patientName: appointmentData.PatientName,
          patientAge: patientAge,
          healthNumber: healthNumber,
          date: formatDateTime(new Date(appointmentData.DateTime)),
          note: appointmentData.Note,
        },
        {
          publicKey: 'FQxoNhAD7fKegopxL',
          privateKey: 'TC8bIPRxyaLTxVAtr1qow',
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

  const bookAppointment = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTimeSlot) {
      Alert.alert('Error', 'Please select a doctor, date, and time.');
      return;
    }

    try {
      const userUid = await AsyncStorage.getItem('userUid');

      const appointmentsRef = ref(db, `appointments/${selectedDoctor.id}`);
      const appointmentsSnapshot = await get(appointmentsRef);
      const appointments = appointmentsSnapshot.val() || {};
      const selectedDateTime = moment(`${moment(selectedDate).format('MM/DD/YYYY')} ${selectedTimeSlot}`, 'MM/DD/YYYY hh:mm A').toDate();

      let conflict = false;

      Object.values(appointments).forEach(patientAppointments => {
        Object.values(patientAppointments).forEach(appointment => {
          const appointmentDateTime = new Date(appointment.DateTime);
          if (isWithin30Minutes(selectedDateTime, appointmentDateTime)) {
            conflict = true;
          }
        });
      });

      if (conflict) {
        Alert.alert('Error', 'There is already an appointment scheduled within 30 minutes of your selected time. Please choose a different time.');
        return;
      }

      const userRef = ref(db, `users/${userUid}`);
      const userSnapshot = await get(userRef);
      const userData = userSnapshot.val();
      const patientName = userData.name;
      const patientAge = userData.age;
      const healthNumber = userData.healthNumber;
      const appointmentData = {
        DateTime: selectedDateTime.toISOString(),
        PatientName: patientName,
        DoctorID: selectedDoctor.id,
        email: userData.email,
        DoctorName: selectedDoctor.name,
        Status: "Pending",
        PatientID: userUid,
        Note: note
      };

      console.log(appointmentData.email);

      const newAppointmentRef = push(ref(db, 'appointments'));
      const appointmentId = newAppointmentRef.key;

      appointmentData.AppointmentID = appointmentId;

      const updates = {};
      updates[`appointments/${selectedDoctor.id}/${userUid}/${appointmentId}`] = appointmentData;

      await update(ref(db), updates);

      sendEmail(selectedDoctor.id, appointmentData, patientAge, healthNumber);

      Alert.alert('Pending', `Appointment request with ${selectedDoctor.name} on ${formatDateTime(selectedDateTime)}. Appointment ID: ${appointmentId}`);
      setSelectedDoctor(null);
      setSelectedDate(null);
      setSelectedTimeSlot(null);
      setNote('');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.doctorItem, selectedDoctor?.id === item.id && styles.selectedDoctorItem]}
      onPress={() => setSelectedDoctor(item)}
    >
      <Text style={styles.doctorName}>{item.name}</Text>
      <Text style={styles.specialty}>{item.specialty}</Text>
    </TouchableOpacity>
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
    <View style={styles.container}>
      <Text style={styles.heading}>Select a Doctor</Text>
      <FlatList
        data={doctors}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
      />

      {selectedDate && (
        <Text style={styles.selectedDateTime}>
          Selected: {(selectedDate.toLocaleDateString())} at {(selectedTimeSlot)}
        </Text>
      )}

      {selectedDoctor && (
        <>
          <TextInput
            style={styles.noteInput}
            placeholder="Enter a note for the doctor (optional)"
            value={note}
            onChangeText={setNote}
          />
          <TouchableOpacity style={styles.dateButton} onPress={showDatePicker}>
            <Text style={styles.dateButtonText}>Select Date</Text>
          </TouchableOpacity>
          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode="date"
            onConfirm={handleConfirmDate}
            onCancel={hideDatePicker}
          />
        </>
      )}

      <TouchableOpacity
        style={styles.bookButton}
        onPress={bookAppointment}
      >
        <Text style={styles.bookButtonText}>Book Appointment</Text>
      </TouchableOpacity>

      <Modal
        visible={isTimeSlotsVisible}
        modalStyle={{minWidth:"100%", }}
        onRequestClose={hideTimeSlots}
        hasOverlay={true}
      >
        <TouchableWithoutFeedback onPress={hideTimeSlots}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalContainer}
          >
            <TouchableWithoutFeedback>
              <SafeAreaView style={styles.safeArea}>
                <View style={styles.modalContent} ref={modalRef}>
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

{isTimeSlotsVisible && <View><Text>Op</Text></View>}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  list: {
    marginBottom: 20,
  },
  doctorItem: {
    padding: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 5,
    marginBottom: 10,
  },
  selectedDoctorItem: {
    backgroundColor: '#cce5ff',
  },
  doctorName: {
    fontSize: 18,
  },
  specialty: {
    fontSize: 14,
    color: '#555',
  },
  dateButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  dateButtonText: {
    color: '#fff',
    textAlign: 'center',
  },
  bookButton: {
    backgroundColor: '#28a745',
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  bookButtonText: {
    color: '#fff',
    textAlign: 'center',
  },
  selectedDateTime: {
    fontSize: 16,
    marginTop: 10,
  },
  noteInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginTop: 10,
    paddingLeft: 10,
    borderRadius: 5,
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
  lp:{
    flexDirection: 'row',
    justifyContent:"space-around",
    flexWrap:"wrap"
  }
});
