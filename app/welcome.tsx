import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Button } from '../src/components';
import { styles } from '../src/screens/welcome.styles';
import { colors } from '../src/theme/tokens';

/**
 * First screen for a new user. One promise, three mode pills that preview
 * the colour language, and the sign-in options in the thumb zone.
 */
export default function WelcomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.hero}>
        <Animated.View entering={FadeInUp.delay(100).duration(500)} style={styles.mark}>
          <MaterialCommunityIcons name="home-heart" size={40} color={colors.textOnDark} />
        </Animated.View>
        <Animated.View entering={FadeInUp.delay(200).duration(500)}>
          <AppText variant="display" style={styles.title}>
            StreetShelf
          </AppText>
          <AppText variant="title" style={styles.tagline}>
            {t('welcome.tagline')}
          </AppText>
        </Animated.View>
        <Animated.View entering={FadeInUp.delay(300).duration(500)}>
          <AppText tone="muted" style={styles.body}>
            {t('welcome.body')}
          </AppText>
        </Animated.View>
        <Animated.View entering={FadeInUp.delay(400).duration(500)} style={styles.pills}>
          <View style={[styles.pill, styles.pillLend]}>
            <AppText variant="captionBold" style={styles.pillLendText}>🤝 {t('welcome.pill1')}</AppText>
          </View>
          <View style={[styles.pill, styles.pillRent]}>
            <AppText variant="captionBold" style={styles.pillRentText}>🏷️ {t('welcome.pill2')}</AppText>
          </View>
          <View style={[styles.pill, styles.pillGift]}>
            <AppText variant="captionBold" style={styles.pillGiftText}>🎁 {t('welcome.pill3')}</AppText>
          </View>
        </Animated.View>
      </View>

      <View style={styles.actions}>
        <Button
          label={t('welcome.email')}
          variant="accent"
          size="lg"
          icon="email-outline"
          fullWidth
          onPress={() => router.push('/auth/email')}
        />
        <AppText variant="caption" tone="subtle" style={styles.legal}>
          {t('welcome.legal')}
        </AppText>
      </View>
    </SafeAreaView>
  );
}
