import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import MapView, { Marker, type Region } from 'react-native-maps';

import { Field, Textarea, ChipSelect } from '@/components/Field';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Colors, Radii, Shadows, Spacing } from '@/theme';
import { reportsApi } from '@/services/reports';
import { getCurrentLocation, type ResolvedLocation } from '@/services/location';
import { useAuthStore } from '@/services/auth';
import { useT } from '@/services/i18n';
import type { StrayReportDto } from '@/types';

export const ReportScreen = () => {
  const me = useAuthStore((s) => s.user);
  const t = useT();

  const [image, setImage] = useState<{ uri: string } | null>(null);
  const [condition, setCondition] = useState<StrayReportDto['condition'] | null>(null);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<ResolvedLocation | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [region, setRegion] = useState<Region | null>(null);

  const CONDITIONS: { label: string; value: StrayReportDto['condition'] }[] = [
    { label: t('report.conditionMedical'), value: 'MEDICAL' },
    { label: t('report.conditionSterilization'), value: 'STERILIZATION' },
    { label: t('report.conditionLost'), value: 'LOST' },
    { label: t('report.conditionScare'), value: 'SCARE' },
  ];

  useEffect(() => {
    refreshLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshLocation = async () => {
    setLoadingLocation(true);
    try {
      const loc = await getCurrentLocation();
      setLocation(loc);
      setRegion({
        latitude: loc.latitude,
        longitude: loc.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
      useAuthStore.getState().setHomeLocation(loc.latitude, loc.longitude);
    } catch (err) {
      Alert.alert(t('report.locationError'), String(err));
    } finally {
      setLoadingLocation(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('report.photoPermission'), t('common.continue'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets[0]) {
      setImage({ uri: result.assets[0].uri });
      void Haptics.selectionAsync();
    }
  };

  const submit = async () => {
    if (!image) return Alert.alert(t('report.needPhoto'), t('report.needPhotoBody'));
    if (!condition) return Alert.alert(t('report.needCondition'), t('report.needConditionBody'));
    if (!location) return Alert.alert(t('report.needLocation'), t('report.needLocationBody'));

    setSubmitting(true);
    try {
      const report = await reportsApi.create({
        imageUrl: image.uri,
        condition,
        description: description.trim() || undefined,
        latitude: location.latitude,
        longitude: location.longitude,
        addressHint: location.addressHint,
      });

      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        t('report.submitted'),
        t('report.submittedBody', { municipality: report.assignedMunicipality ?? 'Δήμο' }),
        [
          {
            text: t('common.yes'),
            onPress: () => {
              setImage(null);
              setCondition(null);
              setDescription('');
            },
          },
        ],
      );
    } catch (err) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t('common.retry'), String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{
          padding: Spacing.xl,
          paddingBottom: Spacing.hero + 24,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={{
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 0.5,
            color: Colors.charcoalSoft,
          }}
        >
          {t('report.overline')}
        </Text>
        <Text
          style={{
            fontSize: 26,
            fontWeight: '700',
            color: Colors.charcoal,
            marginVertical: Spacing.xs,
            letterSpacing: -0.4,
          }}
        >
          {t('report.title')}
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: Colors.charcoalSoft,
            marginBottom: Spacing.lg,
          }}
        >
          {t('report.body')}
        </Text>

        {/* Photo */}
        <Pressable
          onPress={pickImage}
          android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
          style={[
            {
              height: 200,
              borderRadius: Radii.xl,
              backgroundColor: image ? Colors.charcoal : Colors.creamSoft,
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: Spacing.lg,
            },
            Shadows.soft,
          ]}
        >
          {image ? (
            <Image
              source={{ uri: image.uri }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          ) : (
            <View style={{ alignItems: 'center', padding: Spacing.lg }}>
              <Text style={{ fontSize: 36, marginBottom: 4 }}>📸</Text>
              <Text style={{ fontWeight: '700', color: Colors.charcoal }}>
                {t('report.photoTitle').replace('📸 ', '')}
              </Text>
              <Text style={{ fontSize: 12, color: Colors.charcoalSoft, marginTop: 4 }}>
                {t('report.photoHint')}
              </Text>
            </View>
          )}
        </Pressable>

        {/* Condition chips */}
        <ChipSelect
          label={t('report.conditionLabel')}
          value={condition}
          options={CONDITIONS}
          onChange={setCondition}
        />

        {/* Description */}
        <Textarea
          label={t('report.descriptionLabel')}
          value={description}
          onChangeText={setDescription}
          placeholder={t('report.descriptionPlaceholder')}
          maxLength={500}
        />

        {/* Location preview */}
        <Text
          style={{
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 0.5,
            color: Colors.charcoalSoft,
            marginTop: Spacing.md,
            marginBottom: 6,
          }}
        >
          {t('report.locationLabel')}
        </Text>
        <View
          style={[
            {
              height: 200,
              borderRadius: Radii.lg,
              backgroundColor: Colors.creamSoft,
              overflow: 'hidden',
              justifyContent: 'center',
              alignItems: 'center',
            },
            Shadows.hush,
          ]}
        >
          {loadingLocation ? (
            <ActivityIndicator color={Colors.terracotta} />
          ) : region ? (
            <MapView
              pointerEvents="none"
              style={{ width: '100%', height: '100%' }}
              initialRegion={region}
              liteMode
            >
              <Marker
                coordinate={{ latitude: region.latitude, longitude: region.longitude }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: Colors.crimson,
                    borderWidth: 3,
                    borderColor: Colors.white,
                  }}
                />
              </Marker>
            </MapView>
          ) : (
            <Text style={{ color: Colors.charcoalSoft }}>{t('report.locationError')}</Text>
          )}
        </View>
        <Pressable
          onPress={refreshLocation}
          android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
          style={{
            marginTop: Spacing.sm,
            alignSelf: 'flex-start',
            paddingHorizontal: Spacing.md,
            paddingVertical: 6,
            borderRadius: Radii.pill,
            backgroundColor: Colors.creamSoft,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.terracottaDeep }}>
            {t('report.refreshLocation')}
          </Text>
        </Pressable>

        <View style={{ height: Spacing.xl }} />

        <PrimaryButton
          title={t('report.submit')}
          onPress={submit}
          loading={submitting}
          variant="danger"
        />
      </ScrollView>
    </SafeAreaView>
  );
};
