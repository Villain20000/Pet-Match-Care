import { TextInput, TextInputProps, View, Text, Pressable } from 'react-native';
import { Colors, Radii, Shadows, Spacing } from '@/theme';
import * as Haptics from 'expo-haptics';

interface FieldProps extends TextInputProps {
  label: string;
}

export const Field = ({ label, style, ...rest }: FieldProps) => (
  <View style={{ marginBottom: Spacing.md }}>
    <Text
      style={{
        fontSize: 11,
        letterSpacing: 0.5,
        fontWeight: '700',
        color: Colors.charcoalSoft,
        marginBottom: 6,
      }}
    >
      {label.toUpperCase()}
    </Text>
    <TextInput
      placeholderTextColor={Colors.charcoalSoft + '88'}
      style={[
        {
          backgroundColor: Colors.white,
          paddingHorizontal: Spacing.lg,
          paddingVertical: Spacing.md,
          borderRadius: Radii.md,
          fontSize: 15,
          color: Colors.charcoal,
          borderWidth: 1,
          borderColor: Colors.creamDeep,
        },
        Shadows.hush,
        style,
      ]}
      {...rest}
    />
  </View>
);

interface TextareaProps extends TextInputProps {
  label: string;
}

export const Textarea = ({ label, style, ...rest }: TextareaProps) => (
  <View style={{ marginBottom: Spacing.md }}>
    <Text
      style={{
        fontSize: 11,
        letterSpacing: 0.5,
        fontWeight: '700',
        color: Colors.charcoalSoft,
        marginBottom: 6,
      }}
    >
      {label.toUpperCase()}
    </Text>
    <TextInput
      multiline
      numberOfLines={4}
      textAlignVertical="top"
      placeholderTextColor={Colors.charcoalSoft + '88'}
      style={[
        {
          backgroundColor: Colors.white,
          paddingHorizontal: Spacing.lg,
          paddingVertical: Spacing.md,
          borderRadius: Radii.md,
          fontSize: 15,
          color: Colors.charcoal,
          minHeight: 96,
          borderWidth: 1,
          borderColor: Colors.creamDeep,
        },
        Shadows.hush,
        style,
      ]}
      {...rest}
    />
  </View>
);

interface ChipSelectProps<T extends string> {
  label: string;
  value: T | null;
  options: { label: string; value: T }[];
  onChange: (v: T) => void;
}

export function ChipSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: ChipSelectProps<T>) {
  return (
    <View style={{ marginBottom: Spacing.md }}>
      <Text
        style={{
          fontSize: 11,
          letterSpacing: 0.5,
          fontWeight: '700',
          color: Colors.charcoalSoft,
          marginBottom: 8,
        }}
      >
        {label.toUpperCase()}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => {
                void Haptics.selectionAsync();
                onChange(opt.value);
              }}
              android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
              style={{
                paddingHorizontal: Spacing.lg,
                paddingVertical: Spacing.sm + 2,
                borderRadius: Radii.pill,
                backgroundColor: active ? Colors.terracotta : Colors.creamSoft,
                borderWidth: 1,
                borderColor: active ? Colors.terracottaDeep : 'transparent',
              }}
            >
              <Text
                style={{
                  fontWeight: '600',
                  fontSize: 13,
                  color: active ? Colors.white : Colors.charcoal,
                  letterSpacing: 0.1,
                }}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
