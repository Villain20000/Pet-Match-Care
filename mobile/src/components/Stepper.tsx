/**
 * Stepper — animated 1..N indicator for multi-step flows. Apple-style
 * dots + labels so users know where they are and how many steps remain.
 */
import { View, Text } from 'react-native';
import { Colors, Spacing } from '@/theme';

interface StepperProps {
  current: number;
  labels: string[];
}

export const Stepper = ({ current, labels }: StepperProps) => (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      gap: 8,
    }}
  >
    {labels.map((label, index) => {
      const step = index + 1;
      const isCurrent = step === current;
      const isDone = step < current;
      return (
        <View key={label} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              width: 26,
              height: 26,
              borderRadius: 13,
              backgroundColor: isCurrent
                ? Colors.terracotta
                : isDone
                ? Colors.sage
                : Colors.creamSoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                color: isCurrent || isDone ? Colors.white : Colors.charcoalSoft,
                fontWeight: '700',
                fontSize: 12,
              }}
            >
              {isDone ? '✓' : step}
            </Text>
          </View>
          <Text
            style={{
              marginLeft: 6,
              color: isCurrent ? Colors.charcoal : Colors.charcoalSoft,
              fontWeight: isCurrent ? '700' : '500',
              fontSize: 12,
            }}
          >
            {label}
          </Text>
          {step < labels.length ? (
            <View
              style={{
                width: 20,
                height: 1,
                backgroundColor: Colors.creamDeep,
                marginHorizontal: 8,
              }}
            />
          ) : null}
        </View>
      );
    })}
  </View>
);
