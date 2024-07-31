import * as React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';



export default function Reports() {
  const navigation = useNavigation();
  return (
    <View style={{flex:1,height:"100%",alignItems:'center',justifyContent:"center"}}>

<TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.navigate('Graph')}
        >
          <Text style={styles.buttonText}>Graph Demonstratrion</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.navigate('Daily Report')}
        >
          <Text style={styles.buttonText}>Daily Report</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.navigate('Monthly Report')}
        >
          <Text style={styles.buttonText}>Monthly Report</Text>
        </TouchableOpacity>
    </View>


  )
}


const styles = StyleSheet.create({

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
})