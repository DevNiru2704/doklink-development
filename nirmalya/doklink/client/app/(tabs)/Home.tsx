import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface HomeProps{
    onLogout: () => void;
    onGoToStartingScreen: () => void;
};

export default function Home({ onLogout, onGoToStartingScreen }: HomeProps) {
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.comingSoonText}>
                    Home Page coming soon
                </Text>
                
                <TouchableOpacity 
                    style={styles.logoutButton}
                    onPress={onLogout}
                >
                    <Text style={styles.logoutButtonText}>
                        Logout
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    comingSoonText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#E2E8F0',
        textAlign: 'center',
        marginBottom: 40,
        letterSpacing: 1,
    },
    logoutButton: {
        backgroundColor: '#e53935', // Red shade
        paddingVertical: 18,
        paddingHorizontal: 32,
        borderRadius: 25,
        alignItems: 'center',
        minWidth: 280,
    },
    logoutButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
});