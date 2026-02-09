import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

const Index = () => {
    const [onBoarding, setOnBoarding] = useState<boolean>(false)

    if (!onBoarding) {
        return (
            <Redirect href="/(tabs)/home" />
        )
    }
    return (
        <View>
            <Text>index</Text>
        </View>
    )
}

export default Index