import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
  Platform
} from 'react-native';
import api from '../config/api';
import * as ImagePicker from 'react-native-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { API_URL } from '../config/api';

const SCREEN_WIDTH = Dimensions.get('window').width;

const CATEGORIES = [
  { id: 'tech', icon: '📱', label: 'High-Tech' },
  { id: 'mode', icon: '👕', label: 'Mode' },
  { id: 'maison', icon: '🏠', label: 'Maison' },
  { id: 'gaming', icon: '🎮', label: 'Gaming' },
  { id: 'food', icon: '🍔', label: 'Alimentation' },
  { id: 'travel', icon: '✈️', label: 'Voyage' },
];

const PostDealScreen = () => {
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [description, setDescription] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    currentPrice: '',
    originalPrice: '',
    link: '',
    category: '',
    promoCode: '',
    expiresAt: new Date(),
  });

  const richText = useRef<RichEditor>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibrary({
      mediaType: 'photo',
      quality: 1,
      selectionLimit: 3,
    });

    if (!result.didCancel && result.assets) {
      const imageUris = result.assets.map(asset => asset.uri || '');
      setImages(imageUris);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({ ...prev, expiresAt: selectedDate }));
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Validation basique
      if (!formData.title || !formData.description || !formData.currentPrice || 
          !formData.originalPrice || !formData.link || !formData.category) {
        Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
        return;
      }

      const dealData = new FormData();

      // Ajout des images
      images.forEach((image, index) => {
        dealData.append('images', {
          uri: image,
          type: 'image/jpeg',
          name: `image${index}.jpg`,
        });
      });

      // Conversion des prix en nombres
      const currentPrice = parseFloat(formData.currentPrice);
      const originalPrice = parseFloat(formData.originalPrice);

      // Création de l'objet de données
      const dealInfo = {
        title: formData.title,
        description: formData.description,
        currentPrice: currentPrice,
        originalPrice: originalPrice,
        link: formData.link,
        category: formData.category,
        promoCode: formData.promoCode || undefined,
        expiresAt: formData.expiresAt?.toISOString() || undefined,
      };

      // Ajout des données au FormData
      Object.entries(dealInfo).forEach(([key, value]) => {
        if (value !== undefined) {
          if (typeof value === 'number') {
            dealData.append(key, value.toString());
          } else {
            dealData.append(key, value);
          }
        }
      });

      console.log('Envoi des données...', dealInfo); // Pour debug

      const response = await api.post('/deals', dealData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        transformRequest: (data) => data, // Empêche Axios de transformer le FormData
      });

      console.log('Réponse du serveur:', response.data);

      Alert.alert(
        'Succès',
        'Votre deal a été publié avec succès !',
        [
          {
            text: 'OK',
            onPress: () => {
              // Réinitialiser le formulaire
              setFormData({
                title: '',
                description: '',
                currentPrice: '',
                originalPrice: '',
                link: '',
                category: '',
                promoCode: '',
                expiresAt: new Date(),
              });
              setImages([]);
              navigation.navigate('Deals');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Erreur lors de la soumission:', error.response?.data || error);
      Alert.alert(
        'Erreur',
        error.response?.data?.message || 'Une erreur est survenue lors de la publication du deal'
      );
    } finally {
      setLoading(false);
    }
  };

  const insertFormat = (tag: string) => {
    // Insérer des marqueurs de formatage simples
    switch(tag) {
      case 'bold':
        setDescription(description + '**texte en gras**');
        break;
      case 'italic':
        setDescription(description + '_texte en italique_');
        break;
      case 'list':
        setDescription(description + '\n• ');
        break;
      case 'link':
        setDescription(description + '[texte du lien](url)');
        break;
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      keyboardDismissMode="interactive"
    >
      <View style={styles.header}>
        <Text style={styles.title}>Nouveau Deal</Text>
        <Text style={styles.subtitle}>Partagez une bonne affaire avec la communauté</Text>
      </View>
      
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Informations principales</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Titre du deal*</Text>
          <View style={styles.inputWrapper}>
            <Icon name="tag-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Ex: iPhone 15 Pro à -20%"
              value={formData.title}
              onChangeText={(text) => setFormData({...formData, title: text})}
              placeholderTextColor="#999"
            />
          </View>
        </View>

        <View style={styles.priceContainer}>
          <View style={styles.priceInput}>
            <Text style={styles.label}>Prix actuel*</Text>
            <View style={styles.inputWrapper}>
              <Icon name="currency-eur" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={formData.currentPrice}
                onChangeText={(text) => setFormData({...formData, currentPrice: text})}
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.priceInput}>
            <Text style={styles.label}>Prix original*</Text>
            <View style={styles.inputWrapper}>
              <Icon name="currency-eur" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={formData.originalPrice}
                onChangeText={(text) => setFormData({...formData, originalPrice: text})}
                placeholderTextColor="#999"
              />
            </View>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Images du produit</Text>
          <View style={styles.imageContainer}>
            {images.map((uri, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri }} style={styles.imagePreview} />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={() => setImages(images.filter((_, i) => i !== index))}
                >
                  <Icon name="close-circle" size={24} color="#FF4D4D" />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 3 && (
              <TouchableOpacity 
                style={styles.addImageButton}
                onPress={pickImage}
              >
                <Icon name="camera-plus" size={32} color="#666" />
                <Text style={styles.addImageText}>Ajouter</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.fieldLabel}>Catégorie*</Text>
          <View style={styles.categoriesWrapper}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesContainer}
            >
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryChip,
                    selectedCategory === category.id && styles.categoryChipSelected
                  ]}
                  onPress={() => {
                    setSelectedCategory(category.id);
                    setFormData({...formData, category: category.id});
                  }}
                >
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text style={[
                    styles.categoryLabel,
                    selectedCategory === category.id && styles.categoryLabelSelected
                  ]}>
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Lien de l'offre*</Text>
          <View style={styles.inputWrapper}>
            <Icon name="link" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="https://..."
              value={formData.link}
              onChangeText={(text) => setFormData({...formData, link: text})}
              autoCapitalize="none"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Code promo</Text>
          <View style={styles.inputWrapper}>
            <Icon name="ticket-percent" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Ex: PROMO20"
              value={formData.promoCode}
              onChangeText={(text) => setFormData({...formData, promoCode: text})}
              autoCapitalize="characters"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.fieldLabel}>Description détaillée*</Text>
          <View style={styles.editorContainer}>
            <TextInput
              style={styles.editor}
              multiline
              numberOfLines={8}
              placeholder="Décrivez votre deal en détail..."
              value={formData.description}
              onChangeText={(text) => setFormData({...formData, description: text})}
              textAlignVertical="top"
            />
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>  
              <Icon name="check-circle" size={24} color="#fff" />
              <Text style={styles.submitButtonText}>Publier le deal</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.testButton}
          onPress={async () => {
            try {
              const response = await api.get('/deals');
              console.log('Deals récupérés:', response.data);
              Alert.alert('Deals', `Nombre de deals: ${response.data.results}`);
            } catch (error) {
              console.error('Erreur lors de la récupération des deals:', error);
            }
          }}
        >
          <Text style={styles.testButtonText}>Voir tous les deals</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  formSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  priceContainer: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
  },
  priceInput: {
    flex: 1,
  },
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageWrapper: {
    position: 'relative',
  },
  imagePreview: {
    width: (SCREEN_WIDTH - 60) / 3,
    height: (SCREEN_WIDTH - 60) / 3,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  addImageButton: {
    width: (SCREEN_WIDTH - 60) / 3,
    height: (SCREEN_WIDTH - 60) / 3,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  addImageText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  fieldLabel: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 12,
  },
  categoriesWrapper: {
    marginBottom: 20,
  },
  categoriesContainer: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryChipSelected: {
    backgroundColor: '#F3F4F6',
    borderColor: '#9CA3AF',
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  categoryLabel: {
    fontSize: 14,
    color: '#4B5563',
  },
  categoryLabelSelected: {
    color: '#111827',
    fontWeight: '500',
  },
  editorContainer: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
  },
  editor: {
    minHeight: 200,
    padding: 12,
    fontSize: 16,
    color: '#333',
    textAlignVertical: 'top',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5CEAD4',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  testButton: {
    backgroundColor: '#4B5563',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  testButtonText: {
    color: 'white',
    textAlign: 'center',
  },
});

export default PostDealScreen;
