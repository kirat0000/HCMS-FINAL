import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { getDatabase, ref, onValue } from 'firebase/database';
import { app } from '../../../fireConfig';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import moment from 'moment';

const db = getDatabase(app);

export default function MonthlyReports() {
  const [selectedDate, setSelectedDate] = useState(moment().startOf('month').toDate());
  const [appointmentsSummary, setAppointmentsSummary] = useState({
    total: 0,
    completed: 0,
    canceled: 0,
    rescheduled: 0,
  });
  const [prescriptionsCount, setPrescriptionsCount] = useState(0);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  useEffect(() => {
    const fetchAppointments = () => {
      const selectedMonth = moment(selectedDate).format('YYYY-MM');
      const appointmentsRef = ref(db, 'appointments');
      onValue(appointmentsRef, (snapshot) => {
        let total = 0;
        let completed = 0;
        let canceled = 0;
        let rescheduled = 0;

        snapshot.forEach((doctorSnapshot) => {
          doctorSnapshot.forEach((patientSnapshot) => {
            patientSnapshot.forEach((appointmentSnapshot) => {
              const data = appointmentSnapshot.val();
              const appointmentMonth = moment(data.DateTime).format('YYYY-MM');

              if (appointmentMonth === selectedMonth) {
                total++;
                if (data.Status === 'Completed') {
                  completed++;
                } else if (data.Status === 'Cancelled') {
                  canceled++;
                } else if (data.Status === 'Rescheduled') {
                  rescheduled++;
                }
              }
            });
          });
        });

        setAppointmentsSummary({
          total,
          completed,
          canceled,
          rescheduled,
        });
      });
    };

    const fetchPrescriptions = () => {
      const selectedMonth = moment(selectedDate).format('YYYY-MM');
      const prescriptionsRef = ref(db, 'prescriptions');
      onValue(prescriptionsRef, (snapshot) => {
        let count = 0;

        snapshot.forEach((doctorSnapshot) => {
          doctorSnapshot.forEach((patientSnapshot) => {
            patientSnapshot.forEach((prescriptionSnapshot) => {
              const data = prescriptionSnapshot.val();
              const prescriptionMonth = moment(data.date).format('YYYY-MM');

              if (prescriptionMonth === selectedMonth) {
                count++;
              }
            });
          });
        });

        setPrescriptionsCount(count);
      });
    };

    fetchAppointments();
    fetchPrescriptions();
  }, [selectedDate]);

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirm = (date) => {
    setSelectedDate(moment(date).startOf('month').toDate());
    hideDatePicker();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Select Month for Report</Text>
      <TouchableOpacity onPress={showDatePicker} style={styles.datePickerButton}>
        <Text style={styles.datePickerText}>{moment(selectedDate).format('MMMM YYYY')}</Text>
      </TouchableOpacity>
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleConfirm}
        onCancel={hideDatePicker}
        date={selectedDate}
        display="spinner"
        confirmTextIOS="Confirm"
        cancelTextIOS="Cancel"
      />
      <Text style={styles.heading}>Appointment Summary for {moment(selectedDate).format('MMMM YYYY')}</Text>
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>Total Appointments: {appointmentsSummary.total}</Text>
        <Text style={styles.summaryText}>Completed Appointments: {appointmentsSummary.completed}</Text>
        <Text style={styles.summaryText}>Canceled Appointments: {appointmentsSummary.canceled}</Text>
        
      </View>
      <Text style={styles.heading}>Prescription Summary for {moment(selectedDate).format('MMMM YYYY')}</Text>
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>Total Prescriptions Issued: {prescriptionsCount}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333333',
    textAlign: 'center',
  },
  datePickerButton: {
    width: '100%',
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderColor: '#333333',
    borderWidth: 1,
    marginBottom: 20,
    alignItems: 'center',
  },
  datePickerText: {
    fontSize: 18,
    color: '#333333',
  },
  summaryContainer: {
    width: '100%',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 20,
  },
  summaryText: {
    fontSize: 18,
    marginBottom: 10,
    color: '#333333',
  },
});
