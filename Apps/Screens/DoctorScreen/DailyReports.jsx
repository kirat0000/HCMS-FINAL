import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { getDatabase, ref, onValue } from 'firebase/database';
import { app } from '../../../fireConfig';
import moment from 'moment';

const db = getDatabase(app);

export default function DailyReports() {
  const [appointmentsSummary, setAppointmentsSummary] = useState({
    total: 0,
    completed: 0,
    canceled: 0,
    rescheduled: 0,
  });
  const [prescriptionsCount, setPrescriptionsCount] = useState(0);

  useEffect(() => {
    const fetchAppointments = () => {
      const today = moment().format('YYYY-MM-DD');
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
              const appointmentDate = moment(data.DateTime).format('YYYY-MM-DD');

              if (appointmentDate === today) {
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
      const today = moment().format('YYYY-MM-DD');
      const prescriptionsRef = ref(db, 'prescriptions');
      onValue(prescriptionsRef, (snapshot) => {
        let count = 0;

        snapshot.forEach((doctorSnapshot) => {
          doctorSnapshot.forEach((patientSnapshot) => {
            patientSnapshot.forEach((prescriptionSnapshot) => {
              const data = prescriptionSnapshot.val();
              const prescriptionDate = moment(data.date).format('YYYY-MM-DD');

              if (prescriptionDate === today) {
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
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Today's Appointment Summary</Text>
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>Total Appointments: {appointmentsSummary.total}</Text>
        <Text style={styles.summaryText}>Completed Appointments: {appointmentsSummary.completed}</Text>
        <Text style={styles.summaryText}>Canceled Appointments: {appointmentsSummary.canceled}</Text>
      
      </View>
      <Text style={styles.heading}>Today's Prescription Summary</Text>
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
