import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors } from '../../theme/tokens';
import type { ItemType, TransactionStatus } from '../../types/domain';
import { AppText } from '../atoms';
import { styles } from './StatusStepper.styles';

export interface StatusStepperProps {
  status: TransactionStatus;
  itemType: ItemType;
}

/**
 * Four-step timeline for a transaction: request → accept → handover →
 * return (three for a GIFT). Filled up to the current step; a rejected or
 * cancelled transaction shows the step it stopped at in red.
 */
export function StatusStepper({ status, itemType }: StatusStepperProps) {
  const { t } = useTranslation();
  const steps = [
    t('transactions.step.request'),
    t('transactions.step.accept'),
    t('transactions.step.deliver'),
    ...(itemType === 'GIFT' ? [] : [t('transactions.step.return')]),
  ];
  const reached: Record<TransactionStatus, number> = {
    PENDING: 0,
    ACCEPTED: 1,
    DELIVERED: 2,
    RETURNED: 3,
    REJECTED: 0,
    CANCELLED: 1,
  };
  const current = reached[status];
  const stopped = status === 'REJECTED' || status === 'CANCELLED';

  return (
    <View style={styles.row}>
      {steps.map((label, index) => {
        const done = index <= current && !stopped;
        const failed = stopped && index === current;
        const future = index > current;
        return (
          <View key={label} style={styles.step}>
            <View style={styles.line}>
              {index > 0 ? <View style={[styles.connector, !future && !failed && styles.connectorDone]} /> : null}
              <View style={[styles.dot, done && styles.dotDone, failed && styles.dotFailed]}>
                {done ? <MaterialCommunityIcons name="check" size={12} color={colors.textOnDark} /> : null}
                {failed ? <MaterialCommunityIcons name="close" size={12} color={colors.textOnDark} /> : null}
              </View>
            </View>
            <AppText variant="caption" tone={future ? 'subtle' : 'default'} style={styles.label}>
              {label}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}
