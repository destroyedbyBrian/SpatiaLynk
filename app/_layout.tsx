import { Stack } from 'expo-router';

export default function RootLayout() {
return (
    <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(create-request)/(steps)" />
        <Stack.Screen name="(user-auth)" options={{ presentation: 'modal' }}/>
        <Stack.Screen name="(report)" />
    </Stack>
    );
}