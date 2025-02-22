import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Image,
  RefreshControl,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { useLastFm } from '../../hooks/useLastFm';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, Layout, BounceIn } from 'react-native-reanimated';
import { UserTrack } from '../../types/lastfm';
import { useFonts } from 'expo-font';

const PlayingStatus = ({ isNowPlaying, timestamp }: { isNowPlaying: boolean; timestamp?: string }) => (
  <View style={styles.playingStatusContainer}>
    <Animated.View entering={BounceIn}>
      <Ionicons 
        name={isNowPlaying ? "musical-notes" : "time-outline"} 
        size={14} 
        color={isNowPlaying ? "#FF69B4" : "#9370DB"} 
      />
    </Animated.View>
    <Text style={[styles.playingStatus, isNowPlaying && styles.nowPlayingStatus]}>
      {isNowPlaying ? 'Now Playing' : timestamp}
    </Text>
  </View>
);

const SectionHeader = ({ title }: { title: string }) => (
  <Text style={styles.sectionHeader}>{title}</Text>
);

export default function HomeScreen() {
  const [fontsLoaded] = useFonts({
    'Pacifico': require('../../assets/fonts/Pacifico-Regular.ttf'),
  });

  const [newUsername, setNewUsername] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const { usernames, userTracks, loading, addUsername, removeUsername, refreshTracks } = useLastFm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddUsername = async () => {
    const username = newUsername.trim();
    if (!username) {
      Alert.alert('Error', 'Please enter a Last.fm username');
      return;
    }

    if (usernames.includes(username)) {
      Alert.alert('Error', 'This username is already being tracked');
      return;
    }

    setIsSubmitting(true);
    await addUsername(username);
    setIsSubmitting(false);
    setNewUsername('');
  };

  const handleRemoveUsername = (username: string) => {
    Alert.alert(
      'Remove User',
      `Are you sure you want to stop tracking ${username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          onPress: () => removeUsername(username),
          style: 'destructive'
        },
      ]
    );
  };

  const sortedTracks = React.useMemo(() => {
    const nowPlaying: UserTrack[] = [];
    const lastPlayed: UserTrack[] = [];

    userTracks.forEach(track => {
      if (!track.error && track.currentTrack) {
        if (track.currentTrack.isNowPlaying) {
          nowPlaying.push(track);
        } else {
          lastPlayed.push(track);
        }
      }
    });

    const sortByUsername = (a: UserTrack, b: UserTrack) => 
      a.username.toLowerCase().localeCompare(b.username.toLowerCase());

    return {
      nowPlaying: nowPlaying.sort(sortByUsername),
      lastPlayed: lastPlayed.sort(sortByUsername)
    };
  }, [userTracks]);

  const renderTrackCard = (userTrack: UserTrack) => (
    <Animated.View 
      key={userTrack.username}
      style={[
        styles.trackCard,
        userTrack.currentTrack?.isNowPlaying && { backgroundColor: '#FFF0F5' }
      ]}
      entering={FadeIn}
      exiting={FadeOut}
      layout={Layout}
    >
      <View style={styles.trackHeader}>
        <View style={styles.usernameContainer}>
          <Animated.View entering={BounceIn}>
            <Ionicons name="headset" size={24} color="#9370DB" />
          </Animated.View>
          <Text style={styles.username}>{userTrack.username}</Text>
        </View>
        <TouchableOpacity
          onPress={() => handleRemoveUsername(userTrack.username)}
          style={styles.removeButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close-circle" size={24} color="#FFB6C1" />
        </TouchableOpacity>
      </View>

      {userTrack.error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="heart-dislike" size={20} color="#FF69B4" />
          <Text style={styles.errorText}>{userTrack.error}</Text>
        </View>
      ) : userTrack.currentTrack ? (
        <View style={styles.trackInfo}>
          {userTrack.currentTrack.image ? (
            <Animated.Image
              entering={BounceIn}
              source={{ uri: userTrack.currentTrack.image }}
              style={styles.albumArt}
            />
          ) : (
            <View style={[styles.albumArt, styles.placeholderAlbumArt]}>
              <Ionicons name="musical-notes" size={32} color="#DDA0DD" />
            </View>
          )}
          <View style={styles.trackDetails}>
            <Text style={styles.trackTitle} numberOfLines={2}>
              {userTrack.currentTrack.title}
            </Text>
            <Text style={styles.artistName} numberOfLines={1}>
              {userTrack.currentTrack.artist}
            </Text>
            {userTrack.currentTrack.album && (
              <Text style={styles.albumName} numberOfLines={1}>
                {userTrack.currentTrack.album}
              </Text>
            )}
            <PlayingStatus 
              isNowPlaying={userTrack.currentTrack.isNowPlaying}
              timestamp={userTrack.currentTrack.timestamp}
            />
          </View>
        </View>
      ) : (
        <View style={styles.noTrackContainer}>
          <Ionicons name="musical-note" size={24} color="#DDA0DD" />
          <Text style={styles.noTrackText}>No music playing yet</Text>
        </View>
      )}
    </Animated.View>
  );

  const renderTrackList = () => {
    if (userTracks.length === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="heart-outline" size={48} color="#FFB6C1" />
          <Text style={styles.emptyText}>
            Add your music friends to start tracking their tunes!
          </Text>
        </View>
      );
    }

    return (
      <View>
        {sortedTracks.nowPlaying.length > 0 && (
          <View>
            <SectionHeader title="Now Playing" />
            {sortedTracks.nowPlaying.map(renderTrackCard)}
          </View>
        )}

        {sortedTracks.lastPlayed.length > 0 && (
          <View>
            <SectionHeader title="Last Played" />
            {sortedTracks.lastPlayed.map(renderTrackCard)}
          </View>
        )}
      </View>
    );
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FF69B4" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Music Tracker</Text>
        <Text style={styles.subtitle}>
          See what tunes your friends are vibing to
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <View style={[
          styles.inputWrapper,
          inputFocused && styles.inputWrapperFocused
        ]}>
          <Ionicons name="search" size={20} color="#9370DB" style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            value={newUsername}
            onChangeText={setNewUsername}
            placeholder="Add a Last.fm friend"
            placeholderTextColor="#B19CD9"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="go"
            onSubmitEditing={handleAddUsername}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
          />
        </View>
        <TouchableOpacity 
          style={[
            styles.addButton,
            (!newUsername.trim() || isSubmitting) && styles.addButtonDisabled
          ]} 
          onPress={handleAddUsername}
          disabled={!newUsername.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Ionicons name="heart" size={24} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.trackList}
        contentContainerStyle={styles.trackListContent}
        refreshControl={
          <RefreshControl 
            refreshing={loading} 
            onRefresh={refreshTracks}
            tintColor="#FF69B4"
          />
        }
      >
        {renderTrackList()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    padding: 16,
    paddingTop: 24,
    backgroundColor: '#FFF0F5',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE4E1',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF69B4',
    marginBottom: 4,
    textAlign: 'center',
    fontFamily: 'Pacifico',
  },
  subtitle: {
    fontSize: 14,
    color: '#9370DB',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE4E1',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F0FF',
    borderRadius: 20,
    marginRight: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E6E6FA',
    transform: [{ scale: 1 }]
  },
  inputWrapperFocused: {
    borderColor: '#FF69B4',
    backgroundColor: '#FFF',
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#9370DB',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  addButton: {
    width: 48,
    height: 48,
    backgroundColor: '#FF69B4',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonDisabled: {
    backgroundColor: '#FFB6C1',
  },
  trackList: {
    flex: 1,
  },
  trackListContent: {
    padding: 16,
    paddingTop: 8,
  },
  trackCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#DDA0DD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE4E1',
  },
  trackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9370DB',
    marginLeft: 8,
  },
  removeButton: {
    padding: 4,
  },
  trackInfo: {
    flexDirection: 'row',
  },
  albumArt: {
    width: 80,
    height: 80,
    borderRadius: 16,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  placeholderAlbumArt: {
    backgroundColor: '#F8F0FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E6E6FA',
  },
  trackDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF69B4',
    marginBottom: 4,
  },
  artistName: {
    fontSize: 14,
    color: '#9370DB',
    marginBottom: 2,
  },
  albumName: {
    fontSize: 14,
    color: '#DDA0DD',
    marginBottom: 8,
  },
  playingStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  playingStatus: {
    fontSize: 12,
    color: '#9370DB',
    marginLeft: 4,
  },
  nowPlayingStatus: {
    color: '#FF69B4',
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F5',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFE4E1',
  },
  errorText: {
    color: '#FF69B4',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  noTrackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#F8F0FF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E6E6FA',
  },
  noTrackText: {
    color: '#9370DB',
    fontSize: 14,
    marginLeft: 8,
    fontStyle: 'italic',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9370DB',
    fontSize: 16,
    marginTop: 16,
    lineHeight: 24,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9370DB',
    marginBottom: 12,
    marginTop: 8,
    paddingHorizontal: 4,
  },
});
