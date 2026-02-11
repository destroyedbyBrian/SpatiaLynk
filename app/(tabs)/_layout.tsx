import { useUserAuthStore } from "@/store/userAuthStore";
import { Tabs } from 'expo-router';
import { BarChart, CheckCircle, History, LayoutDashboard, MapPin, MapPinned, User, UserRoundSearch, Users } from "lucide-react-native";
import { ActivityIndicator, View } from "react-native";

export default function TabLayout() {
    const user = useUserAuthStore((s) => s.user);
    const isHydrated = useUserAuthStore((s) => s.isHydrated)

    if (!isHydrated) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    const userRole = user?.user_metadata?.role?.toLowerCase() as 'unregistered' | 'free_user' | 'business' | 'admin';

    const roleBasedTabs = {
        unregistered: ['home', 'profile'],
        free_user: ['home', 'map', 'history', 'profile'],
        business: ['businessDashboard', 'analytics', 'approvals', 'profile'],
        admin: ['adminDashboard', 'userManagement', 'spots', 'profile'],
    } as const

    const tabConfig = {
        home: {
            title: 'Home',
            headerShown: false,
            tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                <UserRoundSearch color={color} size={size} />
            ),
        },
        map: {
            title: 'Map',
            headerShown: false,
            tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                <MapPin color={color} size={size} />
            ),
        },
        history: {
            title: 'History',
            headerShown: false,
            tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                <History color={color} size={size} />
            ),
        },
        businessDashboard: {
            title: 'Business Dashboard',
            headerShown: false,
            tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                <LayoutDashboard color={color} size={size} />
            ),
        },
        analytics: {
            title: 'Analytics',
            headerShown: false,
            tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                <BarChart color={color} size={size} />
            ),
        },
        approvals: {
            title: 'Approvals',
            headerShown: false,
            tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                <CheckCircle color={color} size={size} />
            ),
        },
        adminDashboard: {
            title: 'Admin Dashboard',
            headerShown: false,
            tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                <LayoutDashboard color={color} size={size} />
            ),
        },
        userManagement: {
            title: 'User Management',
            headerShown: false,
            tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                <Users color={color} size={size} />
            ),
        },
        spots: {
            title: 'Spots',
            headerShown: false,
            tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                <MapPinned color={color} size={size} />
            ),
        },
        profile: {
            title: 'Profile',
            headerShown: false,
            tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                <User color={color} size={size} />
            ),
        },
    }; 
    const visibleTabs = roleBasedTabs[userRole] ?? roleBasedTabs['unregistered'];

    type TabName = keyof typeof tabConfig;
    const isTabVisible = (tabName: TabName): boolean => {
        return (visibleTabs as readonly TabName[]).includes(tabName);
    }

    return (
        <Tabs>
            <Tabs.Screen
                name="home"
                options={{
                    ...tabConfig.home,
                    href: isTabVisible('home') ? '/home' : null,
                }}
            />
            <Tabs.Screen
                name="map"
                options={{
                    ...tabConfig.map,
                    href: isTabVisible('map') ? '/map' : null,
                }}
            />
            <Tabs.Screen
                name="history"
                options={{
                    ...tabConfig.history,
                    href: isTabVisible('history') ? '/history' : null,
                }}
            />
            <Tabs.Screen
                name="businessDashboard"
                options={{
                    ...tabConfig.businessDashboard,
                    href: isTabVisible('businessDashboard') ? '/businessDashboard' : null,
                }}
            />
            <Tabs.Screen
                name="analytics"
                options={{
                    ...tabConfig.analytics,
                    href: isTabVisible('analytics') ? '/analytics' : null,
                }}
            />
            <Tabs.Screen
                name="approvals"
                options={{
                    ...tabConfig.approvals,
                    href: isTabVisible('approvals') ? '/approvals' : null,
                }}
            />
            <Tabs.Screen
                name="adminDashboard"
                options={{
                    ...tabConfig.adminDashboard,
                    href: isTabVisible('adminDashboard') ? '/adminDashboard' : null,
                }}
            />
            <Tabs.Screen
                name="userManagement"
                options={{
                    ...tabConfig.userManagement,
                    href: isTabVisible('userManagement') ? '/userManagement' : null,
                }}
            />
            <Tabs.Screen
                name="spots"
                options={{
                    ...tabConfig.spots,
                    href: isTabVisible('spots') ? '/spots' : null,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={tabConfig.profile}
            />
        </Tabs>
    )

}