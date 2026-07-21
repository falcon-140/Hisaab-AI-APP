import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '../../constants/theme';
import { useHisaab, isRecurringDue } from '../../context/HisaabContext';

const icons: Record<string, string> = {
  index:    '🏠',
  add:      '➕',
  hours:    '⏱',
  money:    '💰',
  summary:  '📊',
  history:  '📋',
  settings: '⚙️',
};

function TabIcon({ name, focused, badge }: { name: string; focused: boolean; badge?: number }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 19, opacity: focused ? 1 : 0.45 }}>{icons[name] ?? '•'}</Text>
      {!!badge && badge > 0 && (
        <View style={{ position: 'absolute', top: -4, right: -8, backgroundColor: C.expense, borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 }}>
          <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '800' }}>{badge}</Text>
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { data } = useHisaab();
  const dueBadge = (data.recurringTxs || []).filter(r => isRecurringDue(r)).length;

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor:   C.green,
        tabBarInactiveTintColor: '#BBB',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor:  C.border,
          borderTopWidth:  1,
          height:          50 + insets.bottom,
          paddingBottom:   insets.bottom || 8,
          paddingTop:      6,
        },
        tabBarLabelStyle: { fontSize: 9, fontWeight: '600' },
        tabBarIcon: ({ focused }) => (
          <TabIcon
            name={route.name}
            focused={focused}
            badge={route.name === 'settings' ? dueBadge : undefined}
          />
        ),
      })}
    >
      <Tabs.Screen name="index"    options={{ title: 'Home'     }} />
      <Tabs.Screen name="add"      options={{ title: 'Add'      }} />
      <Tabs.Screen name="hours"    options={{ title: 'Hours'    }} />
      <Tabs.Screen name="money"    options={{ title: 'Money'    }} />
      <Tabs.Screen name="summary"  options={{ title: 'Summary'  }} />
      <Tabs.Screen name="history"  options={{ title: 'History'  }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
