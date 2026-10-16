import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useThemeColors } from '@/services/theme';
import { api } from '@/services/api';

export const ChatListScreen = ({ navigation }: any) => {
  const { colors } = useThemeColors();
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await api.get('/chat/rooms');
      setRooms(res.data.data);
    } catch (err) {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRooms();
  }, []);

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
              onPress={() => navigation.navigate('ChatRoom', { roomId: room.id, topic: room.topic })}
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
