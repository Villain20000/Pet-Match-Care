import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useThemeColors } from '@/services/theme';
import { api } from '@/services/api';
import { toast } from '@/services/toast';
import type { CommunityPostDto } from '@/types';

export const CommunityForumScreen = () => {
  const { colors } = useThemeColors();
  const [posts, setPosts] = useState<CommunityPostDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<{ data: CommunityPostDto[] }>('/community/posts');
      setPosts(res.data.data);
    } catch (_err) {
      // Handled by the global error interceptor / empty-state UI.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPosts();
  }, [fetchPosts]);

  const handleCreatePost = async () => {
    if (!title || !body) {
      toast.error({ title: 'Σφάλμα', body: 'Παρακαλώ συμπληρώστε τίτλο και κείμενο' });
      return;
    }
    try {
      await api.post('/community/posts', { title, body });
      toast.success({ title: 'Επιτυχία', body: 'Η δημοσίευση κοινοποιήθηκε' });
      setTitle('');
      setBody('');
      void fetchPosts();
    } catch (_err) {
      // Handled by the global error interceptor / toast caller.
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.cream, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.charcoal, marginBottom: 4 }}>
        Κοινοτικό Forum & Q&A
      </Text>

      <View style={{ backgroundColor: colors.white, padding: 16, borderRadius: 16, marginBottom: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.charcoal, marginBottom: 8 }}>
          Νέα Συζήτηση
        </Text>
        <TextInput
          placeholder="Τίτλος θέματος"
          value={title}
          onChangeText={setTitle}
          style={{ backgroundColor: colors.creamSoft, padding: 12, borderRadius: 8, marginBottom: 8 }}
        />
        <TextInput
          placeholder="Περιγράψτε την ερώτηση ή την ιστορία σας..."
          value={body}
          onChangeText={setBody}
          multiline
          style={{ backgroundColor: colors.creamSoft, padding: 12, borderRadius: 8, marginBottom: 12, height: 70 }}
        />
        <TouchableOpacity
          onPress={handleCreatePost}
          style={{ backgroundColor: colors.terracotta, padding: 12, borderRadius: 10, alignItems: 'center' }}
        >
          <Text style={{ color: colors.white, fontWeight: 'bold' }}>Δημοσίευση</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.terracotta} />
      ) : (
        posts.map((post) => (
          <View key={post.id} style={{ backgroundColor: colors.white, padding: 14, borderRadius: 12, marginBottom: 10 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.charcoal }}>{post.title}</Text>
            <Text style={{ color: colors.charcoalSoft, marginTop: 4 }}>{post.body}</Text>
            <Text style={{ fontSize: 12, color: colors.terracotta, marginTop: 6 }}>
              Από: {post.author?.fullName || 'Χρήστης'} • 👍 {post.upvotes}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
};
