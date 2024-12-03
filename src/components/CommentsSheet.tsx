import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  Animated,
  PanResponder,
  Easing,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/api';

interface Author {
  _id: string;
  username: string;
  avatar?: string;
}

interface Reply {
  _id: string;
  content: string;
  author: Author;
  likes: number;
  createdAt: string;
}

interface Comment {
  _id: string;
  content: string;
  author: Author;
  likes: number;
  createdAt: string;
  replyCount: number;
  replies: Reply[];
}

interface CommentsSheetProps {
  isVisible: boolean;
  onClose: () => void;
  dealId: string;
  onCommentCountChange?: (count: number) => void;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;
const DISMISS_THRESHOLD = 100;
const SNAP_POINTS = {
  TOP: 0,
  BOTTOM: SCREEN_HEIGHT,
};
const MINIMUM_SCREEN_PADDING = 100;
const MAXIMUM_TRANSLATE_Y = -SCREEN_HEIGHT + MINIMUM_SCREEN_PADDING;

const CommentsSheet: React.FC<CommentsSheetProps> = ({
  isVisible,
  onClose,
  dealId,
  onCommentCountChange,
}) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [expandedCommentId, setExpandedCommentId] = useState<string | null>(null);

  const panY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) { // Glissement vers le bas uniquement
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) { // Si glissé vers le bas de plus de 100
          onClose();
        } else {
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Debug logs
  console.log('CommentsSheet Props:', { isVisible, dealId });
  console.log('Current Comments:', comments);

  useEffect(() => {
    if (isVisible && dealId) {
      console.log('Fetching comments for deal:', dealId);
      fetchComments();
    }
  }, [isVisible, dealId]);

  const fetchComments = async (pageNum = 1) => {
    try {
      setLoading(true);
      console.log('Fetching comments:', `/comments/deal/${dealId}?page=${pageNum}&limit=20`);
      
      const response = await api.get(`/comments/deal/${dealId}?page=${pageNum}&limit=20`);
      console.log('API Response:', response.data);
      
      if (response.data?.data?.comments) {
        const newComments = response.data.data.comments;
        setComments(prev => pageNum === 1 ? newComments : [...prev, ...newComments]);
        setHasMore(response.data.data.currentPage < response.data.data.pages);
        setPage(response.data.data.currentPage);
        
        if (response.data.data.total && onCommentCountChange) {
          onCommentCountChange(response.data.data.total);
        }
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await api.post(`/comments/deal/${dealId}`, {
        content: newComment.trim()
      });

      if (response.data?.status === 'success' && response.data?.data?.comment) {
        const newCommentData = response.data.data.comment;
        setComments(prev => [newCommentData, ...prev]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter le commentaire');
    }
  };

  const handleReply = async (commentId: string, content: string) => {
    if (!content.trim()) return;

    try {
      const response = await api.post(`/comments/${commentId}/replies`, {
        content: content.trim()
      });

      if (response.data?.success && response.data?.data?.reply) {
        // Mettre à jour le compteur de réponses du commentaire parent
        setComments(prev =>
          prev.map(comment =>
            comment._id === commentId
              ? { 
                  ...comment, 
                  replyCount: (comment.replyCount || 0) + 1,
                  replies: comment.replies 
                    ? [...comment.replies, response.data.data.reply]
                    : [response.data.data.reply]
                }
              : comment
          )
        );
        
        // Réinitialiser l'état de réponse
        setReplyingTo(null);
        setReplyText('');
      }
    } catch (error) {
      console.error('Error submitting reply:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter la réponse');
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      await api.post(`/comments/${commentId}/like`);
      setComments(prev =>
        prev.map(comment =>
          comment._id === commentId
            ? { ...comment, likes: comment.likes + 1 }
            : comment
        )
      );
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const handleEditComment = async (commentId: string, content: string) => {
    try {
      const response = await api.patch(`/comments/${commentId}`, { content });
      if (response.data?.status === 'success') {
        setComments(prev =>
          prev.map(comment =>
            comment._id === commentId
              ? { ...comment, content }
              : comment
          )
        );
      }
    } catch (error) {
      console.error('Error editing comment:', error);
      Alert.alert('Erreur', 'Impossible de modifier le commentaire');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await api.delete(`/comments/${commentId}`);
      setComments(prev => prev.filter(comment => comment._id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
      Alert.alert('Erreur', 'Impossible de supprimer le commentaire');
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchComments(page + 1);
    }
  };

  const fetchReplies = async (commentId: string) => {
    try {
      const response = await api.get(`/comments/${commentId}/replies`);
      if (response.data?.data?.replies) {
        setComments(prev =>
          prev.map(comment =>
            comment._id === commentId
              ? { ...comment, replies: response.data.data.replies }
              : comment
          )
        );
      }
    } catch (error) {
      console.error('Erreur lors du chargement des réponses:', error);
    }
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [{
                translateY: panY.interpolate({
                  inputRange: [0, SCREEN_HEIGHT],
                  outputRange: [0, SCREEN_HEIGHT],
                  extrapolate: 'clamp',
                })
              }]
            }
          ]}
        >
          <View {...panResponder.panHandlers}>
            <View style={styles.header}>
              <View style={styles.handle} />
              <Text style={styles.title}>{comments.length} commentaires </Text>
            </View>
          </View>

          <FlatList
            data={comments}
            renderItem={({ item: comment }) => (
              <View style={styles.commentItem}>
                <View style={styles.commentHeader}>
                  <Text style={styles.username}>{comment.author.username}</Text>
                  <Text style={styles.date}>
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.content}>{comment.content}</Text>
                <View style={styles.commentFooter}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleLikeComment(comment._id)}
                  >
                    <Text>❤️ {comment.likes}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => {
                      setReplyingTo(comment._id);
                      setReplyText('');
                    }}
                  >
                    <Text>💬 Répondre</Text>
                  </TouchableOpacity>

                  {comment.replyCount > 0 && (
                    <TouchableOpacity
                      onPress={() => {
                        if (expandedCommentId === comment._id) {
                          setExpandedCommentId(null);
                        } else {
                          setExpandedCommentId(comment._id);
                          fetchReplies(comment._id);
                        }
                      }}
                    >
                      <Text style={styles.replyCount}>
                        {comment.replyCount} réponses {expandedCommentId === comment._id ? '▼' : '▶'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Zone de réponse */}
                {replyingTo === comment._id && (
                  <View style={styles.replyContainer}>
                    <TextInput
                      style={styles.replyInput}
                      placeholder="Écrire une réponse..."
                      value={replyText}
                      onChangeText={setReplyText}
                      multiline
                    />
                    <View style={styles.replyActions}>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => setReplyingTo(null)}
                      >
                        <Text style={styles.cancelButtonText}>Annuler</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.replyButton,
                          !replyText.trim() && styles.replyButtonDisabled
                        ]}
                        onPress={() => handleReply(comment._id, replyText)}
                        disabled={!replyText.trim()}
                      >
                        <Text style={styles.replyButtonText}>Répondre</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Affichage des réponses */}
                {expandedCommentId === comment._id && (
                  <View style={styles.repliesList}>
                    {comment.replies?.map((reply) => (
                      <View key={reply._id} style={styles.replyItem}>
                        <View style={styles.replyHeader}>
                          <Text style={styles.replyUsername}>{reply.author.username}</Text>
                          <Text style={styles.replyDate}>
                            {new Date(reply.createdAt).toLocaleDateString()}
                          </Text>
                        </View>
                        <Text style={styles.replyContent}>{reply.content}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.commentsList}
            ListEmptyComponent={
              loading ? (
                <ActivityIndicator size="large" color="#5CEAD4" />
              ) : (
                <Text style={styles.emptyText}>Aucun commentaire</Text>
              )
            }
          />

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          >
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Ajouter un commentaire..."
                value={newComment}
                onChangeText={setNewComment}
                multiline
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !newComment.trim() && styles.sendButtonDisabled
                ]}
                onPress={handleSubmitComment}
                disabled={!newComment.trim()}
              >
                <Text style={styles.sendButtonText}>Envoyer</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const CommentItem: React.FC<{
  comment: Comment;
  onReply: (commentId: string, content: string) => Promise<void>;
  onLike: (commentId: string) => Promise<void>;
  onEdit: (commentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
}> = ({ comment, onReply, onLike, onEdit, onDelete }) => {
  const [showReplies, setShowReplies] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replies, setReplies] = useState<Reply[]>([]);
  const { user } = useAuth();

  const handleReplySubmit = async () => {
    if (!replyText.trim()) return;

    try {
      await onReply(comment._id, replyText.trim());
      setReplyText('');
      setIsReplying(false);
      // Recharger les réponses si elles sont affichées
      if (showReplies) {
        await fetchReplies();
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la réponse:', error);
    }
  };

  const fetchReplies = async () => {
    try {
      const response = await api.get(`/comments/${comment._id}/replies`);
      if (response.data?.data?.replies) {
        setReplies(response.data.data.replies);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des réponses:', error);
    }
  };

  return (
    <View style={styles.commentContainer}>
      {/* Commentaire principal */}
      <View style={styles.commentHeader}>
        <Image
          source={{ uri: comment.author.avatar || 'https://via.placeholder.com/36' }}
          style={styles.avatar}
        />
        <Text style={styles.username}>{comment.author.username}</Text>
        <Text style={styles.date}>{comment.createdAt}</Text>
      </View>
      
      <Text style={styles.commentText}>{comment.content}</Text>
      
      <View style={styles.commentFooter}>
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setIsReplying(!isReplying)}
          >
            <Text style={styles.actionButtonText}>Répondre</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => onLike(comment._id)}
          >
            <Text style={styles.likesCount}>{comment.likes} likes</Text>
          </TouchableOpacity>
        </View>

        {user?._id === comment.author._id && (
          <View style={styles.authorActions}>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => onEdit(comment._id, comment.content)}
            >
              <Text style={styles.editButtonText}>Modifier</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => onDelete(comment._id)}
            >
              <Text style={styles.deleteButtonText}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Section réponse */}
      {isReplying && (
        <View style={styles.replyInputContainer}>
          <TextInput
            style={styles.replyInput}
            value={replyText}
            onChangeText={setReplyText}
            placeholder="Écrire une réponse..."
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, !replyText.trim() && styles.sendButtonDisabled]}
            onPress={handleReplySubmit}
            disabled={!replyText.trim()}
          >
            <Text style={styles.sendButtonText}>Envoyer</Text>
          </TouchableOpacity>
        </View>
      )}

      {comment.replyCount > 0 && (
        <TouchableOpacity
          style={styles.showRepliesButton}
          onPress={() => {
            setShowReplies(!showReplies);
            if (!showReplies && comment.replyCount > 0) {
              fetchReplies();
            }
          }}
        >
          <Text style={styles.showRepliesText}>
            {showReplies ? 'Masquer les réponses' : `Voir les réponses (${comment.replyCount})`}
          </Text>
        </TouchableOpacity>
      )}

      {showReplies && replies.map((reply) => (
        <View key={reply._id} style={styles.replyItem}>
          <View style={styles.replyHeader}>
            <Image
              source={{ uri: reply.author.avatar || 'default_avatar_url' }}
              style={styles.replyAvatar}
            />
            <Text style={styles.replyUsername}>{reply.author.username}</Text>
            <Text style={styles.replyDate}>
              {new Date(reply.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <Text style={styles.replyText}>{reply.content}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    marginTop: 'auto',
  },
  header: {
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  commentsList: {
    padding: 16,
  },
  commentItem: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  username: {
    fontWeight: '600',
  },
  date: {
    color: '#666',
    fontSize: 12,
  },
  content: {
    fontSize: 14,
    lineHeight: 20,
  },
  commentFooter: {
    flexDirection: 'row',
    marginTop: 8,
    alignItems: 'center',
  },
  actionButton: {
    marginRight: 16,
  },
  replyCount: {
    color: '#666',
    fontSize: 12,
  },
  inputContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: 'white',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
    minHeight: 40,
  },
  sendButton: {
    backgroundColor: '#5CEAD4',
    padding: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  sendButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  replyContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  replyInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 40,
  },
  replyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 8,
  },
  cancelButton: {
    padding: 8,
    borderRadius: 16,
  },
  cancelButtonText: {
    color: '#666',
  },
  replyButton: {
    backgroundColor: '#5CEAD4',
    padding: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  replyButtonDisabled: {
    backgroundColor: '#ccc',
  },
  replyButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  repliesList: {
    marginTop: 8,
    paddingLeft: 16,
  },
  replyItem: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  replyUsername: {
    fontWeight: '500',
    fontSize: 13,
  },
  replyDate: {
    color: '#666',
    fontSize: 11,
  },
  replyContent: {
    fontSize: 13,
  },
});

export default CommentsSheet; 