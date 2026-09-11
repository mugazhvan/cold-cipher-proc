import { Tabs } from 'expo-router';
import { Home, CalendarPlus, QrCode, LogOut } from 'lucide-react-native';
import { TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';

export default function TabLayout() {
  const { logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() }
    ]);
  };

  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#2ECC71',
      headerRight: () => (
        <TouchableOpacity onPress={handleLogout} style={{ marginRight: 16 }}>
          <LogOut size={24} color="#E74C3C" />
        </TouchableOpacity>
      )
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="book"
        options={{
          title: 'Book Slot',
          tabBarIcon: ({ color }) => <CalendarPlus size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="epass"
        options={{
          title: 'E-Pass',
          tabBarIcon: ({ color }) => <QrCode size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
