import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useThemeColors } from '@/services/theme';
import { api } from '@/services/api';
import type { RootStackScreenProps } from '@/navigation/types';
import type { ChatRoomDto } from '@/types';

export const ChatListScreen = ({ navigation }: RootStackScreenProps<'ChatList'>) => {
  const { colors } = useThemeColors();
  const [rooms, setRooms] = useState<ChatRoomDto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<{ data: ChatRoomDto[] }>('/chat/rooms');
      setRooms(res.data.data);
    } catch (_err) {
      // Handled by the global error interceptor / empty-state UI.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRooms();
  }, [fetchRooms]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.cream, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.charcoal, marginBottom: 16 }}>
        Μηνύματα & Συνομιλίες
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color={colors.terracotta} />
      ) : rooms.length === 0 ? (
        <View style={{ backgroundColor: colors.white, padding: 20, borderRadius: 16, alignItems: 'center' }}>
          <Text style={{ color: colors.charcoalSoft }}>Δεν έχετε ενεργές συνομιλίες.</Text>
        </View>
      ) : (
        rooms.map((room) => {
          const lastMsg = room.messages?.[0];
          return (
            <TouchableOpacity
              key={room.id}
              onPress={() => navigation.navigate('ChatRoom', { roomId: room.id, topic: room.topic ?? undefined })}
              style={{
                backgroundColor: colors.white,
                padding: 14,
                borderRadius: 12,
                marginBottom: 10,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.charcoal }}>
                {room.topic || 'Συνομιλία'}
              </Text>
              <Text style={{ color: colors.charcoalSoft, marginTop: 4 }} numberOfLines={1}>
                {lastMsg ? lastMsg.text : 'Ξεκινήστε τη συζήτηση...'}
              </Text>
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
};
