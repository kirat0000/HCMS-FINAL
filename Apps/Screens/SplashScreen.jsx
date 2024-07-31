import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, ImageBackground, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function SplashScreen() {
    const navigation = useNavigation();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const bounceAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(bounceAnim, {
                toValue: 1,
                friction: 2,
                useNativeDriver: true,
            }),
        ]).start();
    }, [fadeAnim, bounceAnim]);

    const navigateToChooseLogin = () => {
        navigation.navigate('ChooseLogin');
    };

    return (
        <ImageBackground
            source={require('./../../assets/images/background.jpeg')}
            style={styles.backgroundImage}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Animated.View style={[styles.logoContainer, { opacity: fadeAnim, transform: [{ scale: bounceAnim }] }]}>
                        <Image
                            source={require('./../../assets/images/logo.jpeg')}
                            style={styles.logo}
                        />
                    </Animated.View>
                    <View style={styles.textContainer}>
                        <Text style={styles.boldText}>Welcome to Health Care Management System</Text>
                    </View>
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.customButton} onPress={navigateToChooseLogin}>
                            <Text style={styles.customButtonText}>Let's Get Started</Text>
                        </TouchableOpacity>
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
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    logoContainer: {
        borderWidth: 3,
        borderColor: 'black',
        marginBottom: 20,
        backgroundColor: 'rgba(255, 255, 255, 1)',
        padding: 10,
        borderRadius: 10,
        elevation: 10,
        shadowColor: 'rgba(0, 0, 0, 0.3)',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.8,
        shadowRadius: 5,
    },

    logo: {
        width: 330,
        height: 300,
        resizeMode: 'contain',
    },

    textContainer: {
        borderWidth: 3,
        borderColor: 'black',
        padding: 20,
        marginBottom: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 10,
        elevation: 10,
        shadowColor: 'rgba(0, 0, 0, 0.3)',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.8,
        shadowRadius: 5,
    },

    boldText: {
        fontWeight: 'bold',
        fontSize: 24,
        textAlign: 'center',
        color: 'black',
    },

    buttonContainer: {
        marginTop: 50,
    },

    customButton: {
        backgroundColor: '#007BFF',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 5,
        elevation: 10,
        shadowColor: 'rgba(0, 0, 0, 0.3)',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.8,
        shadowRadius: 5,
    },

    customButtonText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
