import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, ImageBackground, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function ChooseLogin() {
    const navigation = useNavigation();
    const doctorScale = new Animated.Value(1);
    const patientScale = new Animated.Value(1);

    const navigateToPatientLogin = () => {
        navigation.navigate('PatientLogin');
    };

    const navigateToDoctorLogin = () => {
        navigation.navigate('DoctorLogin');
    };

    const animateButton = (scaleValue) => {
        Animated.sequence([
            Animated.timing(scaleValue, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(scaleValue, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();
    };

    return (
        <ImageBackground 
            source={require('./../../assets/images/background.jpeg')} 
            style={styles.backgroundImage}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Text style={styles.heading}>Choose Login Type</Text>
                    <View style={styles.optionContainer}>
                        <Animated.View style={[styles.option, { transform: [{ scale: doctorScale }] }]}>
                            <TouchableOpacity 
                                onPress={() => {
                                    animateButton(doctorScale);
                                    navigateToDoctorLogin();
                                }}
                            >
                                <Image
                                    source={require('./../../assets/images/doctoranimate.jpeg')}
                                    style={styles.optionImage}
                                />
                                <Text style={styles.optionText}>Login as Doctor</Text>
                            </TouchableOpacity>
                        </Animated.View>
                        <Animated.View style={[styles.option, { transform: [{ scale: patientScale }] }]}>
                            <TouchableOpacity 
                                onPress={() => {
                                    animateButton(patientScale);
                                    navigateToPatientLogin();
                                }}
                            >
                                <Image
                                    source={require('./../../assets/images/patientanimate.jpeg')}
                                    style={styles.optionImage}
                                />
                                <Text style={styles.optionText}>Login as Patient</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                </View>
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

    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },

    container: {
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: 20,
        borderRadius: 20,
        elevation: 10,
    },

    heading: {
        fontSize: 30,
        fontWeight: 'bold',
        color: 'black',
        marginBottom: 20,
        textShadowColor: 'rgba(0, 0, 0, 0.25)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
    },

    optionContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },

    option: {
        alignItems: 'center',
        marginHorizontal: 10,
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 20,
        elevation: 5,
        width: '45%',
        shadowColor: 'rgba(0, 0, 0, 0.2)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.8,
        shadowRadius: 6,
    },

    optionImage: {
        width: 100,
        height: 100,
        resizeMode: 'contain',
        marginBottom: 10,
        alignSelf: 'center'
    },

    optionText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: 'black',
        backgroundColor: '#007BFF',
        padding: 10,
        borderRadius: 10,
        textAlign: 'center',
        width: '100%',
        textShadowColor: 'rgba(0, 0, 0, 0.25)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
        backgroundColor: 'linear-gradient(90deg, #007BFF 0%, #00D4FF 100%)',
    },
});
