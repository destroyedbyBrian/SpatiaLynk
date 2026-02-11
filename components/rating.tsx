import { supabase } from "@/services/supabase";
import { useUserAuthStore } from '@/store/userAuthStore';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { useState } from 'react';
import {
	Alert,
	Modal,
	Pressable,
	StyleSheet,
	Text,
	TouchableOpacity,
	View
} from 'react-native';
import { styled } from "styled-components";


const RecommendationCard = ({ poiId }: {poiId: string}) => {
	const [modalVisible, setModalVisible] = useState(false);
	const [selectedRating, setSelectedRating] = useState(0);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const { user } = useUserAuthStore()

	const handleRatings = () => {
		setSelectedRating(0);
		setModalVisible(true);
	};

	const handleCancel = () => {
		setModalVisible(false);
		setSelectedRating(0);
	};

	const handleSubmit = async () => {
		if (selectedRating === 0) {
		Alert.alert('Please select a rating');
		return;
	}

	setIsSubmitting(true);
	try {

		console.log('Submitting rating:', selectedRating);

		const { data: dbUser } = await supabase
		.from('users')
		.select('user_id')
		.eq('auth_id', user?.id)
		.single();

		const payload = {
			user_id: dbUser?.user_id,
			poi_id: poiId,
			interaction_type: 'rating',
			value: selectedRating,
			timestamp: new Date().toISOString(),
		};

		const { error } = await supabase
			.from("user_interactions")
			.upsert(payload, { 
				onConflict: 'user_id,poi_id,interaction_type',
		});
		
		if (error) {
			console.error('Supabase error:', error);
			throw error;
		}

		Alert.alert('Thank you!', `You rated this ${selectedRating} stars.`);
		setModalVisible(false);
		setSelectedRating(0);
		} catch (error) {
		Alert.alert('Error', 'Failed to submit rating');
		} finally {
		setIsSubmitting(false);
	}
	};

	return (
		<>
		<ActionsRow>
			<ActionButton onPress={handleRatings}>
			<ActionButtonText>Rate recommendation</ActionButtonText>
			</ActionButton>
		</ActionsRow>

		<Modal
			animationType="fade"
			transparent={true}
			visible={modalVisible}
			onRequestClose={handleCancel}
		>
			<View style={styles.modalOverlay}>
			<View style={styles.modalContent}>
				<Text style={styles.title}>Rate this Recommendation</Text>
				<Text style={styles.subtitle}>Tap a star to rate</Text>
				
				<View style={styles.starsContainer}>
				{[1, 2, 3, 4, 5].map((star) => (
					<TouchableOpacity
					key={star}
					onPress={() => setSelectedRating(star)}
					activeOpacity={0.7}
					style={styles.starButton}
					>
						<MaterialDesignIcons name={star <= selectedRating ? 'star' : 'star-outline'}  color="#ff0000" size={30} />

					</TouchableOpacity>
				))}
				</View>

				<Text style={styles.ratingLabel}>
				{selectedRating > 0 ? `${selectedRating} of 5 stars` : ''}
				</Text>

				<View style={styles.buttonRow}>
				<TouchableOpacity
					style={[styles.button, styles.cancelBtn]}
					onPress={handleCancel}
					disabled={isSubmitting}
				>
					<Text style={styles.cancelText}>Cancel</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={[
					styles.button, 
					styles.submitBtn,
					selectedRating === 0 && styles.disabledBtn
					]}
					onPress={handleSubmit}
					disabled={isSubmitting || selectedRating === 0}
				>
					<Text style={styles.submitText}>
					{isSubmitting ? 'Submitting...' : 'Submit'}
					</Text>
				</TouchableOpacity>
				</View>
			</View>
			</View>
		</Modal>
		</>
	);
};

const styles = StyleSheet.create({
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.6)',
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	modalContent: {
		backgroundColor: 'white',
		borderRadius: 16,
		padding: 28,
		width: '100%',
		maxWidth: 340,
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 4,
		elevation: 5,
	},
	title: {
		fontSize: 20,
		fontWeight: '700',
		color: '#1a1a1a',
		marginBottom: 6,
	},
	subtitle: {
		fontSize: 14,
		color: '#666',
		marginBottom: 24,
	},
	starsContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 16,
		gap: 8,
	},
	starButton: {
		padding: 4,
	},
	starEmoji: {
		fontSize: 36,
	},
	ratingLabel: {
		fontSize: 14,
		color: '#333',
		fontWeight: '500',
		marginBottom: 24,
		height: 20,
	},
	buttonRow: {
		flexDirection: 'row',
		width: '100%',
		gap: 12,
	},
	button: {
		flex: 1,
		paddingVertical: 12,
		borderRadius: 10,
		alignItems: 'center',
	},
	cancelBtn: {
		backgroundColor: '#f2f2f2',
	},
	submitBtn: {
		backgroundColor: '#007AFF',
	},
	disabledBtn: {
		backgroundColor: '#b3d7ff',
	},
	cancelText: {
		color: '#666',
		fontWeight: '600',
		fontSize: 15,
	},
	submitText: {
		color: 'white',
		fontWeight: '600',
		fontSize: 15,
	},
});

export default RecommendationCard;

const ActionsRow = styled(View)`
  flex-direction: row;
  padding-top: 8px;
`

const ActionButton = styled(Pressable)`
  flex: 1;
  flex-direction: row;
  justify-content: center;
  background-color: #F5F5F5;
  padding: 14px;
  border-radius: 8px;
  align-items: center;
  border-width: 1px;
  border-color: #E0E0E0;
  gap: 4px;
`;

const ActionButtonText = styled(Text)`
  font-size: 14px;
  font-weight: 600;
  color: #333;
`;
