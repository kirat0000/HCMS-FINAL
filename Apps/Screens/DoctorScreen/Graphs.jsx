import React, { useEffect, useState } from 'react';
import { View, Text, Dimensions, ScrollView, StyleSheet } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { getDatabase, ref, onValue } from 'firebase/database';
import { app } from '../../../fireConfig';

const db = getDatabase(app);

export default function Graphs() {
  const [ageData, setAgeData] = useState([]);
  const [genderData, setGenderData] = useState({ male: 0, female: 0, notSay: 0 });

  useEffect(() => {
    const fetchData = () => {
      const usersRef = ref(db, 'users');
      onValue(usersRef, (snapshot) => {

        const ageCounts = {};
        let maleCount = 0;
        let femaleCount = 0;
        let notSayCount = 0;

        snapshot.forEach((childSnapshot) => {
          const data = childSnapshot.val();
          const age = data.age;
          const gender = data.gender;

          ageCounts[age] = (ageCounts[age] || 0) + 1;

          if (gender === 'Male') {
            maleCount++;
          } else if (gender === 'Female') {
            femaleCount++;
          } else if (gender === 'Not To Say') {
            notSayCount++;
          }
        });

        setAgeData(Object.entries(ageCounts).map(([age, count]) => ({ age, count })));
        setGenderData({ male: maleCount, female: femaleCount, notSay: notSayCount });
      });
    };

    fetchData();
  }, []);

  const ageChartData = {
    labels: ageData.map((data) => data.age),
    datasets: [
      {
        data: ageData.map((data) => data.count),
      },
    ],
  };

  const genderChartData = {
    labels: ['Male', 'Female', 'Not To Say'],
    datasets: [
      {
        data: [genderData.male, genderData.female, genderData.notSay],
      },
    ],
  };

  const screenWidth = Dimensions.get('window').width;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Patient Demographics: Breakdown by Age</Text>
        <BarChart
          data={ageChartData}
          width={screenWidth - 40}
          height={220}
          chartConfig={chartConfig}
          style={styles.chart}
        />
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Patient Demographics: Breakdown by Gender</Text>
        <BarChart
          data={genderChartData}
          width={screenWidth - 40} 
          height={220}
          chartConfig={chartConfig}
          style={styles.chart}
        />
      </View>
    </ScrollView>
  );
}

const chartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  chartContainer: {
    marginVertical: 20,
    width: '100%',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 16,
  },
});
