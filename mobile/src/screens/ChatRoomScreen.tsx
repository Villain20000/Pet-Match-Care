import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useThemeColors } from '@/services/theme';
import { api } from '@/services/api';
import type { RootStackScreenProps } from '@/navigation/types';
import type { ChatMessageDto } from '@/types';

export const ChatRoomScreen = ({ route }: RootStackScreenProps<'ChatRoom'>) => {
  const { colors } = useThemeColors();
  const roomId = route?.params?.roomId;
  const topic = route?.params?.topic || 'Συνομιλία';

  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');

  const fetchMessages = useCallback(async () => {
    if (!roomId) return;
    try {
      setLoading(true);
      const res = await api.get<{ data: ChatMessageDto[] }>(`/chat/rooms/${roomId}/messages`);
      setMessages(res.data.data);
    } catch (_err) {
      // Handled by the global error interceptor / empty-state UI.
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    void fetchMessages();
  }, [fetchMessages]);

  const handleSend = async () => {
    if (!text.trim() || !roomId) return;
    try {
      const res = await api.post<{ data: ChatMessageDto }>(`/chat/rooms/${roomId}/messages`, { text });
      setMessages((prev) => [...prev, res.data.data]);
      setText('');
    } catch (_err) {
      // Handled by the global error interceptor / empty-state UI.
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <View style={{ padding: 16, backgroundColor: colors.white, borderBottomWidth: 1, borderColor: colors.creamSoft }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.charcoal }}>{topic}</Text>
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.terracotta} />
        ) : (
          messages.map((msg) => (
            <View
              key={msg.id}
              style={{
                backgroundColor: colors.white,
                padding: 12,
                borderRadius: 12,
                marginBottom: 8,
                alignSelf: 'flex-start',
                maxWidth: '80%',
              }}
            >
              <Text style={{ fontSize: 12, color: colors.terracotta, fontWeight: 'bold', marginBottom: 2 }}>
                {msg.sender?.fullName || 'Χρήστης'}
              </Text>
              <Text style={{ color: colors.charcoal, fontSize: 15 }}>{msg.text}</Text>
            </View>
          ))
        )}
      </ScrollView>

      <View style={{ padding: 12, backgroundColor: colors.white, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <TextInput
          placeholder="Γράψτε ένα μήνυμα..."
          value={text}
          onChangeText={setText}
          style={{ flex: 1, backgroundColor: colors.creamSoft, padding: 12, borderRadius: 20 }}
        />
        <TouchableOpacity
          onPress={handleSend}
          style={{ backgroundColor: colors.terracotta, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20 }}
        >
          <Text style={{ color: colors.white, fontWeight: 'bold' }}>Αποστολή</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
