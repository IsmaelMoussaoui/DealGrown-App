import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  PanResponder,
  Animated,
  Dimensions,
} from 'react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const DISMISS_THRESHOLD = 100; // Distance de swipe nécessaire pour fermer

interface DealDetailsProps {
  isVisible: boolean;
  onClose: () => void;
  deal: any; // Remplacer par votre type Deal
}

const DealDetails: React.FC<DealDetailsProps> = ({ isVisible, onClose, deal }) => {
  const panY = React.useRef(new Animated.Value(0)).current;

  const resetPositionAnim = Animated.timing(panY, {
    toValue: 0,
    duration: 200,
    useNativeDriver: true,
  });

  const closeAnim = Animated.timing(panY, {
    toValue: SCREEN_HEIGHT,
    duration: 200,
    useNativeDriver: true,
  });

  const translateY = panY.interpolate({
    inputRange: [0, SCREEN_HEIGHT],
    outputRange: [0, SCREEN_HEIGHT],
    extrapolate: 'clamp',
  });

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > DISMISS_THRESHOLD) {
          closeAnim.start(() => {
            panY.setValue(0);
            onClose();
          });
        } else {
          resetPositionAnim.start();
        }
      },
    })
  ).current;

  React.useEffect(() => {
    if (isVisible) {
      panY.setValue(0);
    }
  }, [isVisible]);

  if (!deal) return null;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={() => {
        closeAnim.start(() => {
          panY.setValue(0);
          onClose();
        });
      }}
    >
      <View style={styles.modalOverlay}>
        <Animated.View 
          style={[
            styles.modalContent,
            {
              transform: [{ translateY }]
            }
          ]}
        >
          <View {...panResponder.panHandlers} style={styles.dragHandle}>
            <View style={styles.swipeIndicator} />
          </View>

          <View style={styles.dealFullContent}>
            <Text style={styles.modalTitle}>{deal.title}</Text>
            
            <View style={styles.priceSection}>
              <View style={styles.modalPriceContainer}>
                <Text style={styles.modalCurrentPrice}>{deal.currentPrice}€</Text>
                <Text style={styles.modalOriginalPrice}>{deal.originalPrice}€</Text>
                <View style={styles.modalDiscountBadge}>
                  <Text style={styles.modalDiscountText}>
                    -{Math.round(((deal.originalPrice - deal.currentPrice) / deal.originalPrice) * 100)}%
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.fullDescription}>{deal.description}</Text>
            
            <View style={styles.additionalInfo}>
              <Text style={styles.infoLabel}>Date de publication</Text>
              <Text style={styles.infoText}>
                {new Date(deal.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingTop: 8, // Espace pour la barre de swipe
  },
  dragHandle: {
    width: '100%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#DDD',
    borderRadius: 2,
  },
  dealFullContent: {
    padding: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalCurrentPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  modalOriginalPrice: {
    fontSize: 16,
    color: '#888',
    textDecorationLine: 'line-through',
  },
  modalDiscountBadge: {
    backgroundColor: '#FF0000',
    borderRadius: 4,
    padding: 4,
    marginLeft: 8,
  },
  modalDiscountText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  fullDescription: {
    fontSize: 16,
    marginBottom: 16,
  },
  additionalInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoText: {
    fontSize: 16,
  },
});

export default DealDetails; 