import { Stack } from "expo-router";

export default function UserAuthLayout() {
    return (
        <Stack>
            <Stack.Screen 
                name="login" 
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="privacy"
                options={{
                    headerShown: false,
                }}    
            />
        </Stack>
    )
}