import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../../constants/theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, color, size }: { name: IoniconsName; color: string; size: number }) {
  return <Ionicons name={name} size={size} color={color} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown:         false,
        tabBarActiveTintColor:   C.green,
        tabBarInactiveTintColor: '#BBB',
        tabBarStyle: {
          backgroundColor: C.white,
          borderTopColor:  C.border,
          borderTopWidth:  1,
          height:          60,
          paddingBottom:   8,
          paddingTop:      4,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index"   options={{ title: 'Home',    tabBarIcon: ({ color, size }) => <TabIcon name="home"           color={color} size={size} /> }} />
      <Tabs.Screen name="add"     options={{ title: 'Add',     tabBarIcon: ({ color, size }) => <TabIcon name="add-circle"     color={color} size={size} /> }} />
      <Tabs.Screen name="hours"   options={{ title: 'Hours',   tabBarIcon: ({ color, size }) => <TabIcon name="time"           color={color} size={size} /> }} />
      <Tabs.Screen name="money"   options={{ title: 'Money',   tabBarIcon: ({ color, size }) => <TabIcon name="cash"           color={color} size={size} /> }} />
      <Tabs.Screen name="summary" options={{ title: 'Summary', tabBarIcon: ({ color, size }) => <TabIcon name="bar-chart"      color={color} size={size} /> }} />
      <Tabs.Screen name="history" options={{ title: 'History', tabBarIcon: ({ color, size }) => <TabIcon name="list"           color={color} size={size} /> }} />
    </Tabs>
  );
}
