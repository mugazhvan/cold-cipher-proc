import { Tabs } from 'expo-router';
import { Home, Compass, CalendarPlus, QrCode, LogOut } from 'lucide-react-native';
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
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#10B981',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          backgroundColor: '#0F172A',
          borderTopColor: '#1E293B',
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
        },
        headerStyle: {
          backgroundColor: '#0F172A',
        },
        headerTitleStyle: {
          color: '#FFFFFF',
          fontSize: 16,
          fontWeight: '800',
        },
        headerTintColor: '#10B981',
        headerRight: () => (
          <TouchableOpacity onPress={handleLogout} style={{ marginRight: 16 }}>
            <LogOut size={20} color="#EF4444" />
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Home size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="radar"
        options={{
          title: 'Mandi Radar',
          tabBarIcon: ({ color }) => <Compass size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="book"
        options={{
          title: 'Book Slot',
          tabBarIcon: ({ color }) => <CalendarPlus size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="epass"
        options={{
          title: 'e-Gate Pass',
          tabBarIcon: ({ color }) => <QrCode size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
