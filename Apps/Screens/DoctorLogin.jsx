import React, { useState } from 'react';
import { TextInput, TouchableOpacity, View, Text, StyleSheet, Alert, Linking, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { app } from "../../fireConfig";
import { getAuth, signInWithEmailAndPassword } from '@firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase, ref, get } from '@firebase/database';
import Icon from 'react-native-vector-icons/FontAwesome';

const auth = getAuth(app);

export default function DoctorLogin() {
    const navigation = useNavigation();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordVisible, setPasswordVisible] = useState(false);

    const fadeAnim = useState(new Animated.Value(0))[0];

    React.useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
        }).start();
    }, [fadeAnim]);

    const database = getDatabase(app);

    function formatEmail(email) {
        const [emailName, domain] = email.split('@');
        const formattedDomain = domain.replace('.com', '');
        const formattedEmail = `${emailName.toLowerCase()}@${formattedDomain}`;
        return formattedEmail;
    }

    const handleLogin = async () => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const doctorDataSnapshot = await get(ref(database, `doctors/${formatEmail(email)}`));
            const doctorData = doctorDataSnapshot.val();

            const specialty = doctorData?.Spl || 'Unknown';
            const name = doctorData?.Name || 'Unknown';
            const image = doctorData?.image || 'Unknown';

            await AsyncStorage.setItem('doctorEmail', email);
            await AsyncStorage.setItem('doctorUid', user.uid);
            await AsyncStorage.setItem('doctorSpecialty', specialty);
            await AsyncStorage.setItem('doctorName', name);
            await AsyncStorage.setItem('doctorImage', image);
            Alert.alert('Login successful!');
            navigation.navigate('DHomeScreen');
        } catch (error) {
            Alert.alert('Invalid Username or Password');
        }
    };

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <Text style={styles.heading}>Doctor Login</Text>
            <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder='Enter Email'
                style={styles.input}
                placeholderTextColor="#999"
            />
            <View style={styles.passwordContainer}>
                <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder='Enter Password'
                    style={styles.passwordInput}
                    placeholderTextColor="#999"
                    secureTextEntry={!passwordVisible}
                />
                <TouchableOpacity
                    style={styles.icon}
                    onPress={() => setPasswordVisible(!passwordVisible)}
                >
                    <Icon name={passwordVisible ? "eye" : "eye-slash"} size={24} color="#333" />
                </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
                onPress={() => Linking.openURL('mailto:jaskirat02042003@gmail.com')}
                style={[styles.button, styles.buttonSecondary]}
            >
                <Text style={styles.buttonText}>Send us an email to create an account "jaskirat02042003@gmail.com"</Text>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F5F5F5",
        padding: 20,
    },
    heading: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
        textShadowColor: 'rgba(0, 0, 0, 0.25)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
    },
    input: {
        width: "100%",
        height: 50,
        borderWidth: 1,
        borderColor: "#CCC",
        borderRadius: 10,
        paddingHorizontal: 16,
        marginBottom: 16,
        backgroundColor: "#FFF",
        color: "#333",
        elevation: 5,
        shadowColor: 'rgba(0, 0, 0, 0.1)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 2,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        borderWidth: 1,
        borderColor: '#CCC',
        borderRadius: 10,
        marginBottom: 16,
        backgroundColor: '#FFF',
        elevation: 5,
        shadowColor: 'rgba(0, 0, 0, 0.1)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 2,
    },
    passwordInput: {
        flex: 1,
        height: 50,
        paddingHorizontal: 16,
        borderRadius: 10,
        backgroundColor: '#FFF',
        color: '#333',
    },
    icon: {
        padding: 10,
    },
    button: {
        width: "100%",
        height: 50,
        backgroundColor: "#007BFF",
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
        elevation: 5,
        shadowColor: 'rgba(0, 0, 0, 0.3)',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.8,
        shadowRadius: 5,
        marginBottom: 30
    },
    buttonSecondary: {
        backgroundColor: "orange",
    },
    buttonText: {
        color: "#FFF",
        fontSize: 18,
        fontWeight: "bold",
        textAlign: "center",
    },
});
