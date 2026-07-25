import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="search" options={{ title: 'Recherche' }} />
      <Tabs.Screen name="queue" options={{ title: "File d'attente" }} />
    </Tabs>
  );
}
