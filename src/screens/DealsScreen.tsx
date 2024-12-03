import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Image,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  Modal,
  Linking,
  RefreshControl,
} from 'react-native';
import api from '../config/api';
import CommentsSheet from '../components/CommentsSheet';
import DealDetails from '../components/DealDetails';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 0.25 * SCREEN_WIDTH;
const SWIPE_OUT_DURATION = 250;
const SCREEN_HEIGHT = Dimensions.get('window').height;

interface Comment {
  _id: string;
  content: string;
  replyCount: number;
  // ... autres propriétés
}

interface Deal {
  _id: string;
  title: string;
  currentPrice: number;
  originalPrice: number;
  description: string;
  images: string[];
  temperature: number;
  comments: Comment[];
  link: string;
}

const DealsScreen = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCommentsVisible, setIsCommentsVisible] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [showDetailsDeal, setShowDetailsDeal] = useState<Deal | null>(null);
  const [commentCounts, setCommentCounts] = useState<{ [key: string]: number }>({});
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const position = useRef(new Animated.ValueXY()).current;
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: 0, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 100) {
          swipeDown();
        } else if (gesture.dy < -100) {
          swipeUp();
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const swipeUp = () => {
    if (currentIndex >= deals.length - 1) return;
    
    Animated.timing(position, {
      toValue: { x: 0, y: -SCREEN_HEIGHT },
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      position.setValue({ x: 0, y: 0 });
      setCurrentIndex(currentIndex + 1);
    });
  };

  const swipeDown = () => {
    if (currentIndex <= 0) return;
    
    Animated.timing(position, {
      toValue: { x: 0, y: SCREEN_HEIGHT },
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      position.setValue({ x: 0, y: 0 });
      setCurrentIndex(currentIndex - 1);
    });
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const fetchDeals = async () => {
    try {
      const response = await api.get('/deals');
      console.log('Deals API Response:', response.data.data.deals);
      setDeals(response.data.data.deals);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching deals:', err);
      setError("Erreur lors du chargement des deals");
      setLoading(false);
    }
  };

  const handleVote = async (dealId: string, type: 'up' | 'down') => {
    try {
      await api.post(`${API_URL}/${dealId}/vote`, { type });
      // Optionnel: Mettre à jour l'état local du deal
      const updatedDeals = deals.map(deal => {
        if (deal._id === dealId) {
          return {
            ...deal,
            temperature: deal.temperature + (type === 'up' ? 1 : -1)
          };
        }
        return deal;
      });
      setDeals(updatedDeals);
    } catch (err) {
      console.error('Erreur lors du vote:', err);
    }
  };

  const handleCommentsPress = async (deal: Deal) => {
    try {
      console.log('Fetching comments count for deal:', deal._id);
      const response = await api.get(`/comments/deal/${deal._id}?page=1&limit=20`);
      console.log('Comments response:', response.data);
      
      if (response.data?.data?.total) {
        setCommentCounts(prev => ({
          ...prev,
          [deal._id]: response.data.data.total
        }));
      }
    } catch (error) {
      console.error('Error fetching comment count:', error);
      // Gérer l'erreur silencieusement pour ne pas bloquer l'UI
    }
    setSelectedDealId(deal._id);
    setIsCommentsVisible(true);
  };

  const getImageUrl = (images: string[]) => {
    if (!images || images.length === 0) {
      return 'https://via.placeholder.com/400x300?text=No+Image';
    }
    
    const imageUrl = images[0];
    if (imageUrl.startsWith('/')) {
      return `http://votre-api-url${imageUrl}`;
    }
    return imageUrl;
  };

  const renderDealCard = ({ item: deal }: { item: Deal }) => {
    if (!deal) return null;

    const discount = deal.originalPrice && deal.currentPrice
      ? Math.round(((deal.originalPrice - deal.currentPrice) / deal.originalPrice) * 100)
      : 0;
  
    return (
      <View style={styles.cardContainer}>
        <TouchableOpacity 
          style={styles.card}
          onPress={() => setShowDetailsDeal(deal)}
        >
          {/* Image */}
          {deal.images && deal.images[0] && (
            <Image
              source={{ uri: deal.images[0] }}
              style={styles.dealImage}
              resizeMode="cover"
            />
          )}

          {/* Content */}
          <View style={styles.contentContainer}>
            <Text style={styles.title} numberOfLines={2}>
              {deal.title || 'Sans titre'}
            </Text>
            
            <View style={styles.priceContainer}>
              <Text style={styles.currentPrice}>
                {deal.currentPrice ? `${deal.currentPrice.toFixed(2)}€` : '0€'}
              </Text>
              <Text style={styles.originalPrice}>
                {deal.originalPrice ? `${deal.originalPrice.toFixed(2)}€` : '0€'}
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleVote(deal._id, 'up')}
              >
                <View style={styles.iconButton}>
                  <Text style={styles.voteEmoji}>🔥</Text>
                </View>
                <Text style={styles.actionText}>{deal.temperature || 0}°</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleCommentsPress(deal)}
              >
                <View style={styles.iconButton}>
                  <Text style={styles.voteEmoji}>💬</Text>
                </View>
                <Text style={styles.actionText}>
                  {commentCounts[deal._id] || 0}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderProgressIndicator = () => (
    <View style={styles.progressContainer}>
      {deals.map((_, index) => (
        <View
          key={index}
          style={[
            styles.progressDot,
            index === currentIndex && styles.progressDotActive
          ]}
        />
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Deals</Text>
        {renderProgressIndicator()}
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5CEAD4" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={deals}
          renderItem={renderDealCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={fetchDeals}
              colors={['#5CEAD4']}
            />
          }
        />
      )}

      <DealDetails 
        isVisible={!!showDetailsDeal}
        onClose={() => setShowDetailsDeal(null)}
        deal={showDetailsDeal}
      />

      {selectedDealId && (
        <CommentsSheet
          isVisible={isCommentsVisible}
          onClose={() => {
            setIsCommentsVisible(false);
            setSelectedDealId(null);
          }}
          dealId={selectedDealId || ''}
          onCommentCountChange={(count) => {
            if (selectedDealId) {
              setCommentCounts(prev => ({
                ...prev,
                [selectedDealId]: count
              }));
            }
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  cardContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  card: {
    overflow: 'hidden',
    borderRadius: 12,
  },
  dealImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  currentPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5CEAD4',
  },
  originalPrice: {
    fontSize: 16,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  voteEmoji: {
    fontSize: 16,
  },
  actionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 8,
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
  },
  progressDotActive: {
    backgroundColor: '#5CEAD4',
    width: 16,
  },
  swipeIndicator: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    opacity: 0.7,
  },
  swipeText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
  listContainer: {
    paddingVertical: 8,
  },
});

export default DealsScreen;

