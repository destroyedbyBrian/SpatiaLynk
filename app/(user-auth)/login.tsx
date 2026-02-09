import { supabase } from "@/services/supabase";
import { useUserAuthStore } from "@/store/userAuthStore";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
	Alert,
	Button,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

export default function LoginScreen() {
	const [loading, setLoading] = useState(false);
	const [isRegistering, setIsRegistering] = useState(false);
	const { setUser } = useUserAuthStore()

	const [fullName, setFullName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	async function handleSignIn() {
		if (!email || !password) {
			Alert.alert("Notice", "Please enter email and password");
			return;
		}
		setLoading(true);

		try {
			const { data, error } = await supabase.auth.signInWithPassword({
				email: email.trim(),
				password,
			});

			if (error) throw error;

			// Check profile and get role
			if (data.session) {
				const { data: userProfile, error: profileError } = await supabase
					.from("users")
					.select("is_active, role") 
					.eq("auth_id", data.session.user.id)
					.single();

				if (profileError) {
					console.error("Failed to fetch user info:", profileError);
					setUser(data.user); // Set basic user even if profile fetch fails
					router.replace("/(tabs)/profile");
					return;
				}

				// Check deactivation
				if (userProfile && userProfile.is_active === false) {
					await supabase.auth.signOut();
					Alert.alert("Login Denied", "Account deactivated");
					setLoading(false);
					return;
				}

				const userWithRole = {
					...data.user,
					user_metadata: {
						...data.user.user_metadata,
						role: userProfile.role 
					}
				};
				setUser(userWithRole);
				router.replace('/(tabs)/profile');
			}
		} catch (error: any) {
			Alert.alert("Login Failed", error.message);
			setLoading(false);
		}
	}

	async function handleSignUp() {
		if (!email || !password || !fullName) {
			Alert.alert("Notice", "Please fill in all information");
			return;
		}
		setLoading(true);

		try {
			const { data, error } = await supabase.auth.signUp({
				email: email.trim(),
				password: password,
				options: { 
					data: { 
						full_name: fullName,
						role: "free_user"
					} 
				}, 
			});

			if (error) throw error;

			if (data.session && data.user) {
				setUser(data.user);
				router.replace("/(user-auth)/onboarding");
			} else {
				Alert.alert(
					"Registration Successful",
					"Please check your email for verification."
				);
				setIsRegistering(false);
			}
		} catch (error: any) {
			Alert.alert("Registration Failed", error.message);
		} finally {
			setLoading(false);
		}
	}

	return (
		<ScrollView contentContainerStyle={styles.container}>
				
			<TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
				<Ionicons name="close" size={30} color="#333" />
			</TouchableOpacity>

			<View style={styles.card}>
				<Text style={styles.title}>
				{isRegistering ? "Sign Up" : "SpatiaLynk Login"}
				</Text>

				{isRegistering && (
				<>
					<Text style={styles.label}>Full Name</Text>
					<TextInput
					style={styles.input}
					onChangeText={setFullName}
					value={fullName}
					placeholder="e.g., Mike"
					/>
				</>
				)}

				<Text style={styles.label}>Email</Text>
				<TextInput
					style={styles.input}
					onChangeText={setEmail}
					value={email}
					placeholder="name@example.com"
					autoCapitalize="none"
					keyboardType="email-address"
				/>

				<Text style={styles.label}>Password</Text>
				<TextInput
					style={styles.input}
					onChangeText={setPassword}
					value={password}
					secureTextEntry={true}
					placeholder="Password"
					autoCapitalize="none"
				/>

				<Button
					title={loading ? "Processing..." : isRegistering ? "Next" : "Login"}
					onPress={isRegistering ? handleSignUp : handleSignIn}
					disabled={loading}
				/>

				<TouchableOpacity
					style={{ marginTop: 20, alignItems: "center" }}
					onPress={() => setIsRegistering(!isRegistering)}
				>
				<Text style={{ color: "#007AFF" }}>
					{isRegistering ? "Have an account? Login" : "Register New Account"}
				</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={{ marginTop: 30, alignItems: "center" }}
					onPress={() => router.push("/privacy" as any)}
				>
				<Text
					style={{
					color: "#999",
					fontSize: 12,
					textDecorationLine: "underline",
					}}
				>
					Read Privacy Policy
				</Text>
				</TouchableOpacity>
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flexGrow: 1,
		justifyContent: "center",
		padding: 20,
		backgroundColor: "#f5f5f5",
	},
	backBtn: { position: "absolute", top: 50, right: 20, zIndex: 10 },
	card: {
		backgroundColor: "white",
		padding: 25,
		borderRadius: 15,
		elevation: 5,
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		marginBottom: 20,
		textAlign: "center",
	},
	label: { marginBottom: 8, color: "#333", fontWeight: "bold" },
	input: {
		height: 50,
		borderWidth: 1,
		borderColor: "#eee",
		borderRadius: 10,
		paddingHorizontal: 15,
		marginBottom: 15,
		backgroundColor: "#f9f9f9",
	},	
});
